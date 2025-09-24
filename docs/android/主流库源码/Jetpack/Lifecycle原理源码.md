# Lifecycle 原理与源码解读

## 核心概述
Lifecycle 是 Jetpack 架构组件之一，为组件化生命周期感知提供统一抽象。通过 `LifecycleOwner` 暴露生命周期状态，`LifecycleObserver` 实现事件监听，底层由 `LifecycleRegistry` 维护状态机并驱动回调，实现 UI 组件与业务逻辑解耦。

## 架构组成
- **LifecycleOwner**：如 `ComponentActivity`、`Fragment`，实现 `getLifecycle()` 暴露生命周期。
- **LifecycleRegistry**：具体状态机实现，负责状态同步与事件分发。
- **LifecycleObserver / DefaultLifecycleObserver**：观察者接口，支持注解式与接口式回调。
- **ReportFragment**：旧版通过隐藏 Fragment 监听 Activity 生命周期；AndroidX 中已由 `LifecycleDispatcher` 统一处理。
- **ProcessLifecycleOwner**：全局生命周期提供者，基于 `Application` + `ActivityLifecycleCallbacks` 实现前后台感知。

## 状态迁移流程
1. Activity/Fragment 生命周期事件触发时调用 `LifecycleRegistry.handleLifecycleEvent(event)`。
2. `handleLifecycleEvent` 将事件映射为目标状态（如 ON_START -> STARTED），并调用 `moveToState`。
3. `moveToState` 遍历观察者，这里维护了两套数据结构：`observerMap`（按插入顺序）和 `statefulObserverMap`（按状态排序），确保状态逐级推进。
4. 当状态提升时，依次回调 `onCreate`、`onStart`、`onResume`；降级时反向回调，保证事件顺序一致。

```kotlin
// LifecycleRegistry 核心状态机逻辑摘录
fun handleLifecycleEvent(event: Event) {
    val nextState = getStateAfter(event)
    moveToState(nextState)
}

private fun moveToState(next: State) {
    state = next
    if (handlingEvent || addingObserverCounter != 0) { newEventOccurred = true; return }
    // 向上推进状态
    sync()
}

private fun sync() {
    while (!isSynced()) {
        forwardPass()  // 状态提升
        backwardPass() // 状态回退
    }
}
```

## 关键源码细节
- **ObserverWithState**：包装观察者并记录当前状态，避免重复回调。
- **State 优先级**：`State.CREATED < STARTED < RESUMED`，保证状态线性推进。
- **线程安全策略**：`LifecycleRegistry` 大量使用 `SafeIterableMap` 保证在遍历时动态添加/移除观察者不会 ConcurrentModification。
- **反射兼容**：旧版 `LifecycleObserver` 通过注解 + 反射调用，推荐使用 `DefaultLifecycleObserver` 减少性能开销。

## 实践建议
- 尽量依赖 `LifecycleOwner` 注入，避免手动管理生命周期引用。
- 对异步任务使用 `LifecycleScope` 或 `repeatOnLifecycle` 函数，自动在特定状态下启动/取消协程。
- 在自定义控件中实现 `LifecycleOwner`，结合 `LifecycleRegistry` 感知附着与分离事件。

## 风险与调试
- **状态不一致**：嵌套 Fragment 若手动调用生命周期方法易导致状态漂移，建议使用官方 FragmentManager 管理。
- **泄漏风险**：长时任务需在 `ON_STOP` 或 `ON_DESTROY` 中释放，或使用协程/Flow 自动取消。
- 调试可开启 `setDebug(true)`（需自定义扩展），或在 `LifecycleEventObserver` 中打印状态流转。
