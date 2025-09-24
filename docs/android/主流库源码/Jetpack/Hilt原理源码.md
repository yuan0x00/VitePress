# Hilt 原理与源码解读

## 核心概述
Hilt 基于 Dagger2 构建，面向 Android 场景提供标准化的依赖注入解决方案。通过编译期代码生成、组件分层与作用域管理，实现自动化的依赖提供与生命周期绑定。

## 架构组成
- **Gradle 插件**：`com.google.dagger:hilt-android-gradle-plugin` 负责注入 Transform、配置聚合任务。
- **Aggregating Task**：收集各模块 `@InstallIn`、`@EntryPoint` 等注解信息，生成聚合类供 Dagger 编译处理。
- **组件体系**：基于 `SingletonComponent`、`ActivityComponent`、`ViewModelComponent` 等多级作用域映射 Android 生命周期。
- **代码生成**：KAPT/KSP 解析注解，生成 `Hilt_EntryPoints`、`*_GeneratedInjector`、`*_ComponentTreeDeps` 等类。
- **EntryPointAccessors**：在运行时获取依赖入口，解决非 Hilt 管理类的注入需求。

## 初始化流程
1. 应用接入 Gradle 插件与 `@HiltAndroidApp` Application。
2. 编译阶段，插件触发 Aggregating Task 聚合所有注解元素，生成 `AggregatedDeps`、`ComponentTreeDeps`。
3. Dagger 注解处理器读取聚合结果，生成每个组件的 Dagger 子图与 Injector。
4. 运行时 `HiltApplication` 在 `onCreate` 中初始化根组件 `SingletonComponent`。
5. `HiltActivity`、`HiltFragment` 等基类在 `onCreate` 里自动调用 `inject()` 连接对应组件，完成依赖注入。

```kotlin
// 以 HiltActivity 基类为例，展示自动注入流程
abstract class Hilt_MyActivity : AppCompatActivity(), GeneratedComponent {
    private var injected = false
    override fun onCreate(savedInstanceState: Bundle?) {
        injectIfNecessary() // 保证只注入一次
        super.onCreate(savedInstanceState)
    }
    private fun injectIfNecessary() {
        if (!injected) {
            injected = true
            (generatedComponent() as MyActivity_GeneratedInjector).injectMyActivity(this)
        }
    }
}
```

## 关键源码细节
- **AggregatedDeps**：采用 `dagger.hilt.internal.aggregatedroot.codegen._com_xxx` 命名，记录每个模块贡献的 Module/EntryPoint。
- **组件绑定**：`@InstallIn` 指定 Module 所属组件，编译期生成 `ComponentHierarchy`，保证作用域正确。
- **作用域注解**：`@Singleton`、`@ActivityScoped` 等通过 `ScopeMetadata` 建立缓存实例或每次新建策略。
- **ViewModel 支持**：`@HiltViewModel` 通过 `HiltViewModelFactory` 与 `SavedStateHandle` 集成，实现依赖注入 + 状态恢复。

## 实践建议
- 在多模块工程中使用 `@EntryPoint` 为动态 Feature 或非 Hilt 管理类提供依赖。
- 利用 `Qualifier`（如 `@Named`）区分多实现依赖，避免同类型冲突。
- 对性能敏感模块开启 KSP 替代 KAPT，减少编译时间。
- 与 WorkManager、Navigation 集成时使用官方提供的辅助注解（`@HiltWorker`、`@AndroidEntryPoint`）。

## 风险与优化
- **编译速度**：注解处理器较重，需控制 Module 数量与依赖关系，必要时开启增量编译。
- **循环依赖**：在 Module 中避免 Provider 互相引用，可通过接口拆分或 Lazy/Provider 延迟注入。
- **测试隔离**：使用 `@TestInstallIn` 重定向 Module，确保测试可注入模拟实现。

## 调试技巧
- 检查 `build/generated` 目录下的 Hilt 生成类，确认组件层级与依赖绑定无误。
- 使用 `hilt-android-testing` 提供的 `HiltAndroidRule` 简化测试注入流程。
- 启用 Gradle 的 `--info` 查看 KAPT/KSP 生成日志，定位编译期错误。
