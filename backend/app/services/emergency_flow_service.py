from __future__ import annotations

import re
from datetime import datetime
from uuid import uuid4

from app.core.settings import get_settings
from app.integrations.bailian.client import BailianClient
from app.repositories.file_store.json_file_repository import JsonFileRepository
from app.schemas.emergency import (
    DemandPackage,
    EmergencyFlowResponse,
    EmergencyReportCreate,
    RoutingDecision,
    ServiceOrder,
)


class EmergencyFlowService:
    def __init__(
        self,
        repository: JsonFileRepository | None = None,
        bailian_client: BailianClient | None = None,
    ) -> None:
        self.repository = repository or JsonFileRepository()
        self.bailian_client = bailian_client or BailianClient()
        self.settings = get_settings()

    def get_scenario_count(self) -> int:
        catalog = self._load_catalog()
        return len(catalog)

    def handle_report(self, payload: EmergencyReportCreate) -> EmergencyFlowResponse:
        created_at = datetime.now()
        request_id = f"req-{created_at.strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}"
        ai_insight = self.bailian_client.analyze_report(payload)
        effective_description = ai_insight.transcript if ai_insight and ai_insight.transcript else payload.description.strip()
        if not effective_description:
            effective_description = "用户通过对话框提交了图片或语音材料，需结合附件判断急事类型。"
        resolved_location = self._resolve_location(payload.location, effective_description)
        scenario_code = self._detect_scenario(
            effective_description,
            payload.tags,
            ai_insight.category if ai_insight else None,
        )
        scenario = self._load_catalog().get(scenario_code) or self._load_catalog()["generic_emergency"]
        summary = ai_insight.summary if ai_insight and ai_insight.summary else self._build_summary(effective_description, scenario["category"])
        category = ai_insight.category if ai_insight and ai_insight.category else scenario["category"]
        urgency = ai_insight.urgency if ai_insight and ai_insight.urgency else scenario["urgency"]
        impact_scope = (
            ai_insight.impact_scope if ai_insight and ai_insight.impact_scope else scenario["impact_scope"]
        )
        risks = ai_insight.risks if ai_insight and ai_insight.risks else scenario["risks"]
        requires_immediate_visit = (
            ai_insight.requires_immediate_visit
            if ai_insight and ai_insight.requires_immediate_visit is not None
            else scenario["requires_immediate_visit"]
        )
        suggested_questions = (
            ai_insight.suggested_questions
            if ai_insight and ai_insight.suggested_questions
            else scenario["suggested_questions"]
        )
        temporary_guidance = (
            ai_insight.temporary_guidance
            if ai_insight and ai_insight.temporary_guidance
            else scenario["temporary_guidance"]
        )

        demand_package = DemandPackage(
            summary=summary,
            category=category,
            location=resolved_location,
            urgency=urgency,
            impact_scope=impact_scope,
            risks=risks,
            requires_immediate_visit=requires_immediate_visit,
            missing_fields=self._detect_missing_fields(resolved_location),
            suggested_questions=suggested_questions,
            temporary_guidance=temporary_guidance,
        )

        routing = scenario["routing"]
        rationale = list(routing["rationale"])
        if ai_insight and ai_insight.route_hint:
            rationale.insert(0, f"百炼辅助判断：{ai_insight.route_hint}")
        routing_decision = RoutingDecision(
            scenario_code=scenario_code,
            responsible_unit=routing["responsible_unit"],
            responsible_role=routing["responsible_role"],
            backup_units=routing["backup_units"],
            eta_minutes=routing["eta_minutes"],
            service_sla=routing["service_sla"],
            rationale=rationale,
        )

        order_id = f"order-{created_at.strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}"
        notes = list(scenario["service_order"]["notes"])
        if ai_insight:
            notes.insert(0, f"百炼增强已启用：{self.settings.bailian_vlm_model}")
            notes.extend(ai_insight.service_notes)
            if ai_insight.transcript:
                transcript_preview = ai_insight.transcript[:48]
                notes.append(f"语音转写摘要：{transcript_preview}")
        service_order = ServiceOrder(
            order_id=order_id,
            status="待派发",
            service_location=resolved_location,
            service_actions=scenario["service_order"]["service_actions"],
            notes=notes,
        )

        response = EmergencyFlowResponse(
            request_id=request_id,
            created_at=created_at,
            demand_package=demand_package,
            routing_decision=routing_decision,
            service_order=service_order,
        )

        self._persist_request(request_id, payload, response)
        self._persist_order(order_id, request_id, response)

        return response

    def _load_catalog(self) -> dict:
        catalog_path = self.settings.reference_dir / "scenario_catalog.json"
        return self.repository.read_json(catalog_path, default={})

    def _detect_scenario(self, description: str, tags: list[str], category: str | None = None) -> str:
        combined_text = f"{description} {' '.join(tags)} {category or ''}"

        if any(keyword in combined_text for keyword in ["水管", "漏水", "爆了", "积水", "跑水", "渗水", "给排水"]):
            return "water_pipe_burst"

        if any(keyword in combined_text for keyword in ["停电", "断电", "照明", "灯坏", "电力"]):
            return "power_failure"

        if any(keyword in combined_text for keyword in ["油烟", "餐馆", "餐饮", "噪声", "太吵", "扰民", "物业", "底商"]):
            return "restaurant_fume_noise"

        return "generic_emergency"

    def _build_summary(self, description: str, category: str) -> str:
        short_description = description.strip()
        if len(short_description) > 36:
            short_description = f"{short_description[:36]}..."
        return f"已识别为{category}，核心描述：{short_description}"

    def _resolve_location(self, location: str, description: str) -> str:
        location_tokens = ["栋", "单元", "楼", "层", "号"]
        if any(token in location for token in location_tokens):
            return location

        match = re.search(
            r"[\u4e00-\u9fa5A-Za-z0-9#-]*\d+栋(?:\d+单元)?(?:\d+(?:楼|层))?(?:电梯口|楼道|门口|附近)?",
            description,
        )
        return match.group(0) if match else location

    def _detect_missing_fields(self, location: str) -> list[str]:
        missing_fields: list[str] = []
        if any(token in location for token in ["底商", "餐馆", "商铺"]):
            if not any(token in location for token in ["号", "门牌", "餐馆", "店"]):
                missing_fields.append("餐馆名称或门牌号")
            return missing_fields

        location_tokens = ["栋", "单元", "楼", "层", "号"]
        if not any(token in location for token in location_tokens):
            missing_fields.append("楼栋或楼层信息")
        return missing_fields

    def _persist_request(
        self,
        request_id: str,
        payload: EmergencyReportCreate,
        response: EmergencyFlowResponse,
    ) -> None:
        path = self.settings.requests_dir / f"{request_id}.json"
        self.repository.write_json(
            path,
            {
                "request_id": request_id,
                "submitted_payload": payload.model_dump(mode="json"),
                "processing_result": response.model_dump(mode="json"),
            },
        )

    def _persist_order(self, order_id: str, request_id: str, response: EmergencyFlowResponse) -> None:
        path = self.settings.orders_dir / f"{order_id}.json"
        self.repository.write_json(
            path,
            {
                "order_id": order_id,
                "request_id": request_id,
                "service_order": response.service_order.model_dump(mode="json"),
                "routing_decision": response.routing_decision.model_dump(mode="json"),
            },
        )
