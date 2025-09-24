# ViewModel 原理与源码解读

## 核心概述
ViewModel 是 Jetpack 提供的状态持有者，旨在跨越配置变更（如旋转）保留 UI 状态。通过 `ViewModelStore` 管理实例缓存、`Factory` 实现延迟创建、`SavedStateHandle` 支持进程重启恢复，ViewModel 成为 MVVM 架构的核心中介。

## 架构组成
- **ViewModel**：抽象基类，暴露 `onCleared` 生命周期方法。
- **ViewModelStore**：维护 `Map<String, ViewModel>`，按作用域（Activity/Fragment）缓存实例。
- **ViewModelProvider**：对外暴露获取入口，协调 `ViewModelStore` 与 `Factory`。
- **Factory**：自定义构造逻辑，常用实现包括 `NewInstanceFactory`、`AndroidViewModelFactory`、`AbstractSavedStateViewModelFactory`。
- **SavedStateHandleController**：与 `SavedStateRegistry` 协同，在进程被杀后恢复关键数据。

## 创建与获取流程
1. `ViewModelProvider(owner, factory).get(FooViewModel::class.java)` 首先获取 `ViewModelStore`。
2. `store.get(key)` 若命中直接返回；否则调用 `factory.create(modelClass)` 创建实例。
3. 创建后的 ViewModel 会注册 `SavedStateHandleController`（若支持），并存入 `store.put(key, viewModel)`。
4. 当宿主销毁（如 Activity finish）时，`ViewModelStore.clear()` 调用每个 ViewModel 的 `onCleared()`。

```kotlin
// ViewModelProvider 获取流程核心实现
fun <T : ViewModel> get(key: String, modelClass: Class<T>): T {
    var viewModel = store.get(key)
    if (modelClass.isInstance(viewModel)) {
        return viewModel as T
    }
    // 创建新实例
    viewModel = factory.create(modelClass)
    store.put(key, viewModel)
    return viewModel
}
```

## 关键源码细节
- **键生成策略**：`ViewModelProvider` 默认使用 `DefaultKey`（`canonicalName:ViewModel`），Fragment 则基于 `FragmentManagerViewModel` 生成带索引的 Key，防止冲突。
- **SavedState 支持**：`AbstractSavedStateViewModelFactory` 从 `SavedStateRegistry` 读取 Bundle，构建 `SavedStateHandle` 注入 ViewModel。
- **作用域传播**：`Fragment` 的 ViewModel 可通过 `activityViewModels()` 共享父级 `ViewModelStore`，实现跨 Fragment 状态共享。
- **生命周期解耦**：ViewModel 不直接感知 Activity 生命周期，仅在 `onCleared` 收尾，确保逻辑层不泄漏 UI 引用。

## 实践建议
- 在构造函数注入 Repository、UseCase，结合 Hilt/Koin 自动提供依赖。
- 使用 `ViewModelScope` 运行协程，确保在 `onCleared` 时取消，避免内存泄漏。
- 合理划分 ViewModel 责任边界，对列表分页、表单状态等使用单一来源真相（Single Source of Truth）。
- 对复杂状态使用 `StateFlow` / `MutableStateFlow` 或 `MutableSharedFlow` 搭配 LiveData 暴露。

## 风险与调试
- **作用域错误**：错误使用 `activityViewModels` 会导致多个页面共享状态，应明确生命周期归属。
- **进程重启**：`SavedStateHandle` 仅持久化 `Bundle` 支持类型，复杂对象需自行序列化。
- 调试可在 `onCleared` 中打印日志，确认 ViewModel 生命周期是否符合预期。
