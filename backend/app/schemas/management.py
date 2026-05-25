from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ManagementQueryCreate(BaseModel):
    question: str = Field(..., min_length=4, description="部门管理人员提出的公共服务分析问题")
    area: str = Field(default="中关村街道", description="分析区域")
    horizon_days: int = Field(default=14, ge=1, le=90, description="模拟和分析的时间范围")


class SimulatedAppeal(BaseModel):
    case_id: str
    created_at: datetime
    district: str
    community: str
    location_label: str
    latitude: float
    longitude: float
    category: str
    severity: Literal["low", "medium", "high"]
    population_group: str
    description: str
    requested_resource: str
    status: Literal["待受理", "已派单", "处理中", "已办结"]


class ManagementAgentStep(BaseModel):
    key: str
    title: str
    input_summary: str
    output_summary: str
    evidence: list[str]
    confidence: float


class TimeSeriesPoint(BaseModel):
    label: str
    count: int
    high_severity: int


class CategoryMetric(BaseModel):
    label: str
    count: int
    ratio: float


class RegionInsight(BaseModel):
    name: str
    count: int
    high_severity: int
    top_category: str
    recommended_action: str
    latitude: float
    longitude: float


class ManagementAnalysisResult(BaseModel):
    analysis_id: str
    created_at: datetime
    original_question: str
    normalized_question: str
    topic: str
    extracted_keywords: list[str]
    simulated_count: int
    records: list[SimulatedAppeal]
    agent_steps: list[ManagementAgentStep]
    time_series: list[TimeSeriesPoint]
    category_metrics: list[CategoryMetric]
    region_insights: list[RegionInsight]
    answer: str
    recommendations: list[str]
