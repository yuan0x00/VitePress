# Glide 原理与源码解读

## 核心概述
Glide 是 Google 推出的 Android 图片加载库，整合解码、缓存、变换与生命周期管理，强调流畅性与资源复用。其设计核心在于多级缓存、自动化生命周期绑定与灵活的请求流水线。

## 模块与架构
- **RequestManager / RequestBuilder**：负责创建与管理图片请求，自动感知 `Activity`/`Fragment` 生命周期。
- **Engine**：调度解码、缓存、资源复用的核心引擎。
- **缓存体系**：分为活动资源缓存（`ActiveResources`）、内存缓存（`LruResourceCache`）、磁盘缓存（`DiskLruCacheWrapper`）。
- **线程池**：`GlideExecutor` 根据任务类型（磁盘/源/动画）分配不同的线程池。
- **解码管线**：`DecodeJob` 串联数据加载、解码、变换、编码。

## 加载流程拆解
1. `Glide.with(context)` 返回 `RequestManager`，绑定生命周期。
2. `load(url).into(imageView)` 创建 `RequestBuilder`，最终生成 `SingleRequest`。
3. `RequestManager` 将请求交给 `Engine`，尝试命中活动资源或内存缓存。
4. 未命中时启动 `EngineJob`，提交到线程池执行 `DecodeJob`。
5. `DecodeJob` 先查磁盘缓存，若仍未命中则通过 `ModelLoader` 拉取源数据并解码。
6. 解码结果经过变换（Transform）后，缓存并回调主线程更新 UI。

```kotlin
// 简化后的请求发起流程，展示 Engine 的缓存命中策略
fun loadFromEngine(key: EngineKey, width: Int, height: Int): Resource<*>? {
    // 活动资源缓存，避免重复加载同一资源
    activeResources[key]?.let { return it }
    // 内存缓存命中后会转入活动资源管理
    memoryCache.remove(key)?.let { activeResources.activate(key, it); return it }
    // 未命中则需要启动解码任务
    return null
}
```

## 关键源码细节
- **生命周期感知**：`SupportRequestManagerFragment` 隐藏附着在 FragmentManager 中，自动处理 `onStart`/`onStop`/`onDestroy`，避免内存泄漏。
- **多级缓存协同**：活动资源使用 `ReferenceQueue` + 弱引用追踪，内存缓存按 LRU 淘汰，磁盘缓存默认 250MB 可调。
- **ModelLoader**：通过注册表（`Registry`）将模型类型（URL、Uri、File 等）映射到数据加载器，便于扩展。
- **变换链**：`Transformation` 支持链式组合，最终在 `ResourceEncoder` 写回磁盘缓存。

## 实践与扩展建议
- 自定义 `ModelLoader` 支持特殊协议或加密图源。
- 通过 `DiskCacheStrategy` 精细控制磁盘缓存策略（ALL、RESOURCE、DATA、NONE）。
- 在 `RequestOptions` 中统一设置占位图、错误图、裁剪/变换策略。
- 使用 `AppGlideModule` 注册全局配置、日志、解码器或内存缓存大小。

## 风险与优化
- **内存压力**：大图加载需关注 `DownsampleStrategy` 与 `PreferredBitmapConfig`，避免 OOM。
- **生命周期错位**：确保在非 UI 场景使用 `ApplicationContext`，防止泄漏。
- **线程调度**：IO 密集任务宜划分线程池优先级，避免与业务线程互抢。

## 调试建议
- 启用 `setLogLevel(Log.VERBOSE)` 查看内部日志。
- 借助 `GlideTrace`（自 AndroidX Start 版本）分析主线程阻塞。
- 使用 `GlideApp` + Debug 工具查看缓存命中率与内存占用。
