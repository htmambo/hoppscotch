# Bundle API 实现计划

**状态**: 🔄 进行中 (开始时间: 2025-01-09)
**负责人**: Claude + Codex 协作
**目标**: 为 Hoppscotch 自托管实例实现 Bundle API 功能，使桌面应用可以连接和下载前端资源

---

## 任务背景

桌面应用使用 tauri-plugin-appload 插件下载和验证远程实例的前端 bundle。该插件需要服务器提供以下 API：

1. **GET /api/v1/key** - 返���用于签名验证的公钥
2. **GET /api/v1/manifest** - 返回 bundle 元数据和签名
3. **GET /api/v1/bundle** - 返回 bundle 文件（zip 格式）

### 技术要求

- **签名算法**: ed25519
- **哈希算法**: BLAKE3
- **Bundle 格式**: ZIP
- **验证机制**: 对整个 ZIP 字节进行签名

---

## 技术方案：方案 B（构建阶段生成 bundle）

### 核心思路

1. **构建阶段**��使用 Rust `webapp-bundler` 将前端 dist 打包成 bundle.zip 和 manifest.json
2. **运行时**：NestJS 后端读取 bundle 文件，使用 ed25519 签名并提供 API
3. **优点**：
   - 所有副本使用完全相同的 ZIP 字节（避免验签失败）
   - 后端只需要读取文件 + 签名，无需复杂的 ZIP 处理
   - 构建产物可预先验证

---

## 任务分解

### ⏳ 任务 1：修改 Dockerfile 添加 bundle_builder stage
**状态**: 待执行

**��体改动**：
1. 在 `prod.Dockerfile` 中的 `backend_builder` stage 之后添加 `bundle_builder` stage
2. `bundle_builder` stage 功能：
   - 安装 Rust toolchain（Alpine + rustup）
   - 编译 webapp-bundler
   - 构建 selfhost-web 前端 dist
   - 运行 bundler 生成 bundle.zip 和 manifest.json
   - 输出到 `/dist/backend/bundle/`
3. 修改 `backend` 和 `aio` target，从 `bundle_builder` 复制产物

**文件位置**：
- `prod.Dockerfile` (仓库根目录)

---

### ⏳ 任务 2：修改根 package.json 添加 bundle scripts
**状态**: 待执行

**具体改动**：
添加以下 scripts（用于本地开发测试）：
- `bundle:web:build` - 构建前端 dist
- `bundle:bundle:make` - 运行 bundler 生成产物
- `bundle:make` - 完整构建流程
- `bundle:make:dev` - 开发环境构建
- `bundle:inspect` - 查看 manifest 信息
- `bundle:clean` - 清理 bundle 产物

**文件位置**：
- `package.json` (仓库根目录)

---

### ⏳ 任务 3：创建 bundle-api 模块文件（types, config, errors）
**状态**: 待执行

**文件列表**：
1. `packages/hoppscotch-backend/src/bundle-api/bundle-api.types.ts` - 类型定义
2. `packages/hoppscotch-backend/src/bundle-api/bundle-api.config.ts` - 配置管理
3. `packages/hoppscotch-backend/src/bundle-api/bundle-api.errors.ts` - 错误定义

**主要内容**：
- 对齐桌面端插件的数据结构
- 定义环境变量配置接口
- 定义自定义错误类

---

### ⏳ 任务 4：实现 key-provider 密钥管理（ed25519）
**状态**: 待执行

**文件位置**：
- `packages/hoppscotch-backend/src/bundle-api/key-provider.ts`

**功能**：
- 支持多种密钥来源（优先级）：
  1. `BUNDLE_SIGNING_KEY` (base64 64 bytes)
  2. `BUNDLE_SIGNING_SEED` (base64 32 bytes)
  3. `BUNDLE_SIGNING_SECRET` (任意字符串)
  4. `BUNDLE_SIGNING_KEY_FILE` (文件路径)
- 使用 `tweetnacl` 库进行 ed25519 签名
- 提供密钥验证和错误处理

**npm 依赖**：
- `tweetnacl`
- `@types/tweetnacl`

---

### ⏳ 任务 5：实现 bundle-api.service（签名和元数据）
**状态**: 待执行

**文件位置**：
- `packages/hoppscotch-backend/src/bundle-api/bundle-api.service.ts`

**功能**：
- `onModuleInit()`:
  - 读取 bundle.zip 和 manifest.json
  - 校验文件大小和基本结构
  - 解析/生成 ed25519 密钥对
  - 对 bundle.zip 字节进行签名
  - 缓存元数据和公钥
- `getPublicKeyInfo()` - 返回公钥信息
- `getMetadata()` - 返回 bundle 元数据
- `getBundleBytes()` - 返回 bundle 字节

**关键点**：
- 签名必须是对整个 ZIP 原始字节进行
- 公钥是 32 bytes base64
- 签名是 64 bytes base64

---

### ⏳ 任务 6：实现 bundle-api.controller（3 个 API 端点）
**状态**: 待执行

**文件位置**：
- `packages/hoppscotch-backend/src/bundle-api/bundle-api.controller.ts`

**API 端点**：
1. `GET /api/v1/key` - 返回公钥
   ```json
   {
     "success": true,
     "data": { "key": "base64_32_bytes" }
   }
   ```

2. `GET /api/v1/manifest` - 返回 bundle 元数据
   ```json
   {
     "success": true,
     "data": {
       "version": "2025.12.1",
       "created_at": "2025-01-09T...",
       "signature": "base64_64_bytes",
       "manifest": {
         "files": [
           { "path": "index.html", "size": 1234, "hash": "blake3_base64" }
         ]
       }
     }
   }
   ```

3. `GET /api/v1/bundle` - 返回 bundle ZIP 文件
   - Content-Type: application/zip
   - Content-Length: <size>
   - Content-Disposition: attachment; filename="bundle.zip"

**注意事项**：
- 使用 `@Controller('api/v1')` 固定路径
- 不要使用 Nest versioning（避免路径冲突）
- /bundle 端点使用 Stream 返回二进制

---

### ⏳ 任务 7：在 app.module 中集成 BundleApiModule
**状态**: 待执行

**文件位置**：
- `packages/hoppscotch-backend/src/app.module.ts`
- `packages/hoppscotch-backend/src/bundle-api/bundle-api.module.ts`

**改动**：
1. 创建 `BundleApiModule`，注册 Controller 和 Service
2. 在 `AppModule.imports` 中导入
3. 可选：使用环境变量控制是否启用（`ENABLE_BUNDLE_API`）

**注意事项**：
- 确保这 3 个端点不需要登录态
- 建议添加健康检查：bundle 文件缺失时启动失败

---

### ⏳ 任务 8：创建部署文档和使用说明
**状态**: 待执行

**文档内容**：
1. **环境变量配置说明**
   - 必需的环境变量
   - 可选的环境变量
   - 密钥配置的最佳实践

2. **构建和部署流程**
   - 如何构建包含 bundle 的 Docker 镜像
   - 如何配置环境变量
   - 如何验证 API 是否正常工作

3. **本地开发测试**
   - 如何使用 pnpm scripts 生成 bundle
   - 如何在本地运行和测试 API

4. **故障排查**
   - 常见错误和解决方案
   - 如何调试签名验证问题

**文件位置**：
- `docs/Usage/BUNDLE_API_GUIDE.md`

---

## 环境变量配置

### 构建时（Docker build）

```dockerfile
ARG WEBAPP_BUNDLE_VERSION=dev
ENV WEBAPP_BUNDLE_VERSION=${WEBAPP_BUNDLE_VERSION}
```

### 运行时（Backend 容器）

```env
# Bundle artifacts (produced during Docker build)
BUNDLE_ZIP_PATH=/dist/backend/bundle/bundle.zip
BUNDLE_MANIFEST_PATH=/dist/backend/bundle/manifest.json

# Version (should match manifest.json.version)
BUNDLE_VERSION=2025.01.09-dev

# Bundle signing (choose ONE approach)
BUNDLE_SIGNING_SECRET=your-long-random-secret-here
# 或
# BUNDLE_SIGNING_SEED=base64_32_bytes_seed
# 或
# BUNDLE_SIGNING_KEY=base64_64_bytes_private_key
```

---

## 技术依赖

### npm 依赖

```json
{
  "dependencies": {
    "tweetnacl": "^1.0.3"
  },
  "devDependencies": {
    "@types/tweetnacl": "^1.0.4"
  }
}
```

### Rust 工具

- `webapp-bundler`: 仓库已存在，路径 `packages/hoppscotch-desktop/crates/webapp-bundler/`

---

## 验收标准

### 功能验收

1. ✅ Docker 镜像构建成功，包含 bundle.zip 和 manifest.json
2. ✅ Backend 容器启动成功，正确加载 bundle 文件
3. ✅ `GET /api/v1/key` 返回正确的公钥（32 bytes base64）
4. ✅ `GET /api/v1/manifest` 返回正确的元数据和签名（64 bytes base64）
5. ✅ `GET /api/v1/bundle` 返回正确的 ZIP 文件
6. ✅ 桌面应用可以成功连接到自托管实例并下载 bundle
7. ✅ 桌面应用可以验证签名并加载前端

### 技术验收

1. ✅ 签名算法正确（ed25519）
2. ✅ 签名对象正确（整个 ZIP 字节）
3. ✅ 多副本部署时签名一致
4. ✅ API 响应格式与桌面端插件完全对齐
5. ✅ 错误处理完善（bundle 缺失、密钥配置错误等）

---

## 风险评估和缓解措施

### 风险 1：多副本签名不一致

**描述**：多个副本生成的 bundle.zip 字节不一致，导致 manifest 和 bundle 来自不同副本时验签失败

**缓解措施**：
- ✅ 采用方案 B，在构建阶段生成 bundle（所有副本使用相同镜像）
- ✅ 签名在运行时生成，但使用相同的密钥

### 风险 2：密钥管理不当

**描述**：密钥丢失或泄露，导致安全风险

**缓解措施**：
- ✅ 提供多种密钥来源（环境变量、文件）
- ✅ 密钥只在运行时注入（不写死在镜像中）
- ✅ 文档中说明密钥管理的最佳实践

### 风险 3：API 路径冲突

**描述**：NestJS versioning 导致 API 路径不是 `/api/v1/*`

**缓解措施**：
- ✅ 使用 `@Controller('api/v1')` 固定路径
- ✅ 不使用 Nest versioning decorator

### 风险 4：性能问题

**描述**：bundle 文件过大，导致下载和签名耗时

**缓解措施**：
- ✅ 添加 `BUNDLE_MAX_SIZE_BYTES` 配置限制
- ✅ 使用 Stream 返回 bundle 文件
- ✅ 添加 Etag 和 Cache-Control 头

---

## 实施顺序

### 阶段 1：构建阶段（Dockerfile + scripts）
1. 修改 `prod.Dockerfile` ✅
2. 修改根 `package.json` ✅
3. 验证 Docker 镜像构建成功 ✅

### 阶段 2：后端实现（NestJS）
1. 创建 bundle-api 模块文件
2. 实现 key-provider
3. 实现 bundle-api.service
4. 实现 bundle-api.controller
5. 集成到 app.module

### 阶段 3：测试和文档
1. 本地测试 API
2. 测试桌面应用连接
3. 编写部署文档
4. 归档任务文档

---

## 备注

- 本实现基于仓库内已有的 Go webapp-server 和 Rust webapp-bundler
- 桌面端插件代码位置：`packages/hoppscotch-desktop/plugin-workspace/tauri-plugin-appload/`
- Rust bundler 代码位置：`packages/hoppscotch-desktop/crates/webapp-bundler/`
- Go server 代码位置：`packages/hoppscotch-selfhost-web/webapp-server/`

---

**更新记录**：
- 2025-01-09: 创建任务计划文档
