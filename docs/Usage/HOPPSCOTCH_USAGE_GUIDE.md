# Hoppscotch 使用指南

**版本**: 1.0
**更新日期**: 2026-01-09
**适用版本**: Hoppscotch 2025.12.1+

---

## 目录

1. [快速开始](#1-快速开始)
2. [核心功能](#2-核心功能)
3. [高级功能](#3-高级功能)
4. [团队协作](#4-团队协作)
5. [自建部署](#5-自建部署)
6. [故障排查](#6-故障排查)
7. [最佳实践](#7-最佳实践)
8. [参考资源](#8-参考资源)

---

## 1. 快速开始

### 1.1 选择适合您的版本

Hoppscotch 提供多种使用方式，根据您的需求选择：

| 使用方式 | 适合场景 | 限制 | 推荐指数 |
|---------|---------|------|---------|
| **在线版** | 快速调试、临时使用 | 受浏览器 CORS 限制、数据存储在官方服务器 | ⭐⭐⭐ |
| **自建版** | 团队协作、企业内部 | 需要部署和维护 | ⭐⭐⭐⭐⭐ |
| **桌面端** | 需要绕过浏览器限制、本地开发 | 需要安装应用程序 | ⭐⭐⭐⭐ |
| **CLI** | CI/CD 集成、自动化测试 | 无图形界面 | ⭐⭐⭐⭐ |

### 1.2 在线版快速上手

**访问**: https://hoppscotch.io

**步骤**:

1. 访问 Hoppscotch 官网
2. 无需注册即可开始发送请求
3. （可选）点击右上角登录按钮，注册账户以保存数据

**第一个请求**:

```
1. 选择请求方法：GET
2. 输入 URL：https://api.github.com/users/hoppscotch
3. 点击 "Send" 按钮
4. 查看响应结果
```

### 1.3 桌面端安装

**下载**: https://hoppscotch.com/download

**安装步骤**:

1. 下载适合您操作系统的安装包
2. 运行安装程序
3. 打开 Hoppscotch Desktop
4. 选择连接方式：
   - **Hoppscotch Cloud**: 登录云端账户
   - **Self-Hosted**: 连接到自建实例

**系统要求**:

- **Windows**: Windows 10 1803+ 或 Windows 11 (x64)
- **macOS**: macOS 10.15 (Catalina) 或更高版本 (Intel 或 Apple Silicon)
- **Linux**: Ubuntu 24.04+ 或类似发行版 (GLIBC 2.38+)

#### 连接到自建实例

Hoppscotch Desktop 可以连接到自建的 Hoppscotch 实例，但需要正确配置 CORS。

**前提条件**：

在自建实例的 `.env` 文件中，必须将 Desktop App 的 origins 添加到 `WHITELISTED_ORIGINS`：

```bash
# 本地开发
WHITELISTED_ORIGINS=http://localhost:3170,http://localhost:3000,http://localhost:3100,app://localhost_3200,app://hoppscotch

# 生产环境（替换 your_domain_com 为你的域名）
WHITELISTED_ORIGINS=https://hoppscotch.your-domain.com,app://hoppscotch_your_domain_com,http://app.hoppscotch_your_domain_com
```

**连接步骤**：

1. 确保 Docker 容器正在运行
2. 打开 Hoppscotch Desktop
3. 点击左上角的 Hoppscotch logo
4. 选择 "**Add an instance**"
5. 输入你的自建实例 URL：
   - **Docker 部署**: `http://localhost:3200` 或 `http://your-ip:3200`
   - **Subpath 模式**: `https://hoppscotch.your-domain.com`
6. 点击 "**Connect**"

**故障排查**：

如果 Desktop 无法连接：
1. 检查 `WHITELISTED_ORIGINS` 是否包含 Desktop 的 origin
2. 确认端口 3200 已暴露（Docker Compose 默认配置）
3. 检查防火墙设置
4. 查看 Desktop 应用日志

### 1.4 CLI 工具安装

**前置要求**:

- **Windows/macOS**: 安装 `node-gyp`
- **Debian/Ubuntu**: `sudo apt-get install python g++ build-essential`
- **Alpine Linux**: `sudo apk add python3 make g++`

**安装命令**:

```bash
npm i -g @hoppscotch/cli
```

**验证安装**:

```bash
hopp -v
```

**基本用法**:

```bash
# 运行测试集合
hopp test collection.json

# 指定环境变量
hopp test collection.json -e environment.json

# 设置延迟
hopp test collection.json -d 1000

# 多次迭代
hopp test collection.json --iteration-count 5
```

---

## 2. 核心功能

### 2.1 发送 HTTP/REST 请求

#### 基本请求

```
1. 在主界面选择 HTTP 方法（GET、POST、PUT、DELETE 等）
2. 输入请求 URL
3. （可选）添加 Headers、Query Params、Body
4. 点击 "Send" 按钮
```

#### 请求配置

**Headers**:
- 点击 "Headers" 标签
- 添加键值对
- 支持常用 Header 自动补全

**Query Params**:
- 在 URL 中直接输入：`?key1=value1&key2=value2`
- 或点击 "Params" 标签单独配置

**Request Body**:

支持多种 Body 类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| **JSON** | JSON 格式数据 | `{"name": "John", "age": 30}` |
| **XML** | XML 格式数据 | `<user><name>John</name></user>` |
| **Form Data** | 表单数据 | `key1=value1&key2=value2` |
| **Multipart** | 文件上传 | 混合文本和文件 |
| **Raw** | 纯文本 | 任意文本内容 |

#### 导入请求

支持从以下格式导入：

- **cURL**: 粘贴 cURL 命令
- **Postman**: 导入 Postman Collection (v2.1)
- **Insomnia**: 导入 Insomnia 导出文件
- **OpenAPI**: 导入 OpenAPI/Swagger 规范

### 2.2 GraphQL 调试

#### 发送 GraphQL Query

1. 切换到 "GraphQL" 标签
2. 输入 GraphQL 端点 URL
3. 在 Query 编辑器中输入查询：

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
    posts {
      title
    }
  }
}
```

4. 在 Variables 面板输入变量：

```json
{
  "id": "123"
}
```

5. 点击 "Send"

#### 浏览 Schema

- 点击 "Docs" 标签查看完整的 GraphQL Schema
- 搜索类型、字段、查询和变更
- 查看参数说明和类型定义

#### GraphQL Subscriptions

1. 切换到 "GraphQL" 标签
2. 选择 "Subscription" 类型
3. 输入 Subscription 查询：

```graphql
subscription OnUserUpdate {
  userUpdated {
    id
    name
    email
  }
}
```

4. 实时接收服务器推送的事件

### 2.3 WebSocket 调试

#### 连接 WebSocket

1. 切换到 "WebSocket" 标签
2. 输入 WebSocket URL：`ws://echo.websocket.org`
3. 点击 "Connect"
4. 连接成功后可以发送和接收消息

#### 发送消息

1. 在消息输入框输入内容
2. 选择消息类型（文本/JSON）
3. 点击 "Send"
4. 在右侧面板查看接收的消息

#### 心跳检测

- 配置 Ping/Pong 间隔
- 设置超时时间
- 监控连接状态

### 2.4 认证配置

Hoppscotch 支持多种认证方式：

#### API Key

1. 切换到 "Auth" 标签
2. 选择 "API Key"
3. 配置：
   - **Key**: Header 名称（如 `X-API-Key`）
   - **Value**: API 密钥
   - **Add to**: Header 或 Query Param

#### Bearer Token

1. 选择 "Bearer Token"
2. 输入 Token 值
3. Token 会自动添加到 `Authorization` Header

#### Basic Auth

1. 选择 "Basic Auth"
2. 输入用户名和密码
3. 自动生成 Basic Auth 头

#### OAuth 2.0

1. 选择 "OAuth 2.0"
2. 配置 OAuth 参数：
   - **Grant Type**: Authorization Code、Client Credentials、Password Credentials 等
   - **Callback URL**: 回调地址
   - **Auth URL**: 授权端点
   - **Access Token URL**: Token 端点
   - **Client ID**: 客户端 ID
   - **Client Secret**: 客户端密钥
3. 点击 "Get New Access Token"
4. 授权后自动填充 Token

#### Digest / NTLM / AWS Signature

- **Digest**: 摘要认证
- **NTLM**: Windows 集成认证
- **AWS Signature**: AWS 签名认证（需要 Access Key 和 Secret Key）

### 2.5 环境变量

#### 创建环境

1. 点击左侧 "Environments" 图标
2. 点击 "+ New Environment"
3. 输入环境名称（如 "Development"）
4. 添加变量：

```json
{
  "base_url": "https://dev.api.example.com",
  "api_key": "dev_key_123",
  "user_id": "test_user"
}
```

5. 点击 "Save"

#### 使用变量

在请求中使用 `{{variable_name}}` 语法：

```
URL: {{base_url}}/users/{{user_id}}
Header: Authorization: Bearer {{api_key}}
```

#### 多环境切换

1. 在顶部环境选择器中选择当前环境
2. 所有请求自动使用该环境的变量值
3. 支持的环境类型：
   - **My Workspace**: 个人工作空间
   - **Global**: 全局变量
   - **Custom Environments**: 自定义环境

---

## 3. 高级功能

### 3.1 Pre-request Scripts

Pre-request Scripts 允许在发送请求前执行 JavaScript 代码，用于动态生成参数、签名等。

#### 基本用法

1. 切换到 "Pre-request" 标签
2. 输入 JavaScript 代码：

```javascript
// 设置环境变量
pw.env.set("timestamp", Date.now())

// 生成随机字符串
const randomId = Math.random().toString(36).substring(7)
pw.env.set("request_id", randomId)

// 计算示例签名（使用 Base64 编码作为占位）
// 注意：真实签名请按服务端要求实现（如 HMAC-SHA256），可能需要引入加密库
const secret = pw.env.get("api_secret")
const payload = pw.env.get("user_id") + Date.now()
// 示例：Base64 编码仅作为占位，实际使用时请替换为正确的签名算法
const simpleSignature = btoa(payload + secret)
pw.env.set("signature", simpleSignature)
```

3. 在请求中使用这些变量

#### 常用场景

**动态时间戳**:

```javascript
pw.env.set("current_time", new Date().toISOString())
```

**UUID 生成**:

```javascript
// 使用简单的随机 ID 生成
// 注意：crypto.randomUUID() 可能在某些环境不可用
const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})
pw.env.set("uuid", uuid)
```

**请求签名**（示例占位）:

```javascript
const apiKey = pw.env.get("api_key")
const apiSecret = pw.env.get("api_secret")
const timestamp = Date.now()
const method = "GET"
const path = "/api/users"

// 注意：真实签名请按服务端 API 文档要求实现
// 这里使用 Base64 编码作为占位示例
const signString = `${method}\n${path}\n${timestamp}\n${apiKey}`
const placeholderSignature = btoa(signString + apiSecret)

pw.env.set("signature", placeholderSignature)
pw.env.set("timestamp", timestamp)

// 如果 API 需要 HMAC-SHA256 等签名，请根据要求实现并引入相应的加密库
```

### 3.2 Test Scripts

Test Scripts 在请求完成后执行，用于验证响应结果。

Hoppscotch 提供两种脚本 API：
- **实验性 API (pm namespace)**: 推荐使用，与 Postman 兼容
- **传统 API (pw namespace)**: 旧版 API，部分功能仍在支持

#### 使用实验性 API (推荐)

```javascript
// 检查状态码
pw.test("Status code is 200", () => {
  pw.expect(pm.response.code).toBe(200)
})

// 检查响应体
pw.test("Response has user data", () => {
  const jsonData = pm.response.json()
  pw.expect(jsonData.name).toBe("John Doe")
})

// 检查 Header
pw.test("Content-Type is JSON", () => {
  const contentType = pm.response.headers.get("content-type")
  pw.expect(contentType).toInclude("application/json")
})
```

#### 高级断言

```javascript
// 检查状态码在 2xx 范围
pw.test("Status code is 2xx", () => {
  pw.expect(pm.response.code).toBeLevel2xx()
})

// 检查响应类型
pw.test("Response is JSON object", () => {
  const jsonData = pm.response.json()
  pw.expect(jsonData).toBeType("object")
})

// 检查数组长度（使用简单的比较）
pw.test("Array has items", () => {
  const jsonData = pm.response.json()
  pw.expect(jsonData.items.length > 0).toBe(true)
})

// 否定断言
pw.test("Error field is not present", () => {
  const jsonData = pm.response.json()
  pw.expect(jsonData.error).toBe(undefined)
})
```

#### 传统 API (pw namespace)

如果使用传统 API，注意以下差异：

```javascript
// 基本断言
pw.test("Status check", () => {
  // 注意：传统 API 使用不同的语法
  pw.expect(200).toBe(200)
})

// 类型检查
pw.test("Type check", () => {
  pw.expect("string").toBeType("string")
  pw.expect(123).toBeType("number")
})

// 包含检查
pw.test("Array includes value", () => {
  pw.expect([1, 2, 3]).toInclude(2)
})
```

> **注意**: 实验性 API (`pm` namespace) 提供更完整的功能，建议优先使用。

### 3.3 代理模式

#### Hoppscotch Agent

Agent 是一个本地代理服务，可以绕过浏览器的 CORS 限制。

**安装**:

1. 从 https://github.com/hoppscotch/agent-releases 下载 Agent
2. 安装并启动 Agent
3. Agent 会在后台运行，监听端口 `9119`

**注册**:

1. 在 Hoppscotch Web 应用中，进入 **Settings** → **Interceptors**
2. 选择 **Agent**
3. 点击 **Register Agent**
4. 输入 Agent 显示的 6 位验证码
5. 确认连接

**功能**:

- ✅ 绕过 CORS 限制
- ✅ 支持客户端证书
- ✅ 自定义代理
- ✅ 访问 localhost 和本地网络

#### 桌面端 Relay

桌面端内置了 Relay 服务，无需额外安装。

**启用**:

1. 在 Hoppscotch Desktop 中，进入 **Settings** → **Interceptors**
2. 选择 **Native** (Relay)
3. 所有请求自动通过 Relay 发送

**优势**:

- ✅ 无需额外安装
- ✅ 系统级网络能力
- ✅ 支持所有高级功能

### 3.4 代码生成

Hoppscotch 可以自动生成多种语言的请求代码。

**生成步骤**:

1. 配置好请求后，点击 "**</>**" 按钮（代码生成图标）
2. 选择目标语言
3. 复制生成的代码

**支持的语言**:

- JavaScript (Fetch、Axios、jQuery)
- Python (Requests、http.client)
- cURL
- Go
- Java (OkHttp、HttpClient)
- C# (RestSharp)
- PHP (cURL、Guzzle)
- Ruby
- Swift
- Kotlin

**示例**:

```javascript
// JavaScript Fetch
fetch("https://api.example.com/users", {
  "method": "GET",
  "headers": {
    "Authorization": "Bearer your_token",
    "Content-Type": "application/json"
  }
})
.then(response => response.json())
.then(data => console.log(data))
```

---

## 4. 团队协作

### 4.1 Collections

#### 创建 Collection

1. 点击左侧 "**Collections**" 图标
2. 点击 "**+ New Collection**"
3. 输入名称和描述
4. 点击 "**Create**"

#### 组织请求

1. 在 Collection 中创建文件夹
2. 将请求拖拽到文件夹中
3. 设置请求顺序
4. 添加请求描述

#### 导出 Collection

1. 右键点击 Collection
2. 选择 "**Export**"
3. 选择导出格式：
   - **Hoppscotch Collection**: 供 Hoppscotch 使用
   - **Postman Collection**: 供 Postman 使用
   - **OpenAPI**: API 规范格式

#### 导入 Collection

1. 点击 "**Import**" 按钮
2. 选择文件或粘贴文本
3. Hoppscotch 自动识别格式
4. 导入到工作空间

### 4.2 团队工作空间

#### 创建团队

1. 点击右上角头像
2. 进入 "**Teams**"
3. 点击 "**Create Team**"
4. 输入团队名称

#### 邀请成员

1. 进入团队设置
2. 点击 "**Invite Members**"
3. 输入成员邮箱
4. 选择角色：
   - **Owner**: 完全控制
   - **Editor**: 编辑 Collections 和 Environments
   - **Viewer**: 只读访问

#### 团队工作空间

1. 创建 "**Team Workspace**"
2. 添加 Collections 和 Environments
3. 所有团队成员实时同步
4. 支持多端同时访问

### 4.3 分享和发布

#### 生成分享链接

1. 右键点击请求或 Collection
2. 选择 "**Share**"
3. 生成短链接
4. 分享给团队成员或外部用户

#### 发布 API 文档

1. 右键点击 Collection
2. 选择 "**Publish Docs**"
3. 自定义文档外观
4. 生成公开的 API 文档页面

#### 访问控制

- **Private**: 仅团队成员可访问
- **Public**: 任何拥有链接的人可访问
- **Password Protected**: 需要密码才能访问

---

## 5. 自建部署

### 5.1 使用 Docker Compose（推荐）

#### 快速启动（AIO 模式）

```bash
# 克隆仓库
git clone https://github.com/hoppscotch/hoppscotch.git
cd hoppscotch

# 复制环境变量文件
cp .env.example .env

# 编辑配置（见下一节）
vim .env

# 启动所有服务
docker-compose --profile default up -d

# 查看日志
docker-compose logs -f
```

#### 服务说明

default profile (AIO 模式) 启动以下服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| hoppscotch-aio | 3000, 3100, 3170, 3200, 3080 | All-in-One 容器（包含主应用、管理台、后端 API、Desktop bundle server、HTTP 入口） |
| hoppscotch-db | 5432 | PostgreSQL 数据库 |
| hoppscotch-migrate | - | 数据库迁移服务（一次性执行） |

**端口说明**：
- **3000**: 主 Web 应用
- **3100**: 管理台 (Admin Dashboard)
- **3170**: 后端 API (GraphQL + REST)
- **3200**: Desktop App Bundle Server（桌面端连接需要）
- **3080**: HTTP 入口 (Caddy, 用于 subpath 模式)
- **5432**: PostgreSQL 数据库

> **注意**: Docker Compose 也支持其他 profiles：
> - `app`: 主应用（hoppscotch-app）+ 后端（hoppscotch-backend）+ 数据库
> - `admin`: 管理台（hoppscotch-sh-admin）+ 后端（hoppscotch-backend）+ 数据库
> - `backend`: 仅后端 API（hoppscotch-backend）+ 数据库
> - `default-no-db`: AIO 容器（不包含数据库）

> 注意：所有 profiles（app、admin、backend）都会自动运行 hoppscotch-migrate 容器来执行数据库迁移。>
> 示例：`docker-compose --profile admin up -d`

### 5.2 配置环境变量

编辑 `.env` 文件，配置关键参数：

#### 数据库配置

```bash
# PostgreSQL 连接
DATABASE_URL=postgresql://postgres:your_password@hoppscotch-db:5432/hoppscotch

# 数据加密密钥（32 字符）
DATA_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

#### CORS 配置（重要！）

```bash
# 允许的前端域名（本地开发环境）
WHITELISTED_ORIGINS=http://localhost:3170,http://localhost:3000,http://localhost:3100,app://localhost_3200,app://hoppscotch

# 生产环境配置（包含 Desktop App 支持）
# WHITELISTED_ORIGINS=https://hoppscotch.your-domain.com,https://admin.your-domain.com,app://hoppscotch_your_domain_com,http://app.hoppscotch_your_domain_com

# 反向代理配置
TRUST_PROXY=true  # 如果使用 Nginx 等反向代理，设置为 true
```

**重要说明**：
- `app://hoppscotch_*`: Desktop App 连接自建实例时需要（macOS/Linux）
- `http://app.hoppscotch_*`: Windows Desktop App 连接时需要
- `app://localhost_3200`: 本地开发时 Desktop App 连接需要
- 必须包含所有需要访问的域名和协议

#### 前端配置

```bash
# 前端访问地址
VITE_BASE_URL=https://hoppscotch.your-domain.com
VITE_ADMIN_URL=https://admin.your-domain.com

# 后端 API 地址
VITE_BACKEND_GQL_URL=https://hoppscotch.your-domain.com/graphql
VITE_BACKEND_API_URL=https://hoppscotch.your-domain.com/v1
```

### 5.3 初始化配置

#### 访问管理台

1. 打开浏览器访问：`http://localhost:3100`
2. 首次访问会显示设置向导
3. 创建管理员账户

#### 配置 SMTP（推荐）

1. 进入管理台
2. 导航到 "**Settings**" → "**SMTP**"
3. 配置邮件服务器：

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false  # 587 端口使用 STARTTLS
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=Hoppscotch
```

4. 保存配置

#### 配置 OAuth Provider

1. 进入 "**Settings**" → "**OAuth**"
2. 添加 OAuth 提供商：

**GitHub**:

```bash
# 在 GitHub Settings → Developer settings → OAuth Apps 创建
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Google**:

```bash
# 在 Google Cloud Console 创建 OAuth 2.0 凭据
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5.4 生产环境部署

#### 使用反向代理（Nginx）

```nginx
# Hoppscotch 主应用
server {
    listen 80;
    server_name hoppscotch.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /graphql {
        proxy_pass http://localhost:3170/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /v1 {
        proxy_pass http://localhost:3170/v1;
        proxy_set_header Host $host;
    }
}

# 管理台
server {
    listen 80;
    server_name admin.your-domain.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 配置 HTTPS（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d hoppscotch.your-domain.com -d admin.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 5.5 备份和升级

#### 数据库备份

```bash
# 备份数据库
docker-compose exec -T hoppscotch-db pg_dump -U postgres hoppscotch > backup.sql

# 恢复数据库
docker-compose exec -T hoppscotch-db psql -U postgres hoppscotch < backup.sql
```

#### 升级步骤

```bash
# 1. 备份数据库
docker-compose exec -T hoppscotch-db pg_dump -U postgres hoppscotch > backup_$(date +%Y%m%d).sql

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建镜像（项目使用本地构建，而非拉取预构建镜像）
docker-compose build

# 4. 运行数据库迁移
docker-compose --profile default run hoppscotch-migrate

# 5. 重启服务
docker-compose --profile default up -d

# 6. 检查日志
docker-compose --profile default logs -f
```

> **注意**:
> - Hoppscotch 使用 `build` 本地构建而非 `image` 拉取镜像，所以需要先 `git pull` 再 `build`
> - 数据库迁移服务 `hoppscotch-migrate` 需要指定 `--profile default` 才能访问数据库依赖

---

## 6. 故障排查

### 6.1 常见问题

#### CORS 错误

**症状**: 浏览器控制台显示 CORS 相关错误

**解决方案**:

1. **使用 Agent 或 Desktop**:
   - 安装 Hoppscotch Agent
   - 或使用 Hoppscotch Desktop

2. **配置服务器 CORS**:
   - 在 API 服务器添加 CORS 头：
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
     Access-Control-Allow-Headers: Content-Type, Authorization
     ```

3. **使用代理**:
   - 使用 Hoppscotch 的代理模式
   - 或配置 Nginx 反向代理

#### 认证失败

**症状**: 401 Unauthorized 或 403 Forbidden

**解决方案**:

1. 检查 Token 是否过期
2. 确认认证类型是否正确（Bearer、Basic 等）
3. 检查环境变量是否正确配置
4. 查看 Pre-request Script 是否正确执行

#### 连接超时

**症状**: Request timeout 或 ETIMEDOUT

**解决方案**:

1. 检查网络连接
2. 确认 URL 是否正确
3. 检查防火墙设置
4. 增加 `timeout` 配置（在设置中）

### 6.2 自建版问题

#### 数据库连接失败

**症状**: "Database connection failed"

**解决方案**:

1. 检查数据库容器是否运行：
   ```bash
   docker-compose ps
   ```

2. 检查数据库连接字符串：
   ```bash
   echo $DATABASE_URL
   ```

3. 查看数据库日志：
   ```bash
   docker-compose logs hoppscotch-db
   ```

4. 确认数据库迁移是否完成：
   ```bash
   docker-compose run hoppscotch-migrate
   ```

#### 管理台无法访问

**症状**: "502 Bad Gateway" 或空白页面

**解决方案**:

1. 检查 `VITE_ADMIN_URL` 配置是否正确
2. 检查 Nginx 配置
3. 查看容器日志（default profile）：
   ```bash
   docker-compose --profile default logs hoppscotch-aio
   ```
   或使用 admin profile：
   ```bash
   docker-compose --profile admin logs hoppscotch-sh-admin
   ```
4. 清除浏览器缓存并重试

#### WebSocket 连接失败

**症状**: GraphQL Subscriptions 不工作

**解决方案**:

1. 检查 `VITE_BACKEND_WS_URL` 配置
2. 确认反向代理支持 WebSocket：
   ```nginx
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```
3. 如果使用多实例部署，配置 Redis PubSub

### 6.3 桌面端问题

#### Agent 无法连接

**症状**: "Agent not detected"

**解决方案**:

1. 确认 Agent 正在运行（查看系统托盘）
2. 检查端口 `9119` 是否被占用
3. 重新注册 Agent：
   - 清除现有注册
   - 重启 Hoppscotch 和 Agent
   - 重新进行 OTP 验证

4. Safari 用户请切换到 Chrome 或 Firefox

#### 应用无法启动

**症状**: 双击应用无反应

**解决方案**:

**Windows**:
1. 安装 WebView2 Runtime
2. 检查杀毒软件是否拦截
3. 以管理员身份运行

**macOS**:
1. 检查系统版本（需要 10.15+）
2. 允许应用在"系统偏好设置" → "安全性与隐私"中运行
3. 删除应用配置并重试：
   ```bash
   rm -rf ~/Library/Application\ Support/io.hoppscotch.desktop
   ```

**Linux**:
1. 检查 GLIBC 版本（需要 2.38+）
2. 安装 WebKit2GTK：
   ```bash
   sudo apt-get install libwebkit2gtk-4.1-0
   ```
3. 设置环境变量（Wayland 显示问题）：
   ```bash
   WEBKIT_DISABLE_COMPOSITING_MODE=1 hoppscotch
   ```

### 6.4 CLI 问题

#### 命令不存在

**症状**: `hopp: command not found`

**解决方案**:

1. 确认全局安装路径在 PATH 中：
   ```bash
   npm config get prefix
   ```

2. 手动添加到 PATH：
   ```bash
   export PATH=$PATH:$(npm config get prefix)/bin
   ```

3. 重新安装：
   ```bash
   npm uninstall -g @hoppscotch/cli
   npm i -g @hoppscotch/cli
   ```

#### 测试失败

**症状**: 测试脚本不执行或报错

**解决方案**:

1. 使用 `--legacy-sandbox` 标志：
   ```bash
   hopp test collection.json --legacy-sandbox
   ```

2. 检查环境变量路径：
   ```bash
   hopp test collection.json -e ./environment.json
   ```

3. 启用详细日志：
   ```bash
   hopp test collection.json --verbose
   ```

---

## 7. 最佳实践

### 7.1 环境管理

- 为不同环境创建单独的 Environment（Dev、Staging、Production）
- 使用全局变量存储常用配置
- 敏感信息使用加密存储（自建版）

### 7.2 请求组织

- 按功能模块组织 Collections
- 使用文件夹和描述提高可读性
- 命名规范：`[Method] Resource - Description`

### 7.3 测试自动化

- 为关键 API 编写 Test Scripts
- 使用 Pre-request Scripts 处理认证
- 集成到 CI/CD 流程

### 7.4 安全建议

- 定期轮换 API 密钥和 Token
- 不要在 Collection 中硬编码敏感信息
- 使用环境变量管理密钥
- 启用 HTTPS（生产环境）
- 配置 CORS 白名单

---

## 8. 参考资源

### 官方文档

- **Hoppscotch 官方文档**: https://docs.hoppscotch.io
- **GitHub 仓库**: https://github.com/hoppscotch/hoppscotch
- **Discord 社区**: https://hoppscotch.io/discord
- **Telegram 群组**: https://hoppscotch.io/telegram

### 相关文档

- **项目分析报告**: [HOPPSCOTCH_PROJECT_ANALYSIS.md](../Analysis/HOPPSCOTCH_PROJECT_ANALYSIS.md)
- **任务计划文档**: [HOPPSCOTCH_PROJECT_ANALYSIS_PLAN.md](../Task/Archive/2026-01/HOPPSCOTCH_PROJECT_ANALYSIS_PLAN.md)

---

**文档维护**: 本指南基于 Hoppscotch 2025.12.1 版本编写，后续版本更新可能有所不同。
