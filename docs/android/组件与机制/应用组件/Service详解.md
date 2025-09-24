# Service 详解

Service 提供无界面的长期运行能力，是 Android 在后台执行任务的关键组件。合理地选择 Service 类型与调度策略，可在省电约束下保持业务连续性。

## 组件角色与适用场景
- 音视频播放、蓝牙通信等前台持续任务。
- 数据同步、日志上传、模型更新等后台批处理。
- 模块间提供进程内/进程间的长连接能力。

## Service 类型拆解
- 普通服务（Started Service）：通过 `startService` 启动，处理一次性或持续任务。
- 前台服务（Foreground Service）：配合通知常驻，满足用户可感知要求。
- 绑定服务（Bound Service）：通过 `bindService` 暴露接口，支持 IPC 与多客户端协作。
- JobIntentService / WorkManager：在 API 26+ 用于替代传统后台服务。

## 生命周期要点
- `onCreate()`：初始化线程池、通知渠道、依赖资源。
- `onStartCommand()`：响应 `startService`，返回 `START_NOT_STICKY` 等常量决定重启策略。
- `onBind()` / `onUnbind()`：管理客户端绑定，释放 Binder。
- `onDestroy()`：停止前台通知、关闭连接、取消挂起任务。

> 建议：集中管理协程作用域或 HandlerThread，避免泄漏与重复创建。

## 前台服务最佳实践
- 创建通知渠道并展示常驻通知，明确业务状态与操作入口。
- Android 13+ 强化前台服务权限，需要在 Manifest 声明 `FOREGROUND_SERVICE_*` 权限。
- 使用 `startForegroundService()` 并在 5 秒内调用 `startForeground()`。

## 绑定服务与 IPC
- 本地进程：直接返回内部 Binder，实现高效方法调用。
- 跨进程：通过 AIDL 定义接口，注意序列化成本与线程同步。
- Messenger：基于 Handler 的轻量 IPC，适用于简单命令传递。

## 调度与省电策略
- 长期后台任务：优先使用 WorkManager，根据网络、电量等约束执行。
- 周期任务：在 API 21+ 使用 JobScheduler，合理配置 `setPeriodic()` 与 `setRequiresCharging()`。
- Doze 模式适配：使用 `setAndAllowWhileIdle()` 或 `setExactAndAllowWhileIdle()` 处理关键闹钟。

## 安全与稳定性
- 严格校验外部调用，必要时在 `onBind()` 检查调用方 UID/包名。
- 防止被杀：保持合规前台通知、延迟工作交给 WorkManager，避免滥用保活方案。
- 崩溃重启：在 `Thread.setDefaultUncaughtExceptionHandler` 中埋点，结合 Crashlytics 追踪。

## 测试与调试
- 使用服务测试规则（ServiceScenario）模拟生命周期。
- 通过 adb 命令（`adb shell dumpsys activity services`）检查运行状态。
- 引入日志与指标监控（如前台服务在线时长、任务完成率）。

## 常见问题排查
- 服务被系统回收：检查是否前台服务、是否满足电量/网络约束。
- 多次启动导致并发：在 `onStartCommand()` 中使用队列或互斥控制。
- IPC 阻塞：将耗时操作放入独立线程，保证 Binder 回调快速返回。

结合 WorkManager、JobScheduler 等现代调度组件，Service 可以在严格的系统限制下为应用提供稳定可靠的后台能力。
