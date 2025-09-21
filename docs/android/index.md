# Android 工程能力地图

## 阶段 1 基础与环境

**核心技术点**

- 工具链：Android Studio 配置、SDK/NDK 管理、Profiler/Inspector、`adb`/`fastboot`/`bundletool`。
- 语言与测试：Kotlin 语法、协程基础、JUnit5 + MockK、静态分析（Detekt、ktlint）。
- 构建体系：Gradle Kotlin DSL、Version Catalog、构建缓存、配置缓存、多模块脚手架。

**落地任务**

- 提供一键环境脚本与 IDE 配置模版，新人可在 1 天内启动 Demo。
- 编写多模块示例项目（app/core/feature），覆盖协程与单元测试。

## 阶段 2 核心开发能力

**核心技术点**

- 组件与导航：Activity/Fragment 生命周期、任务栈、Navigation Component、Deep Link。
- UI 与体验：View System、ConstraintLayout、RecyclerView DiffUtil、MotionLayout、Material 3、无障碍适配。
- 并发通信：Handler/Looper、协程作用域、Flow/SharedFlow、结构化并发、线程池调优。
- 数据与网络：Room、DataStore、Retrofit/OkHttp、gRPC/WebSocket、缓存策略、弱网模拟。
- Jetpack/Compose：ViewModel、Hilt、Paging、WorkManager、Compose 状态提升与互操作。

**落地任务**

- 实现登录→首页→详情链路 Demo，涵盖 Compose 页面、离线缓存、错误重试。
- 输出协程与 Flow 使用规范，包括作用域、取消、错误处理示例。

## 阶段 3 系统保障能力

**核心技术点**

- 架构治理：MVVM/MVI、Clean Architecture、组件化/插件化、Dynamic Feature Module、Hilt Scope 设计。
- 性能监控：冷/热启动、首帧、Jank、内存峰值、功耗、包体积；工具（Perfetto、FrameTimeline、Systrace、Memory Profiler）。
- 系统原理：Zygote→SystemServer、AMS/WMS/PMS、进程优先级、OomAdj、`dumpsys` 调试。
- 稳定性与安全：ANR/Crash 分析、异常预捕获、热修复、权限策略、TLS/证书锁定、日志脱敏、MobSF 扫描。

**落地任务**

- 输出架构诊断报告，含依赖图、问题清单、演进计划与效益预估。
- 搭建性能监控 Dashboard，完成一次冷启动与 ANR 专项复盘。
- 制定安全合规清单（权限、数据、日志），通过内审或第三方审计。

## 阶段 4 工程效能与运营

**核心技术点**

- 构建效率：Gradle Profiler、Build/Configuration Cache、增量编译、模块并行化、Gradle Enterprise。
- CI/CD：GitHub Actions/Jenkins/GitLab CI、Fastlane、Firebase App Distribution、Artifact 仓库、质量门禁。
- 发布与运营：App Bundle、分阶段发布、国内渠道适配、灰度/回滚机制、Remote Config、功能开关。
- 监控与运营：Crashlytics/Bugly/Matrix、Prometheus/Grafana、埋点治理、A/B 测试平台、值班体系。

**落地任务**

- 构建自动化流水线（构建→测试→制品→通知），并记录失败分析流程。
- 交付上线手册，含灰度策略、渠道差异、回滚预案，完成一次演练。
- 建立性能/Crash/业务指标看板与告警策略，实现周/月复盘。