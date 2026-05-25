# Community-Multi-Agent-Scheduling-System

面向社会民生问题的多智能体协同调度 Demo。系统聚合两条体验链路：群众可以从首页进入诉求提交端，描述问题并确认受理信息；政府管理部门可以进入管理分析端，提出公共服务治理问题，系统检索相关群众诉求并生成资源配置分析看板。

## 当前实现

- Vue 3 + Vite 前端页面，首页提供“群众入口”和“政府管理部门入口”
- 群众入口保留 `develop` 分支的对话式诉求受理、复述确认、图片上传和实时语音识别能力
- 管理部门入口保留 `feature/department-management-analysis` 的问题输入、Agent 动态分析过程和管理分析数据看板
- FastAPI 后端提供诉求受理、受理分析、确认意图识别、附件上传和管理分析接口
- 基于 `data/` 目录的 JSON 文件存储
- 阿里云百炼文本 / 图像增强与实时语音识别能力接入
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

- 首页：`http://127.0.0.1:5173/`
- 群众诉求输入界面：`http://127.0.0.1:5173/citizen`
- 政府管理部门分析界面：`http://127.0.0.1:5173/management`
- 管理分析数据看板：`http://127.0.0.1:5173/management/dashboard`

## 环境变量

项目根目录提供 `.env.example`，当前预留：

- `BAILIAN_API_KEY`
- `BAILIAN_BASE_URL`
- `BAILIAN_VLM_MODEL`
- `BAILIAN_ASR_MODEL`
- `CORS_ORIGINS`
- `VITE_API_BASE_URL`

## 样例接口

- `GET /health`
- `POST /api/uploads`
- `POST /api/intake/analyze`
- `POST /api/intake/submit`
- `POST /api/intake/confirm-intent`
- `POST /api/management/analyze`

`POST /api/intake/analyze` 用于受理前分析，不写入正式请求 / 工单文件；前端会先调用它生成客服确认话术，用户确认后再正式提交。

`POST /api/intake/submit` 可直接使用 `data/requests/sample_restaurant_fume_noise.json` 中的样例报文进行测试，也保留 `data/requests/sample_water_pipe_burst.json` 作为旧场景样例。

`POST /api/uploads` 用于先上传图片或音频，再将返回的 `attachments` 数组带入 `POST /api/intake/submit`。

`POST /api/management/analyze` 用于部门管理问题分析，例如“夏天中暑情况增多，我应该如何分配医疗资源？”。后端会解析问题、检索汇总 50 条相关诉求，并返回时空聚合、地区标注、类别图表和资源配置建议。

## 已验证

- 后端 FastAPI 导入与路由编译检查
- 文本主案例通过百炼增强链路测试
- 上传接口通过图片上传到主链路的联调测试
- 对话式 payload 通过后端 TestClient 校验
- 受理分析接口可生成诉求摘要和路由建议，用户确认后再生成正式工单
- 前端通过 `npm run build` 构建验证
