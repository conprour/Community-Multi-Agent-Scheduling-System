# Community-Multi-Agent-Scheduling-System

面向社区“急事办”场景的多智能体调度 demo，第一版聚焦“水管爆了怎么办”这类高频急事，演示从居民报事、需求结构化、责任匹配到工单与服务信息生成的完整闭环。

## 当前实现

- Vue 3 + Vite 前端三栏主页面，已做明亮化工作台视觉改造
- FastAPI 后端最小接口
- 基于 `data/` 目录的 JSON 文件存储
- “水管爆裂”主案例样例数据与规则模板
- 阿里云百炼 `qwen3.6-plus` 文本/图像增强已接入主链路
- 阿里云百炼 `fun-asr-realtime-2026-02-28` 语音识别已接入后端能力层
- 前端支持图片、音频文件上传；接口异常时回退本地 mock

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

`POST /api/intake/submit` 可直接使用 `data/requests/sample_water_pipe_burst.json` 中的样例报文进行测试。

`POST /api/uploads` 用于先上传图片或音频，再将返回的 `attachments` 数组带入 `POST /api/intake/submit`。

## 已验证

- 后端在 `cinemind` 环境下已完成依赖安装与 FastAPI 导入校验
- 文本主案例已通过真实百炼增强链路测试
- 上传接口已通过图片上传到主链路的联调测试
- 前端已完成 `npm run build` 构建验证