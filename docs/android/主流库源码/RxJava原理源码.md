# RxJava 原理与源码解读

## 核心概述
RxJava 为响应式编程提供可组合的异步流抽象，通过 `Observable`/`Flowable` 等类型串联数据流处理、线程切换与错误控制。其底层依赖 `Scheduler`、装饰器模式的操作符链以及背压协议实现高扩展性。

## 架构与关键角色
- **Observable/Observer**：发布-订阅模型核心接口，`subscribe` 建立订阅关系。
- **Operator**：通过装饰器模式封装在 `Observable` 内，形成链式数据处理。
- **Scheduler**：抽象线程调度，常见实现有 `IoScheduler`、`ComputationScheduler`、`AndroidSchedulers.mainThread()` 等。
- **Disposable**：取消订阅/释放资源的契约。
- **Flowable & Backpressure**：基于 Reactive Streams 规范，解决上下游速率不匹配。

## 订阅流程解析
1. 调用 `Observable.create` 返回 `ObservableOnSubscribe` 的包装对象。
2. 链式调用操作符（map、flatMap 等）会生成新的 `Observable`，其 `source` 指向上一个节点。
3. `subscribe` 时，从下游开始向上游依次调用 `subscribeActual`，形成责任链。
4. 上游通过 `Observer.onNext` 逐个推送数据；`Scheduler` 通过 `ObservableSubscribeOn`、`ObservableObserveOn` 控制执行线程。

```java
// ObservableSubscribeOn 的关键实现，展示线程切换原理
public void subscribeActual(Observer<? super T> observer) {
    final SubscribeOnObserver<T> parent = new SubscribeOnObserver<>(observer); // 包装下游
    observer.onSubscribe(parent);
    Scheduler.Worker w = scheduler.createWorker();
    parent.setDisposable(w);
    w.schedule(() -> source.subscribe(parent)); // 在线程池中订阅上游
}
```

## 背压处理
- `Flowable` 通过 `Subscription.request(n)` 控制上游发送速率。
- `BackpressureStrategy` 决定缓存或丢弃策略，如 `BUFFER`、`DROP`、`LATEST`。
- 操作符在实现时需遵循请求协议，常见如 `FlowableFlatMap` 使用 `Queue` 与原子变量协调上下游。

## 错误与资源管理
- 操作符默认遵循“终止即清理”原则，`onError` 或 `onComplete` 后自动释放订阅。
- `CompositeDisposable` 便于批量管理订阅，避免内存泄漏。
- `doOnError`、`retry` 等操作符提供错误监控与重试机制。

## 实践建议
- **线程切换**：`subscribeOn` 决定上游线程，`observeOn` 决定下游线程；遵循“多次 subscribeOn 仅首次生效，多次 observeOn 逐段切换”。
- **背压策略选择**：数据量大时优先使用 `Flowable`，并明确 `BackpressureStrategy` 以防 `MissingBackpressureException`。
- **生命周期管理**：在 Android 中结合 `AutoDispose`、`RxLifecycle` 或 ViewModel 的 `onCleared` 释放订阅。

## 调试与监控
- 使用 `RxJavaPlugins.setErrorHandler` 捕获未处理错误。
- 借助 `RxJava2Debug` 或 `AssemblyTracking` 定位异常发生位置。
- 将关键流的订阅/取消写入日志，辅助排查线程切换或背压问题。
