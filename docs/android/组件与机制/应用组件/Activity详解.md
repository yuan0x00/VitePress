# Activity 详解

Activity 是 Android 应用中负责界面呈现与用户交互的核心组件，既承担 UI 渲染，也协调生命周期内的数据订阅、权限处理与导航逻辑。合理设计 Activity，可显著提升应用的响应性与稳定性。

## 核心职责与角色定位
- 承载单个界面或交互流程，管理布局与事件分发。
- 作为业务入口，驱动 ViewModel、Presenter 等中间层协作。
- 协同 Fragment、Navigation Component 组成复杂导航结构。

## 生命周期全析
- `onCreate()`：完成布局初始化、依赖注入、SavedStateHandle 恢复。
- `onStart()`：界面可见，适合启动动画或请求轻量数据。
- `onResume()`：界面可交互，订阅 LiveData/StateFlow，恢复传感器监听。
- `onPause()`：暂停用户交互，提交草稿、持久化轻量状态。
- `onStop()`：界面不可见，释放摄像头、定位等重资源。
- `onDestroy()`：最终清理，销毁 Presenter、取消协程或 Rx 订阅。

> 提示：使用 LifecycleOwner + LifecycleObserver，将生命周期感知能力下沉至组件，避免 Activity 过载。

## 状态管理策略
- ViewModel 持有界面状态，结合 SavedStateHandle 处理进程终止重建。
- Jetpack Compose 可通过 `rememberSaveable` 维持轻量状态。
- 冷启动/热启动区分：冷启动要考虑数据预填充与骨架屏；热启动重点在快速恢复。

## 启动模式与任务栈控制
- `standard`：每次显式启动创建新实例，适用于普通页面。
- `singleTop`：栈顶复用，适合通知点击、搜索结果等无状态场景。
- `singleTask`：任务栈内唯一实例，多用于首页、浏览器壳等全局入口。
- `singleInstance`：独占任务栈，常见于悬浮窗口、桌面快捷方式。
- 结合 `FLAG_ACTIVITY_CLEAR_TOP`、`FLAG_ACTIVITY_NEW_TASK` 精确管理返回逻辑。

## 交互与导航
- Navigation Component：以图形化导航图管理目的地与深层链接（Deep Link）。
- Fragment 容器化：在大屏、可折叠屏上提升布局适配性。
- Activity Result API：替代旧版 `onActivityResult()`，支持类型安全调用。

## 性能与可用性
- 避免在主线程执行 I/O，使用协程或 WorkManager 调度后台任务。
- 启动优化：使用 SplashScreen API、预热关键依赖、延迟初始化非关键模块。
- 可访问性：支持 TalkBack、手势导航、字体缩放，遵循 Material Design 指南。

## 测试策略
- 单元测试：结合 Robolectric 模拟生命周期。
- UI 测试：使用 Espresso、Jetpack Compose TestRule 验证交互路径。
- 端到端：整合 Firebase Test Lab 或 Gradle Managed Devices 覆盖多机型。

## 常见问题排查
- Activity 重建导致崩溃：检查 Bundle 数据是否实现 `Parcelable`，或是否存在静态持有 Context。
- 返回栈混乱：核对声明的启动模式与实际 Flag 是否冲突。
- 内存泄漏：配合 LeakCanary 定期扫描 View 及匿名内部类引用。

围绕生命周期与任务栈进行架构设计，辅以 ViewModel、Navigation 等现代组件，可让 Activity 在复杂业务下保持整洁、可维护。
