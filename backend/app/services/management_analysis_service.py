from __future__ import annotations

import json
import random
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Any
from uuid import uuid4

import httpx

from app.core.settings import get_settings
from app.schemas.management import (
    CategoryMetric,
    ManagementAgentStep,
    ManagementAnalysisResult,
    ManagementQueryCreate,
    RegionInsight,
    SimulatedAppeal,
    TimeSeriesPoint,
)


COMMUNITIES = [
    ("知春里社区", "知春里小区南门", 39.9779, 116.3396),
    ("科源社区", "科学院南路公交站", 39.9842, 116.3268),
    ("双榆树北里", "双榆树北里 8 号楼", 39.9708, 116.3253),
    ("中关村东里", "中关村东里社区卫生站", 39.9821, 116.3336),
    ("海淀南路社区", "海淀南路商圈", 39.9754, 116.3154),
    ("黄庄社区", "黄庄地铁口周边", 39.9761, 116.3178),
    ("软件园社区", "软件园二期东门", 40.0518, 116.2939),
    ("学院路社区", "学院路街角公园", 39.9973, 116.3497),
]


TOPIC_LIBRARY = {
    "heatstroke": {
        "match": ["中暑", "高温", "暑热", "降温", "夏天", "医疗资源"],
        "topic": "夏季中暑与高温健康风险",
        "categories": ["中暑求助", "高温不适", "独居老人巡访", "户外劳动保障", "降温物资咨询"],
        "resources": ["社区卫生站", "流动医疗点", "避暑纳凉点", "急救转运", "防暑物资"],
        "groups": ["独居老人", "户外工作者", "慢病居民", "儿童", "普通居民"],
        "answer_focus": "医疗资源、避暑点位和重点人群巡访",
    },
    "fume_noise": {
        "match": ["油烟", "噪声", "餐馆", "夜间", "扰民", "物业"],
        "topic": "餐饮油烟与夜间噪声治理",
        "categories": ["餐饮油烟", "夜间噪声", "物业协调", "占道经营", "重复投诉"],
        "resources": ["街道综合执法", "生态环境核查", "市场监管", "社区协调", "夜间巡查"],
        "groups": ["底商周边居民", "老人", "学生家庭", "商户", "物业人员"],
        "answer_focus": "夜间联合核查、重复投诉商户和属地协同",
    },
    "eldercare": {
        "match": ["养老", "老人", "助餐", "居家照护", "慢病", "照护"],
        "topic": "社区养老与居家照护供给",
        "categories": ["助餐需求", "上门照护", "慢病随访", "适老化改造", "紧急呼叫"],
        "resources": ["养老驿站", "家庭医生", "助餐点", "社区志愿者", "适老化服务商"],
        "groups": ["独居老人", "失能老人", "慢病老人", "空巢家庭", "低保老人"],
        "answer_focus": "养老服务站点、家庭医生和重点老人清单",
    },
    "traffic": {
        "match": ["交通", "拥堵", "停车", "道路", "通行", "施工"],
        "topic": "道路交通与通行秩序",
        "categories": ["道路拥堵", "停车冲突", "施工围挡", "非机动车乱停", "路面破损"],
        "resources": ["交通协管", "市政维修", "停车治理", "施工协调", "交管联动"],
        "groups": ["通勤居民", "商圈访客", "骑行人群", "老人儿童", "沿街商户"],
        "answer_focus": "高峰通行、停车治理和施工协调",
    },
    "generic": {
        "match": [],
        "topic": "综合公共服务诉求",
        "categories": ["物业管理", "市政维修", "便民咨询", "环境卫生", "安全隐患"],
        "resources": ["社区受理台", "街道派单", "物业联络", "市政维修", "网格员巡查"],
        "groups": ["普通居民", "老人", "上班族", "学生家庭", "商户"],
        "answer_focus": "诉求分类、资源调度和热点治理",
    },
}


class ManagementAnalysisService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def analyze(self, payload: ManagementQueryCreate) -> ManagementAnalysisResult:
        created_at = datetime.now()
        profile = self._build_profile(payload.question)
        ai_profile = self._call_ai_profile(payload)
        if ai_profile:
            profile.update({key: value for key, value in ai_profile.items() if value})

        records = self._simulate_records(payload, profile, created_at)
        time_series = self._build_time_series(records)
        category_metrics = self._build_category_metrics(records)
        region_insights = self._build_region_insights(records)
        answer, recommendations = self._build_answer(payload, profile, records, region_insights, category_metrics)

        agent_steps = [
            ManagementAgentStep(
                key="question_extract",
                title="问题理解 Agent",
                input_summary=payload.question,
                output_summary=f"识别主题：{profile['topic']}；关注：{profile['answer_focus']}",
                evidence=list(profile["keywords"])[:5],
                confidence=0.91,
            ),
            ManagementAgentStep(
                key="data_simulation",
                title="诉求模拟 Agent",
                input_summary=f"区域：{payload.area}；时间范围：{payload.horizon_days} 天",
                output_summary="已模拟生成 50 条匿名群众诉求，覆盖时间、地点、人群、资源需求和严重程度。",
                evidence=[f"高风险诉求 {sum(1 for item in records if item.severity == 'high')} 条", f"覆盖社区 {len(set(item.community for item in records))} 个"],
                confidence=0.87,
            ),
            ManagementAgentStep(
                key="spacetime_analysis",
                title="时空聚合 Agent",
                input_summary="读取 50 条模拟诉求的时间、社区和坐标字段",
                output_summary=f"发现 {region_insights[0].name} 为最高热点，{time_series[-1].label} 为近期高峰。",
                evidence=[f"{item.name}: {item.count} 件" for item in region_insights[:3]],
                confidence=0.89,
            ),
            ManagementAgentStep(
                key="policy_answer",
                title="资源建议 Agent",
                input_summary="综合类别占比、热点区域、严重程度和资源字段",
                output_summary=answer,
                evidence=recommendations[:3],
                confidence=0.86,
            ),
        ]

        return ManagementAnalysisResult(
            analysis_id=f"mgmt-{created_at.strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}",
            created_at=created_at,
            original_question=payload.question,
            normalized_question=f"围绕“{profile['topic']}”分析 {payload.area} 的公共服务资源配置。",
            topic=profile["topic"],
            extracted_keywords=list(profile["keywords"])[:8],
            simulated_count=len(records),
            records=records,
            agent_steps=agent_steps,
            time_series=time_series,
            category_metrics=category_metrics,
            region_insights=region_insights,
            answer=answer,
            recommendations=recommendations,
        )

    def _build_profile(self, question: str) -> dict[str, Any]:
        for profile in TOPIC_LIBRARY.values():
            if any(keyword in question for keyword in profile["match"]):
                return {
                    **profile,
                    "keywords": [keyword for keyword in profile["match"] if keyword in question] or profile["match"][:3],
                }
        generic = TOPIC_LIBRARY["generic"]
        keywords = [token for token in re.split(r"[，。？?、\s]+", question) if len(token) >= 2]
        return {**generic, "keywords": keywords[:6] or ["公共服务", "资源配置"]}

    def _call_ai_profile(self, payload: ManagementQueryCreate) -> dict[str, Any] | None:
        if not self.settings.bailian_api_key:
            return None

        system_prompt = (
            "你是公共服务治理分析 Agent。请把管理人员的问题解析成 JSON，"
            "字段为 topic, keywords, categories, resources, groups, answer_focus。"
            "categories/resources/groups 都是 5 个中文短语数组。只输出 JSON。"
        )
        body = {
            "model": self.settings.bailian_vlm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"问题：{payload.question}\n区域：{payload.area}\n时间范围：{payload.horizon_days} 天"},
            ],
            "temperature": 0.25,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.bailian_api_key}",
            "Content-Type": "application/json",
        }
        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(f"{self.settings.bailian_base_url}/chat/completions", headers=headers, json=body)
                response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            match = re.search(r"\{[\s\S]*\}", content)
            parsed = json.loads(match.group(0) if match else content)
        except Exception:
            return None

        return {
            "topic": str(parsed.get("topic") or "").strip(),
            "keywords": self._list_or_empty(parsed.get("keywords")),
            "categories": self._list_or_empty(parsed.get("categories"))[:5],
            "resources": self._list_or_empty(parsed.get("resources"))[:5],
            "groups": self._list_or_empty(parsed.get("groups"))[:5],
            "answer_focus": str(parsed.get("answer_focus") or "").strip(),
        }

    def _simulate_records(self, payload: ManagementQueryCreate, profile: dict[str, Any], now: datetime) -> list[SimulatedAppeal]:
        seed = sum(ord(char) for char in f"{payload.question}{payload.area}{payload.horizon_days}")
        rng = random.Random(seed)
        categories = profile["categories"]
        resources = profile["resources"]
        groups = profile["groups"]
        records: list[SimulatedAppeal] = []

        for index in range(50):
            community, location, lat, lng = rng.choice(COMMUNITIES)
            category = rng.choices(categories, weights=[30, 24, 18, 16, 12], k=1)[0]
            severity = rng.choices(["low", "medium", "high"], weights=[24, 48, 28], k=1)[0]
            group = rng.choice(groups)
            resource = rng.choice(resources)
            days_back = rng.randrange(payload.horizon_days)
            hour = rng.choices([8, 10, 14, 17, 20, 22], weights=[10, 14, 16, 14, 24, 22], k=1)[0]
            created_at = now - timedelta(days=days_back, hours=now.hour - hour, minutes=rng.randrange(60))
            records.append(
                SimulatedAppeal(
                    case_id=f"SIM-{now.strftime('%m%d')}-{index + 1:03d}",
                    created_at=created_at,
                    district=payload.area,
                    community=community,
                    location_label=location,
                    latitude=round(lat + rng.uniform(-0.002, 0.002), 6),
                    longitude=round(lng + rng.uniform(-0.002, 0.002), 6),
                    category=category,
                    severity=severity,
                    population_group=group,
                    description=self._build_description(profile["topic"], category, group, location),
                    requested_resource=resource,
                    status=rng.choices(["待受理", "已派单", "处理中", "已办结"], weights=[14, 32, 34, 20], k=1)[0],
                )
            )

        return sorted(records, key=lambda item: item.created_at)

    def _build_description(self, topic: str, category: str, group: str, location: str) -> str:
        return f"{location}附近有{group}反映“{category}”问题，属于{topic}相关诉求，希望街道协调资源处理。"

    def _build_time_series(self, records: list[SimulatedAppeal]) -> list[TimeSeriesPoint]:
        grouped: dict[str, list[SimulatedAppeal]] = defaultdict(list)
        for record in records:
            grouped[record.created_at.strftime("%m-%d")].append(record)
        return [
            TimeSeriesPoint(
                label=label,
                count=len(items),
                high_severity=sum(1 for item in items if item.severity == "high"),
            )
            for label, items in sorted(grouped.items())
        ]

    def _build_category_metrics(self, records: list[SimulatedAppeal]) -> list[CategoryMetric]:
        counter = Counter(record.category for record in records)
        total = len(records) or 1
        return [
            CategoryMetric(label=label, count=count, ratio=round(count / total * 100, 1))
            for label, count in counter.most_common()
        ]

    def _build_region_insights(self, records: list[SimulatedAppeal]) -> list[RegionInsight]:
        grouped: dict[str, list[SimulatedAppeal]] = defaultdict(list)
        for record in records:
            grouped[record.community].append(record)

        insights: list[RegionInsight] = []
        for community, items in grouped.items():
            top_category = Counter(item.category for item in items).most_common(1)[0][0]
            high_count = sum(1 for item in items if item.severity == "high")
            first = items[0]
            insights.append(
                RegionInsight(
                    name=community,
                    count=len(items),
                    high_severity=high_count,
                    top_category=top_category,
                    recommended_action=f"优先补充 {Counter(item.requested_resource for item in items).most_common(1)[0][0]}，处理 {top_category} 高峰。",
                    latitude=first.latitude,
                    longitude=first.longitude,
                )
            )
        return sorted(insights, key=lambda item: (item.count, item.high_severity), reverse=True)

    def _build_answer(
        self,
        payload: ManagementQueryCreate,
        profile: dict[str, Any],
        records: list[SimulatedAppeal],
        regions: list[RegionInsight],
        categories: list[CategoryMetric],
    ) -> tuple[str, list[str]]:
        high_count = sum(1 for item in records if item.severity == "high")
        top_region = regions[0]
        top_category = categories[0]
        answer = (
            f"针对“{payload.question}”，系统模拟了 {len(records)} 条群众诉求。"
            f"其中高风险 {high_count} 条，热点集中在{top_region.name}，主要问题是{top_category.label}。"
            f"建议围绕{profile['answer_focus']}进行分层配置：热点社区优先增配，普通社区保持巡查和线上分流。"
        )
        recommendations = [
            f"在{top_region.name}优先投放与“{top_region.top_category}”相关的资源，形成 24 小时内响应清单。",
            f"将高风险诉求按社区排序，先处理 {high_count} 条 high 级别事项。",
            f"把{categories[0].label}、{categories[1].label if len(categories) > 1 else categories[0].label}作为本周专题分析口径。",
            "保留人工确认节点，对跨部门或信息不足事项先补字段再派单。",
        ]
        return answer, recommendations

    def _list_or_empty(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [item.strip() for item in re.split(r"[,，、;；\n]", value) if item.strip()]
        return []
