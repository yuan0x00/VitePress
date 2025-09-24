# RecyclerView 原理与源码解读

## 核心概述
RecyclerView 是高度可扩展的列表容器，通过 ViewHolder 缓存、可插拔的 LayoutManager、ItemDecoration 与动画系统，实现高性能的列表与网格展示。其关键在于回收复用机制、增量绘制与差分更新。

## 架构组成
- **Adapter**：负责创建与绑定 ViewHolder，提供数据源。
- **ViewHolder**：缓存 item 内部视图引用，避免重复查找。
- **LayoutManager**：决定布局方式（Linear/Grid/Staggered 等），负责测量、定位与回收逻辑。
- **Recycler**：管理 `RecycledViewPool` 与临时缓存（`ViewCacheExtension`），为 LayoutManager 提供可复用 ViewHolder。
- **ItemAnimator**：处理增删改动画。
- **DiffUtil/ListAdapter**：辅助差分刷新，提高效率。

## 布局与滑动流程
1. 初始化阶段调用 `setLayoutManager`、`setAdapter`，RecyclerView 注册数据观察者。
2. 布局时进入 `dispatchLayout`，依次处理 `onLayoutChildren`（由 LayoutManager 实现），期间通过 `Recycler.getViewForPosition` 获取复用 View。
3. 滑动阶段 `scrollBy` -> `LayoutManager.scrollHorizontallyBy/scrollVerticallyBy`，在移动中回收离屏 View 并填充新 View。
4. Adapter 数据变更时，`notifyItemChanged` 等方法触发 `AdapterHelper` 记录操作，下一帧 `dispatchLayoutStep1/2/3` 执行动画与更新。

```kotlin
// Recycler 获取复用 View 的关键逻辑
fun getViewForPosition(position: Int): View {
    var holder = tryGetViewHolderForPositionByDeadline(position)
    if (holder == null) {
        holder = mAdapter.createViewHolder(this, mAdapter.getItemViewType(position))
    }
    mAdapter.bindViewHolder(holder, position)
    return holder.itemView
}
```

## 关键源码细节
- **缓存层级**：`Recycler` 维护双层缓存（`mAttachedScrap`、`mCachedViews`），更远层次使用 `RecycledViewPool` 共享跨 RecyclerView 的 ViewHolder。
- **预取（Prefetch）**：`GapWorker` 在滑动预测下一个位置时提前创建/绑定 View，改善滑动流畅度。
- **StableIds**：启用 `setHasStableIds(true)`，结合 DiffUtil 提高动画精度。
- **ItemTouchHelper**：基于 RecyclerView 扩展，提供拖拽/滑动删除等交互。

## 实践建议
- 使用 `ListAdapter` 或 `AsyncListDiffer` 自动处理差分更新，避免手动 `notifyDataSetChanged`。
- 对大列表启用 `setItemViewCacheSize`、`setRecycledViewPool` 优化复用。
- 将耗时操作放在 `onBindViewHolder` 外部，避免 UI 卡顿；图片加载结合 Glide/Fresco。
- 结合 `ConcatAdapter` 实现多类型拼接，避免复杂的 switch 逻辑。

## 风险与调试
- **内存泄漏**：ViewHolder 持有外部引用需谨慎；在 `onViewRecycled` 中释放资源。
- **滑动性能**：使用 Android Profiler 分析掉帧，检查 `GapWorker` 预取是否生效。
- 调试布局可调用 `RecyclerView.setItemViewCacheSize(0)` 观察回收行为，或启用 `LinearLayoutManager.setStackFromEnd` 验证边缘对齐。
