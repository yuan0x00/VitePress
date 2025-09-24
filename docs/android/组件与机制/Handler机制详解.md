# Android Handler 机制详解

## 1. 核心概念速览
- **Handler**：主线程/子线程的消息处理接口，负责将消息从队列中取出并执行回调。
- **Message**：消息载体，可携带 what、arg1/arg2、obj、target 等字段。
- **MessageQueue**：按时间顺序存储待处理消息，支持延迟与同步屏障。
- **Looper**：线程级消息循环核心，负责轮询 MessageQueue 并分发消息到目标 Handler。
- **Thread 与 HandlerThread**：普通线程默认没有 Looper，需要手动调用 `Looper.prepare()`；`HandlerThread` 封装了带 Looper 的工作线程。

## 2. 生命周期与初始化流程
1. **主线程自动配置**：系统在应用入口通过 `ActivityThread.main()` 创建主线程 Looper、MessageQueue，并调用 `Looper.loop()` 开始循环。
2. **子线程手动配置**：
   ```java
   HandlerThread worker = new HandlerThread("Worker");
   worker.start();
   Handler handler = new Handler(worker.getLooper());
   handler.post(() -> doBackgroundWork());
   ```
   - `HandlerThread` 内部执行 `Looper.prepare()` → `Looper.loop()`。
   - 若自行创建线程，则需在 run 方法中显式准备 Looper，线程退出前调用 `Looper.quit()`。
3. **Looper.loop() 循环**：无限循环调用 `queue.next()` 等待消息；如果队列为空，线程进入阻塞状态。

## 3. Message 消息结构与复用
- **字段作用**：
  - `what`：消息类型标识。
  - `arg1/arg2`：携带整型数据。
  - `obj`：任意对象数据。
  - `target`：消息目标 Handler。
  - `callback`：Runnable 回调。
- **复用机制**：`Message.obtain()` 从全局 Message 池获取对象，减少频繁创建；处理完成需调用 `msg.recycle()`（系统通常自动回收，无需手动调）。
- **延迟与定时**：`sendMessageDelayed`/`postDelayed` 通过在队列中设置 `when` 字段实现。

## 4. MessageQueue 细节
- 使用单链表有序存储消息，按 `when` 升序插入。
- `next()` 采用阻塞唤醒模型：
  - 调用 `nativePollOnce(ptr, timeout)` 进入 epoll 等待。
  - 有新消息或超时后唤醒，返回待处理消息。
- **同步屏障 (Sync Barrier)**：
  - 通过 `postSyncBarrier()` 插入屏障，阻止同步消息执行，优先处理异步消息（如 VSync 绘制）。
  - 典型于 Choreographer，确保渲染任务优先。
- **IdleHandler**：队列空闲时回调，可用于低优先级任务，但谨慎使用避免阻塞。

## 5. Handler 的运行流程
```
Handler.sendMessage/msg.post
  ↓
Message.target = Handler
  ↓
MessageQueue.enqueueMessage
  ↓
Looper.loop() → MessageQueue.next()
  ↓
当前 Handler.dispatchMessage
  ↓
callback.run() 或 handleMessage() 执行业务逻辑
```
- `dispatchMessage()` 优先执行 `callback`，否则回调 `handleMessage()`。
- 同一个 Handler 绑定的线程 = Looper 所在线程；跨线程使用 Handler 等同于切换执行线程。

## 6. 常见使用模式
1. **UI 主线程更新**：在后台线程中 `handler.post()`，在主线程刷新 UI。
2. **轮询任务**：通过 `postDelayed` + `removeCallbacks` 实现定时刷新、心跳检测。
3. **线程间通信**：创建带 Looper 的子线程，与主线程互发消息。
4. **Idle 任务**：注册 `MessageQueue.IdleHandler`，在空闲时执行缓存清理、资源释放。
5. **消息替换/去重**：使用 `removeMessages(what)` 或 `hasMessages` 清理冗余消息。

## 7. 常见问题与陷阱
- **内存泄漏**：非静态内部 Handler 持有 Activity 引用。解决：使用静态内部类 + 弱引用或 `Lifecycle` 绑定。
- **消息延迟**：大量耗时任务阻塞 Looper（尤其主线程）导致消息无法及时处理；需拆分任务或迁移至后台线程。
- **延迟消息被丢弃**：调用 `Looper.quit()` 或线程结束会丢弃队列中消息；需要先处理或转移关键消息。
- **ANR**：主线程 Handler 执行耗时任务 > 5s 引发 ANR；界面操作需 < 16ms。
- **重复消息**：`postDelayed` 未清理导致重复执行；在 `onPause`/`onDestroy` 中移除。

## 8. 调试与监控
- `Looper.getMainLooper().setMessageLogging()` 注入日志，观察主线程消息执行。
- `StrictMode` 检测主线程耗时操作。
- `adb shell dumpsys activity <package>` 查看消息队列情况。
- `Choreographer.FrameCallback` 监听帧渲染延迟。
- 自定义统计：包装 Handler，记录 message 执行时间、参数，用于性能监控。

## 9. 与其他框架协作
- **AsyncTask (已废弃)**：内部使用 Handler 实现主线程回调。
- **LiveData、Coroutine**：在主线程调度时借助 Handler/Looper 保障 UI 线程执行。
- **RxJava**：`AndroidSchedulers.mainThread()` 基于 Handler 实现。
- **Handler + Message + HandlerThread**：常用于音视频解码、蓝牙通信等长生命周期线程管理。

## 10. 最佳实践清单
- 每个线程只创建一个 Looper，不重复 `prepare()`。
- 对外提供 `post`/`sendMessage` 的工具类时，封装 `removeCallbacks` 便于生命周期管理。
- 对延迟任务设置明确移除时机（如 Activity 生命周期钩子）。
- 耗时操作放在 `HandlerThread` 或 `Executors`，避免阻塞主线程 Looper。
- 利用 `Handler.createAsync(Looper)` 为高优先级任务创建异步 Handler。

---
掌握 Handler 机制有助于理解 Android 消息循环、UI 线程调度及跨线程通信，是构建稳定、高性能应用的基础能力。

