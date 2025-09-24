# Fragment 详解

Fragment 是可复用的界面与逻辑单元，可在 Activity 中动态组合 UI。借助 Fragment，可实现自适应布局、模块化导航与更细粒度的生命周期管理。

## 角色定位与使用价值
- 在单 Activity 架构中承载不同页面或流程步骤。
- 支持手机、平板、折叠屏的多栏布局与响应式设计。
- 与 ViewModel、Navigation 组件配合，实现状态分离与无缝路由。

## 生命周期与宿主协作
- `onAttach()`：获取 `Context` 与生命周期回调，可注入依赖。
- `onCreate()`：初始化不可见的状态数据，如 ViewModel、Adapter。
- `onCreateView()` / `onViewCreated()`：加载布局并绑定视图；建议在 `onViewCreated()` 中完成 View 绑定。
- `onStart()` / `onResume()`：界面可见/可交互，订阅数据源。
- `onPause()` / `onStop()`：暂停动画、释放摄像头等重资源。
- `onDestroyView()`：销毁视图层级，清理与 View 相关的引用，避免内存泄漏。
- `onDestroy()` / `onDetach()`：销毁剩余资源并与宿主分离。

> 关键提示：ViewBinding 等引用需在 `onDestroyView()` 重置为 null，以免泄漏。

## FragmentManager 与事务管理
- 通过 `FragmentManager` 的 `beginTransaction()` 发起事务，支持 `add`、`replace`、`remove`、`show`、`hide`。
- 使用 `addToBackStack()` 控制返回栈；对于多模块路由，推荐统一封装导航器。
- 避免在 `commit()` 后立即访问视图，可使用 `commitNow()` 或 `executePendingTransactions()` 确保同步完成。

## Navigation Component 集成
- 使用 `NavHostFragment` 承载导航图，简化事务管理。
- Safe Args 插件生成类型安全的参数传递类。
- 支持深层链接（Deep Link）与全局动作（Global Action），提升可维护性。

## 状态与通信
- Fragment 共享状态：使用 `ViewModelProvider(requireActivity())` 获得 Activity 级 ViewModel。
- 结果回传：采用 `FragmentResultListener` 替代旧版 `setTargetFragment()`。
- 与 Activity 通信：定义接口或使用共享 ViewModel，避免直接强转。

## 多窗口与自适应布局
- 借助 `FragmentContainerView` 与 `childFragmentManager` 构建嵌套布局。
- 使用 `FragmentTransaction#setReorderingAllowed(true)` 减少状态丢失。
- 针对横屏/大屏场景，结合 `SlidingPaneLayout`、`Jetpack WindowManager` 动态调整布局。

## Compose 与 Fragment 的协作
- 在 Fragment 中使用 `ComposeView` 嵌入 Compose UI，调用 `setViewCompositionStrategy` 指定销毁策略。
- Activity + Compose 导航中，可使用 `AndroidViewBinding`/`AndroidView` 承载传统 View。

## 性能与稳定性
- 避免在 Fragment 构造函数中传参，统一使用 `arguments` Bundle。
- 处理重建：使用 `setRetainInstance(false)`（默认）并依赖 ViewModel；若需保留，考虑 `FragmentFactory`。
- 事务过多导致状态丢失：检查 `commitAllowingStateLoss()` 的使用，尽量避免。

## 测试策略
- 单元测试：对 ViewModel 与 Presenter 独立测试。
- UI 测试：利用 FragmentScenario 模拟生命周期，结合 Espresso/Compose Test。
- 集成测试：在导航图中验证深层链接、返回栈与参数传递。

## 常见问题排查
- IllegalStateException：确认在正确的生命周期阶段提交事务，避免在保存状态后调用。
- Fragment 重叠：检查事务是否重复 `add`，或使用 `replace` 防止残留。
- 内存泄漏：确保匿名类、Handler、LiveData 观察者在适当阶段移除。

通过统一的生命周期管理、清晰的事务封装与现代 Jetpack 组件的结合，Fragment 能够灵活支撑多场景界面需求，同时保持良好的可维护性。
