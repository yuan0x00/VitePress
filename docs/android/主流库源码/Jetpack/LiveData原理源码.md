# LiveData 原理与源码解读

## 核心概述
LiveData 是一种可感知生命周期的数据持有者，支持 UI 组件安全地订阅数据变化。通过生命周期感知、粘性/非粘性分发策略与主线程保证，LiveData 降低了内存泄漏与状态错位的风险。

## 架构组成
- **LiveData**：抽象基类，维护数据版本、活跃观察者数量与主线程调度。
- **MutableLiveData**：允许写入数据的实现，`postValue`/`setValue` 控制线程安全更新。
- **ObserverWrapper**：封装 `Observer` 并记录其活跃状态、最后接收版本。
- **LifecycleBoundObserver**：继承自 `ObserverWrapper`，与 `LifecycleOwner` 绑定，自动在销毁时移除。
- **MediatorLiveData**：支持合并多个 LiveData 源的数据变更。

## 数据分发流程
1. 调用 `observe(owner, observer)` 时，LiveData 创建 `LifecycleBoundObserver` 并注册至 `LifecycleOwner`。
2. 当生命周期状态达到 `STARTED` 及以上时，`LifecycleBoundObserver` 标记为活跃，通过 `activeStateChanged(true)` 触发数据分发。
3. `setValue` 会更新内部 `mVersion`，并通过 `dispatchingValue` 遍历活跃观察者，比较 `ObserverWrapper.lastVersion` 决定是否回调 `onChanged`。
4. `postValue` 在子线程写入 `mPendingData`，通过主线程 Handler 切换到 `setValue`。

```java
// LiveData 值更新核心逻辑
protected void setValue(T value) {
    assertMainThread("setValue")
    mVersion++
    mData = value
    dispatchingValue(null)
}

void dispatchingValue(@Nullable ObserverWrapper initiator) {
    if (mDispatchingValue) { mDispatchInvalidated = true; return; }
    mDispatchingValue = true
    do {
        mDispatchInvalidated = false
        if (initiator == null) {
            forEachObserver(observer -> considerNotify(observer))
        } else {
            considerNotify(initiator)
            initiator = null
        }
    } while (mDispatchInvalidated)
    mDispatchingValue = false
}
```

## 关键源码细节
- **版本控制**：每次 `setValue` 会递增 `mVersion`，观察者仅在 `observer.lastVersion < mVersion` 的情况下收到通知，避免重复回调。
- **线程模型**：`assertMainThread` 确保读写在主线程执行，`postValue` 借助 `ArchTaskExecutor` 切换线程。
- **粘性事件**：普通 `observe` 默认接收最新一次数据，若需要非粘性可使用 `observeForever` + 手动控制版本或封装 SingleLiveEvent。
- **主动移除**：`removeObserver`/`removeObservers` 及时释放引用，避免页面退出后继续持有。

## 实践建议
- 对协程 Flow 可使用 `asLiveData()` 转换，指定 `Dispatchers` 控制线程。
- 对非粘性需求，封装基于 `MediatorLiveData` 的事件总线，手动消费后重置。
- 使用 `Transformations.map/switchMap` 或 Kotlin `liveData {}` 构建派生数据。
- 在测试中借助 `InstantTaskExecutorRule` 强制同步执行。

## 风险与调试
- **数据倒灌**：活动重建时 LiveData 会再次发送最新值，应区分数据状态与一次性事件。
- **线程问题**：`postValue` 合并多次调用，最终只分发最后一次；需要逐条分发可结合队列或 Channel。
- 调试可覆写 `observe` 时记录 `Lifecycle` 状态，结合 `Debug` 版本开启日志。
