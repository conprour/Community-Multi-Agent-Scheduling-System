from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    app_name: str
    api_prefix: str
    cors_origins: list[str]
    project_root: Path
    data_dir: Path
    requests_dir: Path
    orders_dir: Path
    services_dir: Path
    reference_dir: Path
    uploads_dir: Path
    runtime_dir: Path
    bailian_api_key: str
    bailian_base_url: str
    bailian_vlm_model: str
    bailian_intent_model: str
    bailian_asr_model: str


@lru_cache
def get_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[3]
    load_dotenv(project_root / ".env")
    data_dir = project_root / "data"

    return Settings(
        app_name="Community Multi Agent Scheduling System API",
        api_prefix="/api",
        cors_origins=_parse_origins(
            os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
        ),
        project_root=project_root,
        data_dir=data_dir,
        requests_dir=data_dir / "requests",
        orders_dir=data_dir / "orders",
        services_dir=data_dir / "services",
        reference_dir=data_dir / "reference",
        uploads_dir=data_dir / "uploads",
        runtime_dir=data_dir / "runtime",
        bailian_api_key=os.getenv("BAILIAN_API_KEY", ""),
        bailian_base_url=os.getenv(
            "BAILIAN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"
        ),
        bailian_vlm_model=os.getenv("BAILIAN_VLM_MODEL", "qwen3.6-plus"),
        bailian_intent_model=os.getenv("BAILIAN_INTENT_MODEL", "qwen-turbo"),
        bailian_asr_model=os.getenv("BAILIAN_ASR_MODEL", "fun-asr-realtime-2026-02-28"),
    )


def _parse_origins(raw_origins: str) -> list[str]:
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def ensure_data_directories() -> None:
    settings = get_settings()
    for path in (
        settings.data_dir,
        settings.requests_dir,
        settings.orders_dir,
        settings.services_dir,
        settings.reference_dir,
        settings.uploads_dir,
        settings.runtime_dir,
    ):
        path.mkdir(parents=True, exist_ok=True)
