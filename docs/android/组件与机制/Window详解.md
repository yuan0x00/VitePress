# Android Window 体系详解

## 1. Window 的角色定位
- **抽象定义**：Window 是 Android 中展示视图与接收输入的顶层容器，`android.view.Window` 为抽象类，Activity、Dialog、Toast 等都通过具体 Window 实例进行展示。
- **三层结构**：
  1. **Window 对象**：负责管理 DecorView、WindowManager.LayoutParams、回调等。
  2. **DecorView**：窗口顶级 View，包含系统装饰（状态栏、导航栏占位等）和内容区域。
  3. **ViewRootImpl**：连接 View 世界与 WindowManagerService (WMS) 的桥梁，处理绘制、输入、窗口变更。
- **系统服务协作**：Window 的创建、更新、销毁由 WindowManagerService 统一调度，与 SurfaceFlinger 协作完成最终展示。

## 2. WindowManager 与 WMS
- `WindowManager` 是应用侧接口，实际调用 `WindowManagerGlobal`。
- `WindowManagerService` (WMS) 是系统服务，负责：
  - 管理窗口层级、Z-Order、动画、输入焦点。
  - 与 ActivityTaskManager 协作维护 Activity/Task 可见性。
  - 分配 Surface、控制尺寸与位置、响应旋转与多窗口。
- 交互过程：
  1. 应用通过 `WindowManager.addView()` 提交 `ViewRootImpl` 创建请求。
  2. `ViewRootImpl` 通过 Binder 调用 WMS 的 `addWindow()`。
  3. WMS 校验权限、窗口类型、token，创建或复用 `SurfaceControl`。
  4. WMS 通知 `ViewRootImpl` 初始化绘制和输入渠道。

## 3. Activity 与 Window
- Activity 启动时 `ActivityThread.handleLaunchActivity()` 调用 `Activity.attach()`，创建 `PhoneWindow`。
- `setContentView()` 实际调用 `PhoneWindow.setContentView()`，将布局加载到 DecorView 的 `mContentParent`。
- `ActivityThread.handleResumeActivity()` 中 `WindowManager.addView(decorView)` 完成窗口添加。
- 生命周期变化时通过 `WindowManager.updateViewLayout()` 调整布局参数，退出时调用 `removeViewImmediate()`。

## 4. Window 类型与层级
- `WindowManager.LayoutParams.type` 决定窗口层级与权限：
  - **应用窗口** (`TYPE_APPLICATION`、`TYPE_APPLICATION_PANEL` 等)：Activity、Dialog。
  - **子窗口** (`TYPE_APPLICATION_SUB_PANEL` 等)：依附于父窗口，如 PopupWindow。
  - **系统窗口** (`TYPE_SYSTEM_ALERT`、`TYPE_APPLICATION_OVERLAY`)：需 MANAGE_OVERLAY_PERMISSION。
- 层级影响焦点、触控穿透与覆盖关系；WMS 根据 type、token、Z-order 排序。

## 5. LayoutParams 关键字段
- **尺寸**：`width/height` 支持 MATCH_PARENT、WRAP_CONTENT、自定义像素。
- **位置**：`gravity`、`x/y`、`layoutInDisplayCutoutMode` 控制布局。
- **标志位**：`flags`（如 `FLAG_FULLSCREEN`、`FLAG_KEEP_SCREEN_ON`、`FLAG_NOT_FOCUSABLE`）。
- **输入**：`softInputMode`、`inputFeatures`、`dimAmount` 影响输入法与背景遮罩。
- **动画**：`windowAnimations` 指定进入/退出动画资源。

## 6. DecorView 结构
- 根节点通常为 `FrameLayout`，包含：
  - **StatusBar/NavigationBar 占位**：`ViewStub` 动态填充。
  - **ActionBar/Toolbar 区域**。
  - **内容区**：`android.R.id.content`。
- `setContentView()` 将布局添加到内容区。
- `DecorView` 实现了 `Callback` 接口，分发按键、触摸事件给 Activity。

## 7. ViewRootImpl 职责
- 管理窗口与 WMS 的通信：`relayoutWindow()`、`setView()`、`die()`。
- 维护输入通道 `InputChannel`，处理触控、键盘事件。
- 负责调用 `performTraversals()` 完成 View 树测量、布局、绘制。
- 监听窗口 Insets、配置变化（旋转、尺寸）、Surface 生命周期。

## 8. Surface 与渲染
- 每个窗口关联一个或多个 `Surface`，由 SurfaceFlinger 合成。
- 应用端通过 `Surface` 的 Canvas 或 Hardware Renderer（RenderThread）绘制内容。
- 当窗口尺寸或可见性变化时，`ViewRootImpl` 会触发 `SurfaceChanged` 回调，Activity/TextureView 需响应。

## 9. 输入与焦点
- `InputDispatcher` 根据 WMS 的焦点窗口列表分发事件。
- `Window` 可通过 `FLAG_NOT_FOCUSABLE`、`FLAG_NOT_TOUCHABLE` 控制输入策略。
- `Window.Callback`（Activity/Dialog 实现）处理 `dispatchKeyEvent`、`onWindowFocusChanged`。
- 多窗口/分屏模式下，焦点窗口随着前台任务变化，WMS 同步通知相关应用。

## 10. 特殊窗口与场景
- **Dialog**：内部持有 `DialogWindow`; 调用 `WindowManager.addView()` 添加，生命周期跟随 Activity。
- **PopupWindow**：通过 `TYPE_APPLICATION_PANEL/SUB_PANEL` 添加子窗口，可设置背景、动画。
- **Toast**：系统级窗口，Android 11 起权限受限；前台应用可使用 `TYPE_TOAST`。
- **悬浮窗**：`TYPE_APPLICATION_OVERLAY`，需用户授权；系统限制频繁显示。
- **Wallpaper/输入法窗口**：特殊 type，对位置、尺寸、输入有特殊管理策略。

## 11. 多窗口与显示适配
- Android 7.0 引入分屏、多窗口模式；WMS 根据 Task/DisplayArea 组织窗口层次。
- 可折叠设备需处理多个 Display、`WindowMetrics`、`WindowLayoutInfo`。
- `WindowInsets` API 负责适配刘海、手势导航区域；`WindowCompat.setDecorFitsSystemWindows` 控制沉浸式体验。

## 12. 权限与安全
- 系统会校验窗口类型是否具备权限（如 Overlay）。
- 防控点击劫持：`FLAG_SECURE` 禁止截屏/录屏；`setFilterTouchesWhenObscured` 拦截被覆盖时的触控。
- 严格遵守最小权限原则，避免滥用全屏/悬浮窗影响用户体验。

## 13. 调试工具与排障
- `adb shell dumpsys window`：查看窗口层级、属性、焦点状态。
- `Hierarchy Viewer`/`Layout Inspector`：可视化窗口与 View 结构。
- `adb shell cmd window`：操作窗口模式（如 设置最小化、最大化）。
- `WindowManager` 日志：监控新增/移除窗口、异常。
- `StrictMode` + `Window.setCallback`：检测窗口回调耗时。

## 14. 常见问题与解决策略
| 问题 | 可能原因 | 解决建议 |
| ---- | -------- | -------- |
| WindowLeaked 异常 | Activity 销毁时未移除窗口 | 在 `onDestroy` 调用 `dismiss()` 或 `removeViewImmediate()` |
| 布局被系统栏遮挡 | 没有处理 Insets | 使用 `WindowInsetsController`、`ViewCompat.setOnApplyWindowInsetsListener()` |
| 悬浮窗不可见 | 未申请权限或被系统限制 | 检查 `Settings.canDrawOverlays()`，适配不同 ROM | 
| 多窗口尺寸异常 | 依赖旧的 DisplayMetrics | 使用 `WindowMetrics`/`onConfigurationChanged` 重新计算 |
| 输入法遮挡 | `softInputMode` 配置不当 | 设置 `ADJUST_RESIZE` 并监听 Insets |

## 15. 最佳实践清单
- Activity 中使用 `WindowCompat`、`Insets` API 实现沉浸式和自适应布局。
- 在组件销毁时及时释放窗口，避免内存泄漏与 WindowLeaked。
- 针对权限敏感的窗口（Overlay/Toast）提供明确引导，尊重用户体验。
- 自定义 Dialog/PopupWindow 注意布局层级与动画，避免 overdraw。
- 结合 `WindowManager.LayoutParams` 与 `ViewRootImpl` 回调，监控窗口尺寸，必要时动态调整内容布局。

---
理解 Window 体系有助于掌握 Android 的界面呈现与系统交互原理，为实现复杂 UI、悬浮窗、多窗口适配提供坚实基础。

