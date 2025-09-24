# Android View 绘制机制详解

## 1. 总体流程概览
- View 绘制遵循 **measure → layout → draw** 三阶段：测量尺寸、摆放位置、渲染内容。
- 绘制由 `ViewRootImpl` 协调，关联窗口与 `View` 树，负责响应 VSync、触发遍历与硬件加速管线。
- 渲染输出通过 `Surface` 提供缓冲区，最终由 `SurfaceFlinger` 合成展示到屏幕。

## 2. 启动绘制的触发途径
1. **首次绘制**：
   - Activity `setContentView()` 后，`ViewRootImpl` 在 `performTraversals` 中完成三阶段。
   - 系统等待 Window 具备尺寸、Surface 可用后开始。
2. **布局/尺寸变化**：
   - 调用 `requestLayout()` 触发 measure/layout，再视情况重新 draw。
3. **内容更新**：
   - `invalidate()` 或 `postInvalidate()` 标记脏区，只执行 draw。
4. **VSync 驱动**：
   - `Choreographer` 在每帧 VSync 回调 `doFrame()`，协调输入、动画与绘制顺序。

## 3. measure 阶段细节
- **MeasureSpec** = 模式 (UNSPECIFIED/EXACTLY/AT_MOST) + 尺寸。
- 父容器根据自身布局参数与子 View 的 LayoutParams 计算 MeasureSpec。
- `View.measure()` → `onMeasure()`：子类可重写确定自身尺寸。
- 测量结果存储在 `mMeasuredWidth/Height`，并通过 `setMeasuredDimension()` 设置。
- 注意：
  - 多次测量需保证幂等，避免死循环。
  - 自定义 View 在 `wrap_content` 下需给出合理默认值。

## 4. layout 阶段细节
- `View.layout(l,t,r,b)` 确定 View 在父容器中的实际位置。
- 内部调用 `onLayout()`，ViewGroup 在此遍历子 View 并调用子 View 的 `layout`。
- 布局完成后，`mLeft/mTop/mRight/mBottom` 固定；若位置发生变化将触发后续 draw。

## 5. draw 阶段细节
- `View.draw(Canvas)` 逻辑顺序：
  1. 绘制背景 (`drawBackground`)。
  2. 保存画布状态 → 调用 `onDraw()` 绘制内容。
  3. 绘制子元素 (`dispatchDraw`)；`ViewGroup` 负责遍历子 View。
  4. 绘制前景（scrollbar、foreground）。
- 自定义 View 重写 `onDraw()`，通过 Canvas API 绘制图形文本。
- 硬件加速时由 RenderThread 与 GPU 渲染 DisplayList，避免重复计算。

## 6. ViewRootImpl 与窗口协作
- `ViewRootImpl` 绑定根视图 DecorView，管理：
  - 窗口输入队列、绘制遍历、VSYNC 处理、Surface 生命周期。
- `performTraversals()` 内部依次执行 `performMeasure()`、`performLayout()`、`performDraw()`。
- `scheduleTraversals()` 通过 `Choreographer` 注册下一帧回调，确保在 VSync 对齐后执行。

## 7. VSync、Choreographer 与渲染管线
- `Choreographer` 将每帧工作划分为 Input → Animation → Traversal → Commit 阶段。
- VSync 信号来自 SurfaceFlinger，通过 Binder 传递到应用端 `DisplayEventReceiver`。
- 渲染完成后，`ViewRootImpl` 调用 `Surface.unlockCanvasAndPost()` 或 RenderThread 将缓冲区提交给 SurfaceFlinger。

## 8. 关键 API 差异
- `invalidate()`：当前线程调用（主线程），立即标记脏区；只重绘目标区域。
- `postInvalidate()`：可在子线程调用，内部切换至主线程执行。
- `requestLayout()`：触发 measure/layout/draw；若在 layout 阶段调用会延迟到下一帧。
- `forceLayout()`：强制下次 measure/layout，慎用。

## 9. 自定义 View/ViewGroup 指南
1. **自定义 View**：
   - 重写 `onMeasure()`，处理 `wrap_content`。
   - 重写 `onDraw()`，使用抗锯齿、复用 `Paint`。
2. **自定义 ViewGroup**：
   - 重写 `onMeasure()`：测量子 View，结合 `MarginLayoutParams`。
   - 重写 `onLayout()`：手动布局子元素。
   - 如需支持 `LayoutParams` 扩展，重写 `generateLayoutParams` 等方法。
3. **性能优化**：
   - 减少 View 层级，使用 ConstraintLayout/MotionLayout。
   - 利用 `setWillNotDraw(true)` 避免多余绘制。
   - 缓存复杂绘制结果（如 `Bitmap`、`Picture`）。

## 10. 渲染性能与调优
- **卡顿分析**：
  - `adb shell dumpsys gfxinfo <package>` 查看每帧耗时。
  - `Profile GPU Rendering`、`Perfetto` 分析渲染负载。
- **Overdraw 控制**：`Debug GPU Overdraw` 查看重复绘制区域，优化背景叠加。
- **硬件加速注意事项**：
  - Shader、Xfermode、Canvas.saveLayer 可能触发离屏渲染，需评估成本。
  - 关闭硬件加速 `android:hardwareAccelerated="false"` 会退回 CPU 绘制，慎用。
- **合成与刷新率**：针对 90Hz/120Hz 设备需确保计算阶段 < 帧时长。

## 11. 绘制相关常见问题
- **闪烁/白屏**：布局复杂、首次加载数据延迟；可使用占位图/预绘制。
- **布局错位**：`onLayout` 中误用 child 参数或未考虑 padding/margin。
- **MeasureSpec 使用错误**：子 View 忽略父容器模式导致尺寸异常。
- **线程安全**：UI 操作必须在主线程；后台线程需通过 Handler/Coroutine 切换。
- **动画影响布局**：LayoutParams 改变需调用 `requestLayout()`；仅视觉变换可用 `ViewPropertyAnimator`。

## 12. 与 Compose 的关系
- Jetpack Compose 底层仍通过 `ViewRootImpl` 与 Surface 协同，但自身的 Layout/Measure 由 Compose Runtime 管理。
- 传统 View 与 Compose 可混合（`ComposeView`、`AndroidView`）。
- Compose 的 recomposition 相当于更细粒度的 `invalidate`，依赖 Choreographer 触发。

## 13. 调试工具与日志
- `Layout Inspector`/`Layout Validation`：实时查看 View 树结构与属性。
- `RenderThread` Trace：定位 GPU 负载、DisplayList 构建时间。
- `StrictMode.setThreadPolicy`：捕获主线程长时间绘制或阻塞。
- 自定义 `ViewTreeObserver.OnDrawListener`、`OnGlobalLayoutListener` 观察布局变化。

## 14. 最佳实践清单
- 设计界面时优先使用约束式布局，减少嵌套与深度遍历。
- 合理拆分布局模块，复用 `include`、`merge`、`ViewStub`。
- 避免在 `onDraw()` 中分配对象或进行复杂逻辑。
- 对实时更新的视图使用动画与差分工具（如 DiffUtil）降低重绘成本。
- 在开发阶段开启过度绘制、布局边界调试，持续优化。

---
深入掌握 View 绘制流程，有助于优化界面性能、定位渲染问题，并为自定义控件开发打下坚实基础。

