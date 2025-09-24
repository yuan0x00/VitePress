# BroadcastReceiver 详解

BroadcastReceiver 是 Android 中的事件分发枢纽，用于响应系统广播或应用内部消息。通过合理注册与解耦设计，可以在保持灵活性的同时降低安全风险。

## 角色定位与应用场景
- 监听系统级事件：网络变化、电量、开机完成、权限变更等。
- 应用内解耦通信：模块间转发状态、触发异步刷新。
- 配合 AlarmManager、WorkManager 处理定时任务或约束触发。

## 注册方式对比
- 静态注册
  - 在 `AndroidManifest.xml` 中声明。
  - 适用于系统广播或开机即需响应的场景。
  - Android 8.0 起对隐式广播静态注册进行限制，需关注白名单。
- 动态注册
  - 在运行时通过 `registerReceiver()` 注册，`unregisterReceiver()` 释放。
  - 常在 Activity/Service 的 `onResume()` / `onPause()` 中配对调用。
  - 适合生命周期敏感或仅在前台需要的监听。

## 广播类型
- 普通广播：异步分发，接收器并行执行。
- 有序广播：按优先级串行执行，可通过 `abortBroadcast()` 中断。
- 粘性广播（已弃用）：保留最后一次值，建议改用 LiveData/Flow 等替代方案。

## IntentFilter 设计
- `action`：命名需遵循包名前缀，避免冲突（如 `com.example.ACTION_SYNC_COMPLETE`）。
- `category`：用于补充过滤条件，默认为 `CATEGORY_DEFAULT`。
- `data`：结合 URI/MIME 过滤，常配合系统广播使用。

## 安全与权限控制
- 对外暴露的广播使用显式 intent 或在 Manifest 中声明 `permission`。
- 对敏感广播设置 `android:exported="false"` 或自定义权限。
- 避免使用 `Intent.ACTION_NEW_OUTGOING_CALL` 等受限制广播，必要时寻找替代 API。

## 性能与稳定性
- 广播接收器逻辑需迅速返回，耗时工作交给 Service、WorkManager。
- 避免在主线程执行重计算，推荐提交到线程池或协程。
- 使用 `goAsync()` + `BroadcastReceiver.PendingResult` 支持短期异步任务（最多 10 秒）。

## 调试与监控
- `adb shell dumpsys activity broadcasts` 查看当前在队列中的广播。
- 添加结构化日志标记 action、来源与执行耗时。
- 对安全事件广播增加审计，例如记录关键权限授予来源。

## 常见问题排查
- 广播未触达：检查是否显式广播、`exported` 配置、注册时机以及系统限制。
- 多次重复执行：确认是否注册多次未注销，或是否接收了不必要 action。
- 安全漏洞：避免接收器处理未校验来源的数据，必要时校验签名或 UID。

通过精确的 IntentFilter 设计、谨慎的生命周期管理，以及对耗时任务的异步下沉，BroadcastReceiver 能够高效支撑事件驱动架构，同时保证系统资源与安全边界。
