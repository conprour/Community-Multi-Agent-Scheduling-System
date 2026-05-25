from __future__ import annotations

import base64
import json
import mimetypes
import re
from http import HTTPStatus
from pathlib import Path
from typing import Any

import dashscope
import httpx
from dashscope.audio.asr import Recognition

from app.core.settings import get_settings
from app.schemas.emergency import BailianEmergencyInsight, EmergencyReportCreate


class BailianClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def is_configured(self) -> bool:
        return bool(self.settings.bailian_api_key)

    def analyze_report(self, payload: EmergencyReportCreate) -> BailianEmergencyInsight | None:
        if not self.is_configured():
            return None

        transcript = None
        if payload.input_type == "audio":
            transcript = self._transcribe_primary_audio(payload)

        effective_description = transcript or payload.description.strip()
        if not effective_description and self._build_image_parts(payload):
            effective_description = "用户上传了现场图片，请结合图片判断社区急事类型、风险和处置建议。"
        if not effective_description:
            return None

        try:
            insight = self._call_vlm(payload, effective_description)
        except Exception:
            return None

        if insight and transcript:
            insight.transcript = transcript

        return insight

    def classify_confirmation_intent(self, text: str) -> bool | None:
        if not self.is_configured():
            return None

        prompt = text.strip()
        if not prompt:
            return None

        headers = {
            "Authorization": f"Bearer {self.settings.bailian_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.settings.bailian_intent_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你只判断居民这句话是否是在确认客服刚才复述的诉求。"
                        "只输出 JSON：{\"confirmed\": true} 或 {\"confirmed\": false}。"
                        "如果用户是在补充、否认、修改、取消或表达不确定，confirmed 必须为 false。"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
            "max_tokens": 24,
        }

        try:
            with httpx.Client(timeout=4.0) as client:
                response = client.post(
                    f"{self.settings.bailian_base_url}/chat/completions",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
                payload_data = response.json()
        except Exception:
            return None

        raw_content = self._extract_message_text(payload_data)
        parsed = self._parse_json_content(raw_content)
        if isinstance(parsed, dict) and isinstance(parsed.get("confirmed"), bool):
            return parsed["confirmed"]

        normalized = raw_content.strip().lower()
        if "true" in normalized:
            return True
        if "false" in normalized:
            return False
        return None

    def _call_vlm(
        self,
        payload: EmergencyReportCreate,
        effective_description: str,
    ) -> BailianEmergencyInsight | None:
        community_name = payload.community_name or "未提供"
        system_prompt = (
            "你是面向社区接诉即办与 12345 的民生诉求受理 Agent。"
            f"当前诉求人姓名是{payload.reporter_name}，所在小区是{community_name}。"
            "如需提及小区，必须使用这个具体小区名称，不要使用“XX小区”等占位写法。"
            "请根据用户输入和现场图片，输出一个 JSON 对象，不要输出 Markdown。"
            "JSON 字段必须包含：summary, category, urgency, impact_scope, risks, "
            "requires_immediate_visit, suggested_questions, temporary_guidance, route_hint, service_notes。"
            "urgency 只能是 low、medium、high。"
        )

        content: str | list[dict[str, Any]] = self._build_message_content(payload, effective_description)
        headers = {
            "Authorization": f"Bearer {self.settings.bailian_api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.settings.bailian_vlm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
            "temperature": 0.2,
        }

        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                f"{self.settings.bailian_base_url}/chat/completions",
                headers=headers,
                json=body,
            )
            response.raise_for_status()
            payload_data = response.json()

        raw_content = self._extract_message_text(payload_data)
        parsed = self._parse_json_content(raw_content)
        if not parsed:
            return None

        parsed = self._normalize_parsed_payload(parsed)

        return BailianEmergencyInsight.model_validate(parsed)

    def _build_message_content(
        self,
        payload: EmergencyReportCreate,
        effective_description: str,
    ) -> str | list[dict[str, Any]]:
        prompt = "\n".join(
            [
                f"诉求人：{payload.reporter_name}",
                f"所在小区：{payload.community_name or '未提供'}",
                f"联系方式：{payload.contact or '未提供'}",
                f"发生位置：{payload.location}",
                f"输入方式：{payload.input_type}",
                f"标签：{', '.join(payload.tags) if payload.tags else '无'}",
                f"描述内容：{effective_description}",
            ]
        )

        image_parts = self._build_image_parts(payload)
        if not image_parts:
            return prompt

        return [{"type": "text", "text": prompt}, *image_parts]

    def _build_image_parts(self, payload: EmergencyReportCreate) -> list[dict[str, Any]]:
        image_parts: list[dict[str, Any]] = []
        for attachment in payload.attachments[:2]:
            if not attachment.stored_path or not attachment.mime_type.startswith("image/"):
                continue
            image_path = self._resolve_path(attachment.stored_path)
            if not image_path.exists():
                continue
            image_parts.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": self._to_data_url(image_path, attachment.mime_type),
                    },
                }
            )
        return image_parts

    def _transcribe_primary_audio(self, payload: EmergencyReportCreate) -> str | None:
        audio_attachment = next(
            (attachment for attachment in payload.attachments if attachment.stored_path and attachment.mime_type.startswith("audio/")),
            None,
        )
        if not audio_attachment or not audio_attachment.stored_path:
            return None

        audio_path = self._resolve_path(audio_attachment.stored_path)
        if not audio_path.exists():
            return None

        dashscope.api_key = self.settings.bailian_api_key
        audio_format = audio_path.suffix.lower().lstrip(".") or "wav"
        recognition = Recognition(
            model=self.settings.bailian_asr_model,
            format=audio_format,
            sample_rate=16000,
            language_hints=["zh", "en"],
            callback=None,
        )
        result = recognition.call(str(audio_path))
        if result.status_code != HTTPStatus.OK:
            return None
        sentence = result.get_sentence()
        return sentence.strip() if sentence else None

    def _resolve_path(self, stored_path: str) -> Path:
        candidate = Path(stored_path)
        if candidate.is_absolute():
            return candidate
        return self.settings.project_root / candidate

    def _to_data_url(self, image_path: Path, mime_type: str | None) -> str:
        detected_mime = mime_type or mimetypes.guess_type(image_path.name)[0] or "image/png"
        encoded = base64.b64encode(image_path.read_bytes()).decode("utf-8")
        return f"data:{detected_mime};base64,{encoded}"

    def _extract_message_text(self, payload: dict[str, Any]) -> str:
        content = payload["choices"][0]["message"]["content"]
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "\n".join(part.get("text", "") for part in content if isinstance(part, dict))
        return str(content)

    def _parse_json_content(self, raw_content: str) -> dict[str, Any] | None:
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned, flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", cleaned)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None

    def _normalize_parsed_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(payload)
        normalized["risks"] = self._ensure_list(payload.get("risks"))
        normalized["suggested_questions"] = self._ensure_list(payload.get("suggested_questions"))
        normalized["temporary_guidance"] = self._ensure_list(payload.get("temporary_guidance"))
        normalized["service_notes"] = self._ensure_list(payload.get("service_notes"))
        if isinstance(payload.get("urgency"), str):
            normalized["urgency"] = payload["urgency"].strip().lower()
        return normalized

    def _ensure_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            separators = ["；", ";", "。", "\n", ",", "，"]
            normalized = value
            for separator in separators:
                normalized = normalized.replace(separator, "|")
            return [item.strip() for item in normalized.split("|") if item.strip()]
        return []
