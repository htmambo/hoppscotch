# Bundle API 部署文档

**版本**: 1.0.0
**更新日期**: 2025-01-09
**状态**: ✅ 已实现

---

## 概述

Bundle API 为 Hoppscotch 桌面应用提供前端资源下载功能。通过实现 Bundle API，自托管实例可以被桌面应用连接和下载前端资源。

### 功能特性

- ✅ **ed25519 签名验证**：确保 bundle 完整性和真实性
- ✅ **BLAKE3 哈希**：对每个文件进行哈希验证
- ✅ **ZIP 打包**：标准 ZIP 格式，兼容性好
- ✅ **多副本支持**：构建时生成 bundle，确保所有副本一致
- ✅ **灵活配置**：支持多种密钥配置方式

---

## 环境变量配置

### 构建时环境变量（Docker build）

```dockerfile
ARG WEBAPP_BUNDLE_VERSION=dev
ENV WEBAPP_BUNDLE_VERSION=${WEBAPP_BUNDLE_VERSION}
```

- `WEBAPP_BUNDLE_VERSION`: Bundle 版本号（将嵌入到 manifest.json 中）
  - 默认值：`dev`
  - 建议值：发布版本号（如 `2025.12.1`）或 Git SHA

### 运行时环境变量（Backend 容器）

#### 必需配置

```env
# Bundle 产物路径
BUNDLE_ZIP_PATH=/dist/backend/bundle/bundle.zip
BUNDLE_MANIFEST_PATH=/dist/backend/bundle/manifest.json

# Bundle 版本
BUNDLE_VERSION=2025.12.1

# 签名密钥（选择一种方式配置）
# 方式 1：使用秘密字符串（推荐，最简单）
BUNDLE_SIGNING_SECRET=your-long-random-secret-string-here
```

#### 可选配置

```env
# 方式 2：使用 Seed（base64 编码 32 字节）
# BUNDLE_SIGNING_SEED=<base64-encoded-32-byte-seed>

# 方式 3：使用完整密钥（base64 编码 64 字节）
# BUNDLE_SIGNING_KEY=<base64-encoded-64-byte-secret-key>

# 方式 4：从文件读取密钥
# BUNDLE_SIGNING_KEY_FILE=/path/to/key-file

# Bundle 最大大小（默认 50MB）
BUNDLE_MAX_SIZE_BYTES=52428800

# 自定义显示信息（可选）
BUNDLE_DISPLAY_NAME=My Company Hoppscotch
BUNDLE_TITLE=My API Tools
BUNDLE_DESCRIPTION=Internal API development platform
```

**显示信息说明**：
- `BUNDLE_DISPLAY_NAME`: Bundle 的显示名称（会显示在桌面应用的实例列表中）
- `BUNDLE_TITLE`: 窗口标题（当桌面应用加载此 bundle 时使用）
- `BUNDLE_DESCRIPTION`: Bundle 描述信息（提供额外的上下文信息）

这些信息会包含在 `/api/v1/manifest` 响应的 `properties` 字段中，桌面应用可以根据需要使用这些信息。

---

## 部署方式

### 方式 1：使用 Docker（推荐）

#### 1. 构建 Docker 镜像

```bash
# 构建 backend 镜像
docker build -f prod.Dockerfile --target backend -t hoppscotch-backend:latest .

# 或者构建 aio 镜像（包含所有服务）
docker build -f prod.Dockerfile --target aio -t hoppscotch-aio:latest .
```

构建过程中会自动：
1. 安装 Rust toolchain
2. 编译 webapp-bundler
3. 构建前端 dist
4. 生成 bundle.zip 和 manifest.json
5. 将产物复制到 `/dist/backend/bundle/`

#### 2. 配置环境变量

创建 `.env` 文件或 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  backend:
    image: hoppscotch-backend:latest
    environment:
      - BUNDLE_ZIP_PATH=/dist/backend/bundle/bundle.zip
      - BUNDLE_MANIFEST_PATH=/dist/backend/bundle/manifest.json
      - BUNDLE_VERSION=2025.12.1
      - BUNDLE_SIGNING_SECRET=your-secret-here
      - BUNDLE_DISPLAY_NAME=My Company Hoppscotch
      - BUNDLE_TITLE=My API Tools
      - BUNDLE_DESCRIPTION=Internal API development platform
      - DATABASE_URL=postgresql://user:pass@db:5432/hoppscotch
    ports:
      - "3170:3170"
    depends_on:
      - db
```

#### 3. 启动服务

```bash
docker-compose up -d
```

---

### 方式 2：本地开发测试

#### 1. 安装 Rust toolchain

```bash
# macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### 2. 生成 Bundle

```bash
# 方式 A：使用 pnpm scripts（推荐）
pnpm run bundle:make:dev

# 方式 B：分步执行
pnpm run bundle:web:build      # 构建前端 dist
pnpm run bundle:bundle:make    # 生成 bundle

# 检查生成的 manifest
pnpm run bundle:inspect
```

产物将生成在 `dist/backend/bundle/` 目录：
- `bundle.zip`
- `manifest.json`

#### 3. 配置并启动 Backend

```bash
cd packages/hoppscotch-backend

# 设置环境变量
export BUNDLE_ZIP_PATH=../../dist/backend/bundle/bundle.zip
export BUNDLE_MANIFEST_PATH=../../dist/backend/bundle/manifest.json
export BUNDLE_VERSION=dev
export BUNDLE_SIGNING_SECRET=dev-secret

# 启动服务
pnpm run start:prod
```

---

## API 端点

### 1. GET /api/v1/key

**描述**：返回用于签名验证的公钥

**响应格式**：
```json
{
  "success": true,
  "data": {
    "key": "base64-encoded-32-byte-public-key"
  }
}
```

**示例**：
```bash
curl http://localhost:3170/api/v1/key
```

---

### 2. GET /api/v1/manifest

**描述**：返回 bundle 元数据和签名

**响应格式**：
```json
{
  "success": true,
  "data": {
    "version": "2025.12.1",
    "created_at": "2025-01-09T12:00:00.000Z",
    "signature": "base64-encoded-64-byte-signature",
    "manifest": {
      "files": [
        {
          "path": "index.html",
          "size": 1234,
          "hash": "base64-blake3-hash",
          "mime_type": "text/html"
        }
      ],
      "version": "2025.12.1"
    },
    "properties": {
      "name": "My Company Hoppscotch",
      "title": "My API Tools",
      "description": "Internal API development platform"
    }
  }
}
```

**properties 字段说明**：
- 如果配置了 `BUNDLE_DISPLAY_NAME`、`BUNDLE_TITLE` 或 `BUNDLE_DESCRIPTION`，这些信息会包含在 `properties` 字段中
- 桌面应用可以使用这些信息来：
  - 在实例列表中显示自定义名称（`properties.name`）
  - 设置窗口标题（`properties.title`）
  - 显示描述信息（`properties.description`）
- 如果未配置，`properties` 将为空对象 `{}`

**示例**：
```bash
curl http://localhost:3170/api/v1/manifest
```

---

### 3. GET /api/v1/bundle

**描述**：下载 bundle ZIP 文件

**响应头**：
```
Content-Type: application/zip
Content-Length: <size>
Content-Disposition: attachment; filename="bundle.zip"
ETag: "<sha256-hash>"
Cache-Control: public, max-age=3600
```

**示例**：
```bash
curl -O http://localhost:3170/api/v1/bundle
```

---

## 密钥管理

### 密钥配置优先级

1. **BUNDLE_SIGNING_KEY**（最高优先级）
   - 直接提供 64 字节的 ed25519 私钥（base64 编码）
   - 格式：`BUNDLE_SIGNING_KEY=<base64-64-bytes>`

2. **BUNDLE_SIGNING_SEED**
   - 提供 32 字节的种子（base64 编码）
   - 格式：`BUNDLE_SIGNING_SEED=<base64-32-bytes>`

3. **BUNDLE_SIGNING_SECRET**（推荐，最简单）
   - 任意字符串，将自动通过 SHA-256 哈希生成种子
   - 格式：`BUNDLE_SIGNING_SECRET=<any-string>`

4. **BUNDLE_SIGNING_KEY_FILE**
   - 从文件读取密钥
   - 格式：`BUNDLE_SIGNING_KEY_FILE=/path/to/key-file`

### 生成密钥

#### 使用 Node.js 生成

```javascript
const nacl = require('tweetnacl');
const fs = require('fs');

// 生成新的密钥对
const keyPair = nacl.sign.keyPair();

// 保存私钥（base64）
const secretKeyB64 = Buffer.from(keyPair.secretKey).toString('base64');
fs.writeFileSync('bundle-signing-key.txt', secretKeyB64);

// 保存公钥（base64）
const publicKeyB64 = Buffer.from(keyPair.publicKey).toString('base64');
console.log('Public Key:', publicKeyB64);
```

#### 使用命令行生成

```bash
# 使用 openssl 生成随机密钥
openssl rand -base64 32 > bundle-seed.txt

# 使用种子作为 BUNDLE_SIGNING_SEED
export BUNDLE_SIGNING_SEED=$(cat bundle-seed.txt)
```

---

## 故障排查

### 1. Bundle 文件未找到

**错误信息**：
```
Bundle API service not initialized
```

**解决方案**：
- 确认 Docker 构建成功，bundle 文件已生成
- 检查 `BUNDLE_ZIP_PATH` 和 `BUNDLE_MANIFEST_PATH` 环境变量
- 验证文件存在于容器内：`docker exec <container> ls -la /dist/backend/bundle/`

---

### 2. 签名验证失败

**错误信息**（桌面应用）：
```
Signature verification failed
```

**可能原因**：
- 密钥配置不一致（不同副本使用不同密钥）
- Bundle 内容在不同副本间不一致

**解决方案**：
- 确保所有副本使用相同的 `BUNDLE_SIGNING_*` 配置
- 使用相同的 Docker 镜像（不要在运行时生成 bundle）
- 检查多副本负载均衡配置

---

### 3. 密钥配置错误

**错误信息**：
```
Key configuration error: Invalid key length: expected 64 bytes, got X
```

**解决方案**：
- 验证 base64 编码正确
- 确认密钥长度：
  - `BUNDLE_SIGNING_KEY`: 64 字节（base64 解码后）
  - `BUNDLE_SIGNING_SEED`: 32 字节（base64 解码后）
- 推荐使用 `BUNDLE_SIGNING_SECRET`（任意字符串）

---

### 4. Bundle 过大

**错误信息**：
```
Bundle size X bytes exceeds maximum Y bytes
```

**解决方案**：
- 调整 `BUNDLE_MAX_SIZE_BYTES` 环境变量
- 检查前端构建产物，确保没有意外包含大文件

---

## 安全建议

### 1. 密钥管理

- ✅ **使用环境变量**：不要将密钥写死在代码或镜像中
- ✅ **使用 Secret 管理工具**：Kubernetes Secrets、Docker Secrets、AWS Secrets Manager 等
- ✅ **定期轮换密钥**：建议每 3-6 个月更换一次
- ❌ **不要提交到 Git**：确保密钥文件在 .gitignore 中

### 2. 传输安全

- ✅ **强制 HTTPS**：确保所有 API 请求使用 HTTPS
- ✅ **验证证书**：不要禁用 SSL 证书验证
- ❌ **不要使用 HTTP**：签名验证不能防御中间人攻击

### 3. 访问控制

- ✅ **限制访问**：考虑限制 `/api/v1/*` 端点的访问（如 IP 白名单）
- ✅ **监控下载**：记录 bundle 下载请求，监控异常活动
- ✅ **设置速率限制**：防止滥用和 DDoS 攻击

---

## 测试验证

### 1. 验证 API 可访问

```bash
# 测试所有端点
curl http://localhost:3170/api/v1/key
curl http://localhost:3170/api/v1/manifest
curl -I http://localhost:3170/api/v1/bundle
```

### 2. 验证签名

下载桌面应用的验证工具或手动验证：

```bash
# 下载 bundle
curl -O http://localhost:3170/api/v1/bundle

# 下载 manifest
curl -O http://localhost:3170/api/v1/manifest

# 验证签名（需要实现验证脚本）
# ...
```

### 3. 桌面应用连接测试

1. 打开 Hoppscotch 桌面应用
2. 点击左上角实例名称
3. 点击 "Add an instance"
4. 输入你的自托管实例 URL（如 `https://your-domain.com`）
5. 点击 "Connect"

如果一切正常，桌面应用应该能成功下载并加载你的前端资源。

---

## 常见问题 (FAQ)

### Q1: 为什么要使用构建阶段生成 bundle？

**A**: 确保所有副本使用完全相同的 ZIP 字节。如果在运行时生成，不同副本可能生成略微不同的 ZIP（时间戳、文件顺序等），导致签名验证失败。

### Q2: 如何更新 bundle？

**A**:
1. 更新前端代码
2. 重新构建 Docker 镜像（会自动生成新的 bundle）
3. 部署新镜像
4. 桌面应用下次连接时会自动下载新版本

### Q3: 是否可以在开发环境禁用签名验证？

**A**: 不建议。签名验证确保资源完整性，即使开发环境也应该保持启用。可以使用固定的 `BUNDLE_SIGNING_SECRET` 简化配置。

### Q4: Bundle 文件有多大？

**A**: 通常在 1-5 MB 之间，具体取决于前端资源大小。建议设置 `BUNDLE_MAX_SIZE_BYTES=10485760`（10MB）作为上限。

### Q5: 可以同时使用 Go webapp-server 和 NestJS Bundle API 吗？

**A**: 不建议同时启用，会导致路径冲突。建议选择其中一种：
- **Go webapp-server**：已验证，稳定，但需要额外的服务
- **NestJS Bundle API**：集成在 backend 中，更简单

### Q6: 如何自定义 bundle 的显示名称和窗口标题？

**A**: 通过配置以下环境变量来自定义显示信息：

```env
BUNDLE_DISPLAY_NAME=My Company Hoppscotch
BUNDLE_TITLE=My API Tools
BUNDLE_DESCRIPTION=Internal API development platform
```

这些信息会：
- 显示在桌面应用的实例列表中（使用 `properties.name`）
- 作为窗口标题（使用 `properties.title`）
- 提供额外的描述信息（`properties.description`）

桌面应用会在 `/api/v1/manifest` 响应的 `properties` 字段中获取这些信息。

---

## 相关文档

- [桌面应用连接指南](../Task/BUNDLE_API_IMPLEMENTATION_PLAN.md)
- [任务计划文档](../Task/BUNDLE_API_IMPLEMENTATION_PLAN.md)
- [Go webapp-server 源码](../../packages/hoppscotch-selfhost-web/webapp-server/)
- [Rust webapp-bundler 源码](../../packages/hoppscotch-desktop/crates/webapp-bundler/)

---

## 技术支持

如遇到问题，请：
1. 查看日志：`docker logs <container-name>`
2. 检查环境变量配置
3. 参考"故障排查"章节
4. 提交 Issue 到 GitHub 仓库

---

**最后更新**: 2025-01-09
**文档维护者**: Claude + Codex
