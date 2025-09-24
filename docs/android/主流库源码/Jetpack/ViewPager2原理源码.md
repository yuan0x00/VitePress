# ViewPager2 原理与源码解读

## 核心概述
ViewPager2 是 ViewPager 的升级版，基于 RecyclerView 实现横向/纵向分页。得益于 RecyclerView 的复用机制与 DiffUtil 支持，ViewPager2 提供更灵活的页面管理、RTL 支持、可变高度以及与 `FragmentStateAdapter` 的深度整合。

## 架构组成
- **RecyclerView + LinearLayoutManager**：内部以横向或纵向的 LayoutManager 布局页面。
- **ScrollEventAdapter**：监听滚动事件，转换为页面位移与状态回调。
- **FakeDrag**：通过 `fakeDragBy` 实现代码驱动的拖拽效果。
- **PageTransformerAdapter**：桥接页面动画，与 `ViewPager.PageTransformer` 兼容。
- **FragmentStateAdapter**：官方提供的 Fragment 适配器，管理 Fragment 的创建、销毁与状态保存。

## 页面切换流程
1. 调用 `setAdapter` 后，内部创建 `PagerSnapHelper` 保证一次滚动停留在整页。
2. 用户滑动或调用 `setCurrentItem` 时，`RecyclerView` 触发滚动，`ScrollEventAdapter` 计算偏移量与方向。
3. `ScrollEventAdapter` 更新内部状态（`SCROLL_STATE_DRAGGING`/`SETTLING`/`IDLE`），并回调 `OnPageChangeCallback`。
4. RecyclerView 完成滚动后，`notifyDatasetChanged` 或差分更新会触发页面重建或复用。

```kotlin
// ViewPager2 设置当前页核心实现
fun setCurrentItemInternal(item: Int, smoothScroll: Boolean) {
    val target = dataSetChangeObserver.isInProgress ? pendingCurrentItem : clampItem(item)
    if (smoothScroll) recyclerView.smoothScrollToPosition(target)
    else recyclerView.scrollToPosition(target)
    scrollEventAdapter.notifyProgrammaticScroll(target, smoothScroll)
}
```

## FragmentStateAdapter 工作机制
- 使用 `LongSparseArray<Fragment>` 记录已创建的 Fragment，Key 为 itemId。
- `createFragment(position)` 由开发者实现，Adapter 在 `onBindViewHolder` 时确保 Fragment 附着到 `FragmentTransaction`。
- 使用 `FragmentStateManager` 保存/恢复状态，在生命周期边界调用 `saveState`、`restoreState`，支持 Configuration Change。

## 关键源码细节
- **OffscreenPageLimit**：通过 `RecyclerView.setItemViewCacheSize` 控制预加载页面数量，默认 1。
- **UserInputEnabled**：封装 `RecyclerView.isLayoutFrozen` 控制手势是否生效。
- **NestedScrolling**：借助 RecyclerView 的嵌套滚动实现与 CoordinatorLayout、AppBarLayout 的联动。
- **DiffUtil 支持**：使用 `ListAdapter` 或手动提交 `notifyItemRange`，页面内容可高效更新。

## 实践建议
- 对 Fragment 页面使用 `FragmentStateAdapter`，结合 `getItemId` 与 `containsItem` 实现稳定 ID，减少重建。
- 对纯 View 页面可自定义 RecyclerView.Adapter，复用普通 ViewHolder 提升性能。
- 使用 `registerOnPageChangeCallback` 监听页面滚动，与 TabLayout 通过 `TabLayoutMediator` 联动。
- 如需可变高度，开启 `setOrientation` 为 `VERTICAL` 或结合 `WrapContentViewPager` 方案动态测量。

## 风险与调试
- **状态丢失**：提交 Fragment 事务时机不当会抛出 `IllegalStateException`，确保在主线程并在生命周期安全期调用。
- **动画冲突**：自定义 PageTransformer 需避免直接修改 alpha/translation 导致闪烁；对 Fragment 使用 `setRetainInstance` 已弃用，应改为 ViewModel。
- 调试可启用 RecyclerView 日志或使用 FragmentTransaction#setMaxLifecycle 观察生命周期变更。
