from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AttachmentMeta(BaseModel):
    name: str = Field(..., description="Original file name.")
    mime_type: str = Field(..., description="Attachment MIME type.")
    stored_path: str | None = Field(default=None, description="Stored file path.")


class UploadAttachmentsResponse(BaseModel):
    attachments: list[AttachmentMeta]


class EmergencyReportCreate(BaseModel):
    reporter_name: str = Field(default="匿名居民", max_length=50)
    contact: str | None = Field(default=None, max_length=50)
    location: str = Field(default="待识别位置", min_length=2, description="楼栋、单元、楼层等位置说明")
    description: str = Field(default="", description="居民描述的急事内容")
    input_type: Literal["text", "audio", "image"] = "text"
    tags: list[str] = Field(default_factory=list)
    attachments: list[AttachmentMeta] = Field(default_factory=list)


class BailianEmergencyInsight(BaseModel):
    summary: str | None = None
    category: str | None = None
    urgency: Literal["low", "medium", "high"] | None = None
    impact_scope: str | None = None
    risks: list[str] = Field(default_factory=list)
    requires_immediate_visit: bool | None = None
    suggested_questions: list[str] = Field(default_factory=list)
    temporary_guidance: list[str] = Field(default_factory=list)
    route_hint: str | None = None
    service_notes: list[str] = Field(default_factory=list)
    transcript: str | None = None


class DemandPackage(BaseModel):
    summary: str
    category: str
    location: str
    urgency: Literal["low", "medium", "high"]
    impact_scope: str
    risks: list[str]
    requires_immediate_visit: bool
    missing_fields: list[str]
    suggested_questions: list[str]
    temporary_guidance: list[str]


class RoutingDecision(BaseModel):
    scenario_code: str
    responsible_unit: str
    responsible_role: str
    backup_units: list[str]
    eta_minutes: int
    service_sla: str
    rationale: list[str]


class ServiceOrder(BaseModel):
    order_id: str
    status: Literal["待派发", "已派发", "处理中"]
    service_location: str
    service_actions: list[str]
    notes: list[str]


class EmergencyFlowResponse(BaseModel):
    request_id: str
    created_at: datetime
    demand_package: DemandPackage
    routing_decision: RoutingDecision
    service_order: ServiceOrder
