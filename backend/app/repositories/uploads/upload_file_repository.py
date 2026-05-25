from __future__ import annotations

import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.settings import get_settings
from app.schemas.emergency import AttachmentMeta


class UploadFileRepository:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def save_many(self, files: list[UploadFile]) -> list[AttachmentMeta]:
        attachments: list[AttachmentMeta] = []
        for file in files:
            attachments.append(await self.save(file))
        return attachments

    async def save(self, file: UploadFile) -> AttachmentMeta:
        safe_name = self._sanitize_name(file.filename or "upload.bin")
        suffix = Path(safe_name).suffix
        file_name = f"{uuid4().hex}{suffix}"
        destination = self.settings.uploads_dir / file_name
        destination.parent.mkdir(parents=True, exist_ok=True)

        content = await file.read()
        destination.write_bytes(content)

        return AttachmentMeta(
            name=file.filename or safe_name,
            mime_type=file.content_type or "application/octet-stream",
            stored_path=str(destination.relative_to(self.settings.project_root)).replace("\\", "/"),
        )

    def _sanitize_name(self, file_name: str) -> str:
        sanitized = re.sub(r"[^a-zA-Z0-9._-]", "_", file_name)
        return sanitized[:120]
