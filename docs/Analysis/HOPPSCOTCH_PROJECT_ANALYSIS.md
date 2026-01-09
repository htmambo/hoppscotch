# Hoppscotch 项目分析报告

## 0. 文档信息

- **版本**: 1.0
- **分析日期**: 2026-01-09
- **分析范围**: Hoppscotch 开源 API 开发生态系统
- **基于版本**: 2025.12.1 (commit: ee7cdc8f)

### 术语表

- **Workspace**: 工作空间，用于组织和管理 API 集合、环境变量等资源
- **Collection**: 集合，用于组织相关的 API 请求
- **Environment**: 环境，包含一组变量，用于在不同环境间切换
- **Shortcode**: 短链接，用于分享请求或集合
- **Relay**: 中继服务，基于 Rust 实现，提供高级网络能力
- **Agent**: 代理模式，用于绕过浏览器限制
- **AIO**: All-In-One，一体化部署模式

---

## 1. 摘要 (Executive Summary)

### 项目定位

Hoppscotch 是一个**开源 API 开发生态系统**（Open Source API Development Ecosystem），专注于 API 调试、开发、协作与自动化。它提供了类似 Postman 的功能，但更轻量、更快速，并且完全开源。

### 核心价值主张

- **更快发请求**: 轻量级 Web 应用，即开即用，无需安装
- **更好组织**: 通过 Collections、Environments、Workspaces 系统化管理 API 资源
- **更易协作**: 团队工作空间、RBAC 权限控制、实时同步
- **更可自动化**: CLI 工具、Pre-request Scripts、测试断言，支持 CI/CD 集成

### 读者收益

- **开发者**: 快速调试 API，支持多种协议（HTTP、GraphQL、WebSocket、MQTT 等）
- **测试工程师**: 编写测试脚本，集成到 CI 流程
- **平台运维**: 自建部署，掌控数据和隐私
- **团队管理员**: 管理团队成员、权限、配置，提供统一的 API 开发平台

---

## 2. 项目定位与产品形态

### 2.1 多种运行形态

Hoppscotch 提供多种运行形态，满足不同场景需求：

| 形态 | 特点 | 适用场景 | 浏览器限制 |
|------|------|----------|-----------|
| **在线版** | 无需安装，即开即用 | 快速调试、轻量使用 | 受 CORS、证书等限制 |
| **自建版** | 完全掌控数据和隐私 | 企业内部、敏感数据 | 可通过 Proxy/Agent 绕过 |
| **桌面端** | 系统级网络能力 | 需要自定义证书、代理 | 无限制（通过 Relay） |
| **CLI** | 命令行工具 | CI/CD 集成、自动化测试 | 无限制 |

### 2.2 在线版 vs 自建版

**在线版** (hoppscotch.io):
- 无需部署，直接使用
- 数据存储在官方服务器
- 受浏览器安全策略限制（CORS、HTTPS）
- 免费使用，部分高级功能需付费

**自建版** (Self-hosted):
- 完全掌控数据和隐私
- 需要部署后端服务（NestJS + PostgreSQL）
- 可配置 OAuth、SMTP、SSO 等
- 支持团队协作、RBAC、实时同步
- 可通过 Proxy Mode 或 Agent 绕过浏览器限制

### 2.3 桌面端与 Relay

**桌面端** 基于 Electron，集成了 **Rust Relay** 服务，提供以下增强能力：

- **CORS Override**: 绕过浏览器 CORS 限制
- **自定义证书**: 支持自签名证书、客户端证书
- **系统代理**: 使用系统代理或自定义代理
- **系统集成**: 文件访问、系统通知等

参考：`packages/hoppscotch-relay/README.md:3`

---

## 3. 功能全景 (Feature Map)

### 3.1 协议支持

Hoppscotch 支持多种协议，覆盖主流 API 开发场景：

| 协议 | 功能 | 入口 |
|------|------|------|
| **HTTP/REST** | 支持所有 HTTP 方法、Headers、Params、Body | 主界面 |
| **GraphQL** | Query、Mutation、Subscription、Schema 浏览 | GraphQL 标签页 |
| **WebSocket** | 双向通信、消息发送与接收 | WebSocket 标签页 |
| **SSE** | Server-Sent Events，实时事件流 | SSE 标签页 |
| **Socket.IO** | 基于 WebSocket 的实时通信框架 | Socket.IO 标签页 |
| **MQTT** | 物联网消息协议 | MQTT 标签页 |

参考：`README.md:48`

### 3.2 请求能力

- **认证方式**: Basic、Bearer Token、OAuth 2.0、OIDC、API Key、Digest、NTLM、AWS Signature
- **请求配置**: Headers、Query Params、Path Params、Body（JSON、XML、Form、Binary 等）
- **导入导出**: 支持 cURL、Postman、Insomnia、OpenAPI、HAR 等格式
- **代码生成**: 自动生成多种语言的请求代码（JavaScript、Python、Go、Java 等）

### 3.3 资产管理

- **History**: 自动记录所有请求历史
- **Collections**: 组织相关请求，支持文件夹嵌套
- **Environments**: 管理环境变量，支持多环境切换
- **Settings**: 个性化设置（主题、语言、代理等）

### 3.4 协作与治理

- **Teams**: 创建团队，邀请成员
- **Workspaces**: 团队工作空间，共享 Collections 和 Environments
- **RBAC**: 基于角色的访问控制（Owner、Editor、Viewer）
- **实时同步**: 多端实时同步，基于 GraphQL Subscriptions

### 3.5 自动化

- **Pre-request Scripts**: 请求前执行 JavaScript 脚本，动态生成参数、签名等
- **Tests**: 请求后执行测试脚本，断言响应结果
- **CLI**: 命令行工具，支持 CI/CD 集成
- **Runner**: 批量运行 Collections，生成测试报告

参考：`packages/hoppscotch-js-sandbox` + `packages/hoppscotch-cli`

### 3.6 辅助能力

- **Proxy Mode**: 通过代理服务器发送请求，绕过 CORS 和 HTTPS 限制
- **Share URL**: 生成短链接，分享请求或集合
- **Published Docs**: 发布 API 文档，对外暴露

参考：后端 `shortcode` 和 `published-docs` 模块

---

## 4. 仓库与模块结构 (Monorepo Map)

Hoppscotch 采用 **pnpm monorepo** 架构，所有包位于 `packages/` 目录下。

### 4.1 核心模块

| 模块 | 说明 | 技术栈 |
|------|------|--------|
| **hoppscotch-backend** | 后端服务，提供 GraphQL + REST API | NestJS + Apollo + Prisma + PostgreSQL |
| **hoppscotch-selfhost-web** | 自建版主 Web 应用 | Vue 3 + Vite + TailwindCSS |
| **hoppscotch-sh-admin** | 自建版管理台 | Vue 3 + Vite |
| **hoppscotch-common** | 跨端共享 UI 和业务逻辑 | Vue 3 + TypeScript |
| **hoppscotch-data** | 共享数据类型、校验、迁移 | TypeScript + Zod |
| **hoppscotch-js-sandbox** | 脚本沙箱（Web + Node） | TypeScript |
| **hoppscotch-cli** | 命令行工具 | Node.js + TypeScript |
| **hoppscotch-desktop** | 桌面应用 | Electron + Vue 3 |
| **hoppscotch-agent** | 代理模式 | TypeScript |
| **hoppscotch-relay** | Rust 中继服务 | Rust + Tauri |

参考：`package.json:9`、`package.json:23`

### 4.2 模块依赖关系

```
hoppscotch-selfhost-web
  ├── hoppscotch-common (UI + 业务逻辑)
  │   ├── hoppscotch-data (数据类型)
  │   └── hoppscotch-js-sandbox (脚本执行)
  └── hoppscotch-backend (GraphQL + REST API)
      └── PostgreSQL (数据存储)

hoppscotch-desktop
  ├── hoppscotch-common
  └── hoppscotch-relay (Rust 中继)

hoppscotch-cli
  ├── hoppscotch-data
  └── hoppscotch-js-sandbox
```

---

## 5. 总体架构与数据流

### 5.1 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Web/PWA     │  │   Desktop    │  │     CLI      │  │
│  │  (Vue 3)     │  │  (Electron)  │  │   (Node.js)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Relay (Rust)  │ (可选，桌面端)
                    └────────┬────────┘
                             │
┌────────────────────────────┼─────────────────────────────┐
│                    后端层   │                             │
│                    ┌────────▼────────┐                    │
│                    │  NestJS Backend │                    │
│                    │  ┌────────────┐ │                    │
│                    │  │  GraphQL   │ │ (协作、同步)       │
│                    │  │  + Subs    │ │                    │
│                    │  └────────────┘ │                    │
│                    │  ┌────────────┐ │                    │
│                    │  │  REST API  │ │ (鉴权、管理)       │
│                    │  │   (/v1)    │ │                    │
│                    │  └────────────┘ │                    │
│                    └────────┬────────┘                    │
│                             │                             │
│                    ┌────────▼────────┐                    │
│                    │   PostgreSQL    │                    │
│                    │   (Prisma ORM)  │                    │
│                    └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 5.2 客户端 ↔ 后端通信

- **GraphQL** (主要通信方式):
  - 用于协作、同步、团队管理
  - 支持 Subscriptions，实现实时更新
  - 端点：`VITE_BACKEND_GQL_URL` (默认: `http://localhost:3170/graphql`)

- **REST API** (辅助):
  - 用于鉴权、部分管理功能
  - 端点：`VITE_BACKEND_API_URL` (默认: `http://localhost:3170/v1`)

- **WebSocket** (实时):
  - GraphQL Subscriptions 使用 WebSocket
  - 端点：`VITE_BACKEND_WS_URL` (默认: `ws://localhost:3170/graphql`)

参考：`.env.example:28`

### 5.3 鉴权模型

- **Cookie/Session**: 用于 Web 应用的会话管理
- **Token**: 用于 API 访问（Bearer Token）
- **Device Login**: 桌面端使用设备登录流程（OAuth Device Flow）

### 5.4 配置模型

Hoppscotch 采用**双层配置模型**：

1. **环境变量** (`.env`):
   - 引导配置：数据库连接、基础地址、密钥等
   - 前端配置：`VITE_*` 变量，编译时注入

2. **数据库配置** (`infra_config` 表):
   - 运行时可变配置：SMTP、OAuth Provider、功能开关等
   - 支持加密存储（使用 `DATA_ENCRYPTION_KEY`）
   - 通过管理台在线配置

参考：`.env.example:15`、`packages/hoppscotch-backend/src/app.module.ts:48`

### 5.5 实时同步机制

- **技术**: GraphQL Subscriptions (基于 WebSocket)
- **用途**: 团队协作、多端同步、实时通知
- **实现**: Apollo Server + subscriptions-transport-ws
- **PubSub**: 当前为本地实现，生产环境建议使用 Redis（代码注释提到但未启用）

---

## 6. 关键工作流

### 6.1 登录与同步

```
用户访问 → 选择登录方式 (GitHub/Google/Email/SSO)
  ↓
OAuth 授权 / 邮箱验证
  ↓
创建/加载用户 → 初始化 Workspace
  ↓
同步 Settings/Collections/History (GraphQL Subscriptions)
  ↓
多端实时同步
```

### 6.2 创建并发送请求

```
编辑请求 (Method/URL/Headers/Body/Auth)
  ↓
选择 Environment (变量替换)
  ↓
执行 Pre-request Script (可选)
  ↓
发送请求 (直接 / 通过 Proxy / 通过 Relay)
  ↓
接收响应 → 渲染 (Raw/Preview/Headers)
  ↓
执行 Test Script (可选)
  ↓
保存到 History / Collection
```

### 6.3 组织与分享

```
创建 Collection → 添加请求 → 组织文件夹
  ↓
导出 Collection (JSON/Postman/OpenAPI)
  ↓
生成 Share URL / Shortcode
  ↓
分享给团队成员或外部用户
```

### 6.4 团队协作

```
创建 Team → 邀请成员 (Email)
  ↓
成员接受邀请 → 分配角色 (Owner/Editor/Viewer)
  ↓
创建 Team Workspace → 共享 Collections/Environments
  ↓
实时同步 (GraphQL Subscriptions)
  ↓
RBAC 权限控制
```

### 6.5 自建 Onboarding

```
启动 Docker Compose (AIO 或分离模式)
  ↓
自动运行数据库迁移 (hoppscotch-migrate 容器)
  ↓
访问管理台 (http://localhost:3100)
  ↓
配置 SMTP、OAuth Provider、功能开关
  ↓
配置 CORS 白名单、TRUST_PROXY
  ↓
生产化部署 (反向代理、HTTPS、监控)
```

参考：`docker-compose.yml:7`、`.env.example:15`

---

## 7. 部署与运维 (Self-host 重点)

### 7.1 Docker Compose 部署

Hoppscotch 提供多种 Docker Compose profiles：

| Profile | 说明 | 端口 |
|---------|------|------|
| **aio** | All-In-One，包含所有服务 | 3000, 3100, 3170, 3200 |
| **backend** | 仅后端服务 | 3170 |
| **app** | 仅主 Web 应用 | 3000 |
| **admin** | 仅管理台 | 3100 |

**启动命令**:
```bash
# AIO 模式（推荐）
docker-compose --profile aio up -d

# 分离模式
docker-compose --profile backend --profile app --profile admin up -d
```

参考：`docker-compose.yml:7`、`docker-compose.yml:33`

### 7.2 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| **hoppscotch-app** | 3000 | 主 Web 应用 |
| **hoppscotch-admin** | 3100 | 管理台 |
| **hoppscotch-backend** | 3170 | 后端 API (GraphQL + REST) |
| **hoppscotch-db** | 5432 | PostgreSQL (内部) |

### 7.3 依赖服务

- **PostgreSQL**: 数据存储，使用 Prisma ORM
- **反向代理** (可选): Nginx、Caddy、Traefik 等，用于 HTTPS、负载均衡
- **Redis** (可选): 用于 PubSub（生产环境推荐）

### 7.4 自动迁移

Hoppscotch 提供 `hoppscotch-migrate` 容器，自动运行数据库迁移：

```yaml
hoppscotch-migrate:
  image: hoppscotch/hoppscotch-backend
  command: pnpm exec prisma migrate deploy
  depends_on:
    - hoppscotch-db
```

### 7.5 升级策略

1. **备份数据库**: 升级前务必备份 PostgreSQL 数据
2. **拉取新镜像**: `docker-compose pull`
3. **运行迁移**: `docker-compose run hoppscotch-migrate`
4. **重启服务**: `docker-compose up -d`

**注意**: `DATA_ENCRYPTION_KEY` 变更会导致加密数据无法解密，务必妥善保管。

### 7.6 健康检查

- **后端健康检查**: `GET /ping`
- **容器健康检查**: Docker Compose 配置中已包含 healthcheck

---

## 8. 安全与隐私要点

### 8.1 CORS 配置

**关键配置**: `WHITELISTED_ORIGINS`

- 用于限制允许访问后端的前端域名
- 生产环境必须配置，避免 CSRF 攻击
- 示例: `WHITELISTED_ORIGINS=https://hoppscotch.example.com,https://admin.hoppscotch.example.com`

参考：`.env.example:15`

### 8.2 反向代理配置

**关键配置**: `TRUST_PROXY`

- 当使用反向代理（Nginx、Caddy 等）时，必须设置为 `true`
- 用于正确获取客户端 IP 地址
- 示例: `TRUST_PROXY=true`

### 8.3 敏感信息管理

| 配置项 | 存储位置 | 加密 | 说明 |
|--------|----------|------|------|
| `DATA_ENCRYPTION_KEY` | `.env` | - | 用于加密数据库中的敏感信息 |
| `SESSION_SECRET` | `.env` | - | 用于签名 Session Cookie |
| `JWT_SECRET` | `.env` | - | 用于签名 JWT Token |
| `SMTP_PASSWORD` | DB (`infra_config`) | ✅ | SMTP 密码 |
| `OAUTH_CLIENT_SECRET` | DB (`infra_config`) | ✅ | OAuth 客户端密钥 |

**重要提示**:
- `DATA_ENCRYPTION_KEY` 变更会导致已加密数据无法解密
- 所有密钥必须使用强随机字符串（建议 32+ 字符）
- 生产环境禁止使用默认密钥

### 8.4 代理与 Relay 风险

- **Proxy Mode**: 所有请求通过代理服务器，可能暴露敏感数据
- **Relay**: 具有系统级网络能力，需谨慎使用
- **建议**: 仅在受信任的环境中使用，遵循最小权限原则

### 8.5 遥测与隐私

- **PostHog**: 用于产品分析和遥测（如启用）
- **配置**: 可通过环境变量或管理台配置
- **合规**: 自建版可完全禁用遥测，确保数据隐私

---

## 9. 待确认项 / 风险

### 9.1 PubSub 实现

- **当前**: 本地实现（单实例）
- **生产**: 代码注释提到使用 Redis，但未启用
- **风险**: 多实例部署时，实时同步可能不工作
- **建议**: 生产环境使用 Redis PubSub

### 9.2 在线版与自建版功能差异

- **假设**: 在线版可能有部分功能限制（如团队数量、存储空间）
- **不确定**: 具体差异需查阅官方文档或代码
- **建议**: 自建版功能更完整，适合企业使用

### 9.3 SSO 与企业功能

- **假设**: SSO（SAML、LDAP）可能为企业版功能
- **不确定**: 代码中未明确标注 EE（Enterprise Edition）边界
- **建议**: 需要 SSO 的企业应联系官方确认

### 9.4 Proxy 官方服务依赖

- **假设**: Proxy Mode 可能依赖官方代理服务器
- **不确定**: 自建版是否需要自建代理服务器
- **建议**: 生产环境建议使用 Agent 或 Desktop 绕过浏览器限制

---

## 10. 附录：关键文件索引

### 10.1 配置文件

- `.env.example`: 环境变量示例
- `docker-compose.yml`: Docker Compose 配置
- `packages/hoppscotch-backend/prisma/schema.prisma`: 数据库 Schema

### 10.2 核心代码

- `packages/hoppscotch-backend/src/app.module.ts:48`: 后端主模块
- `packages/hoppscotch-common/`: 共享 UI 和业务逻辑
- `packages/hoppscotch-relay/README.md:3`: Relay 说明

### 10.3 文档

- `README.md:15`: 项目介绍
- `README.md:48`: 功能列表
- `docs/Task/Active/HOPPSCOTCH_PROJECT_ANALYSIS_PLAN.md:1`: 任务计划

---

## 11. 总结

Hoppscotch 是一个功能强大、架构清晰的开源 API 开发生态系统。它通过多种运行形态（在线版、自建版、桌面端、CLI）满足不同场景需求，通过 monorepo 架构实现代码复用和模块化，通过 GraphQL + Subscriptions 实现实时协作。

**核心优势**:
- 轻量快速，即开即用
- 完全开源，可自建部署
- 多协议支持，覆盖主流场景
- 团队协作，实时同步
- 自动化能力，支持 CI/CD

**适用场景**:
- 个人开发者：快速调试 API
- 团队协作：共享 Collections，统一 API 开发流程
- 企业内部：自建部署，掌控数据和隐私
- CI/CD：集成到自动化测试流程

**下一步**:
- 阅读使用指南：`docs/Usage/HOPPSCOTCH_USAGE_GUIDE.md`
- 部署自建版：参考第 7 章
- 集成到 CI：使用 `@hoppscotch/cli`

---

**文档维护**: 本文档基于 Hoppscotch 2025.12.1 版本分析，后续版本可能有变化，请以官方文档为准。
