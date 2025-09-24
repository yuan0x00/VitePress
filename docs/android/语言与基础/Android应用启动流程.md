# Android 应用启动流程

## 1. 启动场景概览

- **冷启动（Cold Start）**：进程不存在，系统需从 Zygote 派生新进程，完成资源装载与首帧绘制，耗时最长。
- **热启动（Hot Start）**：进程、Activity 均在前台待机，仅需恢复界面，耗时最短。
- **温启动（Warm Start）**：进程常驻但界面被销毁，需要重新创建 Activity 并恢复状态。

在性能分析中，冷启动最具挑战性，Google Play 的核心指标 `Time To Full Display` 以冷启动为主要评估对象。

## 2. 系统底层准备

1. **Zygote 预热**：

- 系统开机时启动 `Zygote` 进程，预加载核心类库（如 `core-libart.jar`、`framework.jar`）、资源与 JNI 库。
- 注册 `Zygote` Socket，等待系统请求派生新进程。

2. **System Server 启动**：

- `Zygote` fork 出 `system_server` 进程，初始化 ActivityManagerService（AMS）、PackageManagerService 等核心服务。
- `ActivityTaskManagerService` (ATMS) 与 WindowManagerService (WMS) 准备好调度 Activity 与窗口的能力。

## 3. 启动入口：用户点击图标

1. **Launcher 发送意图**：用户点击桌面图标或其他入口，Launcher 通过 `startActivity` 向 ATMS 发送 `Intent`。
2. **任务栈决策**：ATMS 判断是否已有目标任务栈，决定复用栈顶 Activity 还是创建新任务。
3. **进程存在性检查**：AMS 查询目标应用进程是否在运行。

- 存在：直接调度 Activity 生命周期。
- 不存在：进入进程创建流程。

## 4. 进程创建流程（冷启动核心）

1. **ProcessRecord 构建**：AMS 构建应用的 `ProcessRecord`，准备进程启动参数（进程名、UID、SELinux 策略、`bindApplication`
   数据等）。
2. **向 Zygote 发起请求**：

- 调用 `Process.start()` → 通过 `ZygoteProcess` 将启动命令写入 Zygote Socket。
- 命令包含：进程名、`nice name`、`targetSdk`、`runtime flags`、GID 列表、调试标志等。

3. **Zygote fork 子进程**：

- Zygote 收到命令后执行 `fork()`。
- 子进程重置进程状态（UID、GID、SELinux context、nice 值），并加载应用进程入口 `ActivityThread`。

4. **ActivityThread main**：

- 子进程调用 `ActivityThread.main()`，创建主线程（UI 线程）Looper，并向 AMS 发送 `attachApplication`。
- 注册 `ApplicationThread` Binder 接口，供 AMS 回调。

5. **AMS 绑定应用**：

- AMS 收到 `attachApplication` 后，完成与进程的双向通信绑定。
- 触发 `Instrumentation.bindApplication`，后续通过 `scheduleTransaction` 驱动组件生命周期。

## 5. 应用初始化顺序

1. **ContentProvider 初始化**：

- AMS 在主线程调用 `ActivityThread.installProvider`，每个 Provider 执行 `onCreate`。
- 注意：此阶段发生在 Application `onCreate` 之前，耗时 Provider 会阻塞启动。

2. **Application 创建**：

- 调用 `LoadedApk.makeApplication` → 执行 `Application.attach`、`onCreate`。
- 常见初始化操作（SDK 注册、日志系统、DI 容器）在此发生，需控制耗时与主线程阻塞。

3. **Activity 启动事务**：

- AMS 发出 `LaunchActivityItem` 事务。
- `ActivityThread` 解析事务，利用 `Instrumentation.newActivity` 反射实例化 Activity。
- 执行 `Activity.attach`、`onCreate`、`onStart`、`onResume`，间穿插 `Fragment` 生命周期。

## 6. 首帧呈现流程

1. **setContentView 与视图创建**：

- Activity 在 `onCreate` 调用 `setContentView`，加载布局 XML、构建 View 树。

2. **ViewRootImpl 建立**：

- `WindowManager` 将 DecorView 与 `ViewRootImpl` 绑定，发起与 WMS 的窗口同步。
- `Choreographer` 注册 VSync 回调，准备 UI 绘制。

3. **三大绘制阶段**：

- **measure**：计算 View 尺寸。
- **layout**：确定位置。
- **draw**：生成显示列表，交给 RenderThread 或 GPU。

4. **SurfaceFlinger 合成**：

- RenderThread 输出图像到 Surface。
- `SurfaceFlinger` 将窗口合成后交给显示控制器，完成首帧展示。

## 7. 生命周期细节与关键线程

- **主线程 (UI 线程)**：负责 Activity 生命周期、View 操作、广播接收等，避免超过 16ms 的阻塞操作。
- **Binder 线程池**：处理来自系统服务的 Binder 调用（如 AMS）。
- **RenderThread**：独立于 UI 线程，执行硬件加速绘制。
- **其他初始化线程**：建议通过 `HandlerThread`、`Executors` 分担初始化逻辑，避免主线程阻塞。

## 8. 性能与优化关键点

1. **Application/ContentProvider 耗时**：

- 延迟初始化非关键组件，可结合 `App Startup`、`Jetpack Startup`。
- 使用 `StrictMode`、`Launch Time Report` 监控主线程阻塞。

2. **资源加载优化**：

- 精简启动 Activity 布局，使用 `ViewStub`、`include` 减少层级。
- 合理使用 `VectorDrawable`、`WebP` 优化资源体积。

3. **IO 与网络**：

- 启动期避免同步 IO 或网络请求，必要时降级到后台线程并提供占位 UI。

4. **Dex 与 ClassLoader**：

- 使用 `Profile Guided Optimization (PGO)`、`Baseline Profiles` 减少类加载耗时。
- 对多 Dex 应用提前合并或拆分合理模块。

5. **进程常驻策略**：

- 合理使用前台服务、WorkManager 保持常驻，但需平衡耗电与策略限制。

## 9. 启动流程时序概览

```
User Tap
  ↓
Launcher → ATMS/AMS → (检查或新建任务栈)
  ↓
[进程存在?]
  ├─是：scheduleLaunchActivity → Activity 生命周期
  └─否：
        AMS → Zygote 请求 → Zygote fork 子进程
          ↓
        ActivityThread.main → attachApplication
          ↓
        安装 ContentProvider → Application.onCreate
          ↓
        scheduleLaunchActivity → Activity onCreate/onStart/onResume
          ↓
        setContentView → View 测量布局绘制 → 首帧呈现
```

## 10. 监控与工具体系

- **官方工具**：`Android Studio Profiler`、`TraceView`、`Perfetto`、`adb shell am start -W`、`systrace`。
- **日志指标**：使用 `Logcat` 的 `ActivityTaskManager`、`ActivityManager` 标签获取调度信息。
- **第三方方案**：埋点统计（如 Firebase Performance）、`BlockCanary`、`Matrix` 监控阻塞。

## 11. 最佳实践清单

- 保持冷启动首帧 < 2s，目标 700ms 以内。
- 避免在 Application `onCreate` 中初始化重量级 SDK（如网络、广告），采用懒加载或后台初始化。
- 使用 `SplashScreen API`（Android 12+）统一启动体验，结合过渡动画减少心理等待。
- 对关键路径建立自动化监控（CI 中通过 `macrobenchmark` 测量）并设定回归阈值。
- 定期审查任务栈与 Deep Link 入口，确保特殊场景（通知、ShareSheet）路径一致。

## 12. 扩展思考

- **多进程应用**：独立进程的 Service/Provider 会触发额外进程启动，需分离初始化逻辑。
- **模块化架构**：`Dynamic Feature` 模块延迟加载，降低冷启动体积。
- **Compose UI**：采用 `Jetpack Compose` 时关注首帧编译开销，结合 `remember`、`DerivedStateOf` 降低重组。
- **未来趋势**：App Startup 库与 Baseline Profiles 将成为启动优化标配；Android 15 引入 `Partial Reactivation` 以更高效恢复后台进程。

---
以上内容适用于主流 Android 8.0+ 系统版本，底层实现细节（如 ATMS/AMS 拆分）可能随版本微调，优化策略需结合实际硬件与业务场景验证。

