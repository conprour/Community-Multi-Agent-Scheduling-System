# Community-Multi-Agent-Scheduling-System

面向社区接诉即办与 12345 的多智能体调度 demo，当前主案例聚焦“餐饮油烟 + 夜间噪声 + 物业协调失败”这类高频复合诉求，演示从群众提交、协作研判、责任匹配到政府部门工单与治理看板的完整闭环。

## 当前实现

- Vue 3 + Vite 前端页面，已拆分为群众提交端与政府/部门工作台
- FastAPI 后端最小接口
- 基于 `data/` 目录的 JSON 文件存储
- “餐饮油烟与夜间噪声扰民”主案例样例数据与规则模板
- 阿里云百炼 `qwen3.6-plus` 文本/图像增强已接入主链路
- 阿里云百炼 `fun-asr-realtime-2026-02-28` 语音识别已接入后端能力层
- 左侧对话框集成文本输入、图像上传和浏览器实时语音识别按钮
- 中间可视区支持点击需求端节点切换案例，并展示“需求节点 -> 诉求路由 Agent -> 供给节点”的动态派发
- 政府工作台展示标准工单、主协办部门、待补字段、部门负载、重复投诉、超时预警和治理建议
- 新增部门管理分析端：管理人员提出公共服务问题，后端生成 50 条模拟群众诉求，并展示 Agent 分析过程与数据看板
- 接口异常时前端回退本地 mock

## 目录结构

```text
Community-Multi-Agent-Scheduling-System/
	backend/
	frontend/
	data/
	.env.example
	.gitignore
	README.md
```

## 环境要求

- 后端固定使用本机 Anaconda 环境 `cinemind`
- 不新建 Python 虚拟环境
- Node.js 20 LTS 或以上

## 后端启动

在 PowerShell 中：

```powershell
(D:\Anaconda\shell\condabin\conda-hook.ps1)
conda activate cinemind
Set-Location D:\code2024\zgca_hackson\Community-Multi-Agent-Scheduling-System\backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

后端默认地址：

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

## 前端启动

在 PowerShell 中：

```powershell
Set-Location D:\code2024\zgca_hackson\Community-Multi-Agent-Scheduling-System\frontend
npm install
npm run dev
```

前端默认地址：

- `http://127.0.0.1:5173`
- 群众诉求链路：`http://127.0.0.1:5173/`
- 政府工单工作台：`http://127.0.0.1:5173/government`
- 部门管理分析端：`http://127.0.0.1:5173/management`
- 管理分析数据看板：`http://127.0.0.1:5173/management/dashboard`

## 环境变量

项目根目录已提供 `.env.example`，当前预留：

- `BAILIAN_API_KEY`
- `BAILIAN_BASE_URL`
- `BAILIAN_VLM_MODEL`
- `BAILIAN_ASR_MODEL`
- `CORS_ORIGINS`
- `VITE_API_BASE_URL`

## 样例接口

- `GET /health`
- `POST /api/uploads`
- `POST /api/intake/submit`
- `POST /api/management/analyze`

`POST /api/intake/submit` 可直接使用 `data/requests/sample_restaurant_fume_noise.json` 中的样例报文进行测试，也保留了 `data/requests/sample_water_pipe_burst.json` 作为旧场景样例。

`POST /api/uploads` 用于先上传图片或音频，再将返回的 `attachments` 数组带入 `POST /api/intake/submit`。前端对话框会自动完成这一步。

`POST /api/management/analyze` 用于部门管理问题分析，例如“夏天中暑情况增多，我应该如何分配医疗资源？”。后端会解析问题、生成 50 条模拟诉求，并返回时空聚合、地区标注、类别图表和资源配置建议。

## 已验证

- 后端在 `cinemind` 环境下已完成依赖安装与 FastAPI 导入校验
- 文本主案例已通过真实百炼增强链路测试
- 上传接口已通过图片上传到主链路的联调测试
- 简化对话式 payload 已通过后端 TestClient 校验
- 前端已完成 `npm run build` 构建验证
