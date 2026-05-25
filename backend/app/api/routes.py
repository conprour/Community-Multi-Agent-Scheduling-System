from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.repositories.uploads.upload_file_repository import UploadFileRepository
from app.schemas.emergency import EmergencyFlowResponse, EmergencyReportCreate, UploadAttachmentsResponse
from app.schemas.management import ManagementAnalysisResult, ManagementQueryCreate
from app.services.emergency_flow_service import EmergencyFlowService
from app.services.management_analysis_service import ManagementAnalysisService


router = APIRouter()
service = EmergencyFlowService()
management_service = ManagementAnalysisService()
upload_repository = UploadFileRepository()


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "storage": "file",
        "scenario_count": service.get_scenario_count(),
        "bailian_configured": service.bailian_client.is_configured(),
    }


@router.post("/api/uploads", response_model=UploadAttachmentsResponse)
async def upload_files(files: list[UploadFile] = File(...)) -> UploadAttachmentsResponse:
    attachments = await upload_repository.save_many(files)
    return UploadAttachmentsResponse(attachments=attachments)


@router.post("/api/intake/submit", response_model=EmergencyFlowResponse)
def submit_emergency(payload: EmergencyReportCreate) -> EmergencyFlowResponse:
    return service.handle_report(payload)


@router.post("/api/management/analyze", response_model=ManagementAnalysisResult)
def analyze_management_question(payload: ManagementQueryCreate) -> ManagementAnalysisResult:
    return management_service.analyze(payload)
