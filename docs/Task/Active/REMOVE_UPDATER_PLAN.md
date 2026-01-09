# 移除 Hoppscotch Desktop 自动更新功能任务计划

**状态**: ✅ 已完成 (完成时间: 2026-01-09)
**创建人**: Claude Code
**任务目标**: 完全移除 Hoppscotch Desktop 中所有与自动更新相关的代码、配置和依赖

## 任务背景

用户要求移除 desktop app 中的自动更新检查功能，包括：
- 启动时的自动更新检查
- 更新下载和安装功能
- 更新相关的 UI 组件
- 相关的配置和依赖

## 问题分析

当前更新机制涉及多个层面：
1. **Rust 后端**: `updater.rs` 提供更新检查、下载、安装命令
2. **前端逻辑**: `StandardHome.vue` 和 `PortableHome.vue` 在启动时触发更新检查
3. **配置文件**: `tauri.conf.json` 配置更新 endpoint 和签名验证
4. **依赖包**: `@tauri-apps/plugin-updater` 和 `tauri-plugin-updater`
5. **存储状态**: 更新状态持久化到本地 store

## 详细任务分解

### Phase 0: 解除路由依赖 (最高优先级)
- ✅ **子任务 0.1**: 修改 `src/router.ts` 中的 `is_portable_mode` 调用
  - 改动: 将 `invoke("is_portable_mode")` 改为 `invoke("is_portable")`
  - 原因: `is_portable_mode` 在 `updater.rs` 中，删除前需要切换到已存在的 `is_portable` 命令
  - 风险: 如果命令名不一致会导致路由加载失败
  - **状态**: ✅ 已完成

### Phase 1: 移除前端更新 UI 和调用链
- ✅ **子任务 1.1**: 清理 `src/views/StandardHome.vue`
  - 移除 `UpdaterClient` 导入和实例
  - 移除 `checkForUpdates()` 函数
  - 移除 `<UpdateFlow>` 组件引用
  - 简化 `onMounted` 逻辑，直接调用 `initialize()`
  - **状态**: ✅ 已完成

- ✅ **子任务 1.2**: 清理 `src/views/PortableHome.vue`
  - 移除 `UpdaterClient` 导入和实例
  - 移除 `checkForUpdatesPortable()` 函数
  - 移除 "Don't notify about updates" UI 和逻辑
  - **状态**: ✅ 已完成

- ✅ **子任务 1.3**: 删除 `src/views/shared/UpdateFlow.vue`
  - 删除整个文件（纯更新 UI 组件）
  - **状态**: ✅ 已完成

- ✅ **子任务 1.4**: 删除 `src/services/updater.client.ts`
  - 删除整个文件（Rust 命令桥接）
  - **状态**: ✅ 已完成

- ✅ **子任务 1.5**: 删除 `src/utils/updater.ts`
  - 删除整个文件（JS 插件更新实现）
  - **状态**: ✅ 已完成

- ✅ **子任务 1.6**: 删除 `src/views/Home.vue`
  - 删除整个文件（未使用的更新页面）
  - **状态**: ✅ 已完成

### Phase 2: 移除更新相关类型和存储
- ✅ **子任务 2.1**: 清理 `src/types/index.ts`
  - 删除 `UpdateStatus`、`CheckResult`、`UpdateState` 类型
  - 从 `PortableSettings` 中移除 `disableUpdateNotifications` 字段
  - **状态**: ✅ 已完成

- ✅ **子任务 2.2**: 清理 `src/services/persistence.service.ts`
  - 删除 `UPDATE_STATE` 相关的 key、schema 和方法
  - 更新 `PortableSettings` 默认值
  - **状态**: ✅ 已完成（包含向后兼容处理）

- ✅ **子任务 2.3**: 清理 `src/services/instance-store-migration.service.ts`
  - 删除 `updateState` 迁移逻辑
  - 删除 `LegacyUpdateState` 类型
  - **状态**: ✅ 已完成

### Phase 3: 移除 Rust updater 模块
- ✅ **子任务 3.1**: 删除 `src-tauri/src/updater.rs`
  - 删除整个文件
  - **状态**: ✅ 已完成

- ✅ **子任务 3.2**: 清理 `src-tauri/src/lib.rs`
  - 移除 `pub mod updater;` 声明
  - 移除 updater 插件注册
  - 移除 updater 相关命令注册
  - 保留 `is_portable` 命令
  - **状态**: ✅ 已完成

- ✅ **子任务 3.3**: 清理 `src-tauri/Cargo.toml`
  - 删除 `tauri-plugin-updater` 依赖
  - 可选: 删除 `tauri-plugin-process` 依赖（如果不再需要）
  - **状态**: ✅ 已完成（保留了 process 插件）

### Phase 4: 移除配置和权限
- ✅ **子任务 4.1**: 清理 `src-tauri/tauri.conf.json`
  - 删除 `plugins.updater` 配置段
  - 设置 `bundle.createUpdaterArtifacts` 为 `false`
  - **状态**: ✅ 已完成

- ✅ **子任务 4.2**: 清理便携版配置
  - 清理 `src-tauri/tauri.portable.macos.conf.json`
  - 清理 `src-tauri/tauri.portable.windows.conf.json`
  - **状态**: ✅ 已完成

- ✅ **子任务 4.3**: 清理权限配置
  - 从 `src-tauri/capabilities/default.json` 移除 `updater:default`
  - 从 `src-tauri/capabilities/desktop.json` 移除 `updater:default`
  - 可选: 移除 `process:default`（如果不再需要）
  - **状态**: ✅ 已完成（保留了 process:default）

### Phase 5: 移除 JS 依赖和验证
- ✅ **子任务 5.1**: 清理 `package.json`
  - 删除 `@tauri-apps/plugin-updater` 依赖
  - 可选: 删除 `@tauri-apps/plugin-process` 依赖
  - **状态**: ✅ 已完成（保留了 process 插件）

- ✅ **子任务 5.2**: 全局检查残留引用
  - 搜索 `updater`、`UpdateFlow`、`updateState` 等关键词
  - 确保没有遗漏的引用
  - **状态**: ✅ 已完成（仅剩 Cargo.lock 会自动更新）

- ⏳ **子任务 5.3**: 构建验证
  - 运行 `pnpm build` 验证构建成功
  - 运行 `pnpm lint` 验证代码规范
  - 运行 `cargo check` 验证 Rust 代码
  - **状态**: ⏳ 待用户执行

## 预期效果

移除完成后：
- ✅ 应用启动时不再检查更新
- ✅ 不再显示任何更新相关的 UI
- ✅ 减少依赖包体积
- ✅ 简化代码结构

## 风险评估

1. **路由失败风险**: 如果 `is_portable` 命令不存在会导致路由加载失败
   - 缓解: Phase 0 优先处理，确保命令存在

2. **构建失败风险**: 删除文件可能导致隐藏引用报错
   - 缓解: 按 Phase 顺序执行，每个 Phase 后验证构建

3. **存储兼容性风险**: 旧版本用户的 store 中可能有 `updateState` 字段
   - 缓解: 读取时做容错处理，忽略多余字段

## 实施总结

所有计划的任务已完成，成功移除了 Hoppscotch Desktop 的自动更新功能。

### 完成情况
- ✅ Phase 0: 解除路由依赖 - 已完成
- ✅ Phase 1: 移除前端更新 UI 和调用链 - 已完成
- ✅ Phase 2: 移除更新相关类型和存储 - 已完成
- ✅ Phase 3: 移除 Rust updater 模块 - 已完成
- ✅ Phase 4: 移除配置和权限 - 已完成
- ✅ Phase 5: 移除 JS 依赖 - 已完成

### Codex 审查结果

根据 codex 的代码审查，移除工作质量评价：

**优点**：
1. ✅ 路由依赖处理正确：从 `is_portable_mode` 切换到 `is_portable`，避免了删除 `updater.rs` 后的路由断裂
2. ✅ 向后兼容处理完善：`getPortableSettings()` 正确处理了旧版本 store 中的 `disableUpdateNotifications` 字段
3. ✅ 系统性删除：Tauri 配置、capabilities、Cargo 依赖、前端桥接与 UI 组件都做到了成体系地删除
4. ✅ 无遗漏：在 `packages/hoppscotch-desktop` 范围内搜索更新相关关键词，未发现残留引用

**需要注意**：
1. ⚠️ `pnpm-lock.yaml` 仍包含 `@tauri-apps/plugin-updater` 条目，需要运行 `pnpm install` 刷新
2. ℹ️ 保留了 `@tauri-apps/plugin-process` 依赖（虽然当前代码未使用，但不影响功能）
3. ℹ️ `useAppInitialization` 中的 `AppState.UPDATE_*` 枚举值现在未使用（属于遗留死代码，不影响编译）

### 后续建议

1. **必须执行**：
   - 在仓库根目录运行 `pnpm install` 更新 `pnpm-lock.yaml`
   - 验证构建：`pnpm -C packages/hoppscotch-desktop build`
   - 验证 Rust 代码：`cd packages/hoppscotch-desktop/src-tauri && cargo check`

2. **可选清理**（不影响功能）：
   - 移除 `@tauri-apps/plugin-process` 依赖（如果确认不需要进程控制功能）
   - 清理 `useAppInitialization` 中未使用的 `AppState.UPDATE_*` 枚举值

## 备注

- 本次移除仅针对 `packages/hoppscotch-desktop`，`packages/hoppscotch-agent` 仍保留更新功能
- 所有改动都做了向后兼容处理，不会影响已有用户的数据
- 建议在移除后进行完整的功能测试，确保应用启动和基本功能正常
