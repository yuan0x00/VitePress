# Android 应用构建流程

## 1. 流程概览

Android 应用的构建可以理解为一条流水线：Gradle 解析工程配置 → 拉取并解析依赖 → 编译 Java/Kotlin 与本地代码 →
处理资源与清单 → 字节码压缩与多 dex 拆分 → 打包生成 APK/AAB → 签名与对齐 → （可选）上传分发/安装并在设备上做 dex 优化。整个过程由
Android Gradle Plugin（AGP）驱动，核心工具链包括 `javac/kotlinc`、`aapt2`、`d8/r8`、`bundletool`、`zipalign` 和 `apksigner` 等。

## 2. 构建环境准备

- **JDK**：AGP 8.x 以后默认要求 JDK 17，IDE 通常内置。注意配置 `JAVA_HOME`。
- **Android SDK & NDK**：包含平台 API、构建工具（`build-tools`）、平台工具（`platform-tools`）、`cmake/ndk-build` 等。通过
  Android Studio SDK Manager 或 `sdkmanager` 安装。
- **Gradle & AGP**：Gradle Wrapper（`gradlew`）确保团队版本一致；`com.android.tools.build:gradle` 决定构建行为。
- **构建缓存与代理**：配置 Gradle 缓存、企业 Maven 仓库与网络代理，以加速依赖解析。

## 3. 项目结构与配置解析

1. **`settings.gradle`**：列出参与构建的模块（`include`）、配置仓库镜像、使用版本编录（Version Catalog）。
2. **`build.gradle[.kts]`**：分模块定义插件、Android DSL、依赖、构建变种（`buildTypes`/`productFlavors`）、Kotlin 选项等。
3. **Gradle 初始化阶段**：Gradle 读取 Wrapper → 初始化构建环境 → 配置阶段执行脚本 → 构建任务图。构建缓存、configuration
   cache 可缩短该阶段。

## 4. 主要构建流水线

### 4.1 依赖解析

- Gradle 根据 `repositories {}` 与 `dependencies {}` 拉取远程/本地依赖，解析 POM 与变体选择（ABI、风味）。
- 使用 `dependencyResolutionManagement` 与版本编录统一版本。
- 对 Artifact 做校验（SHA-256），并缓存到 Gradle 本地仓库。

### 4.2 源码编译

- **Kotlin**：`kotlinc` 先编译成 JVM 字节码（`.class`），再交给 `javac` pipeline；Kotlin Gradle Plugin 负责任务编排。
- **Java**：`javac` 将源文件编译为 `.class`，生成 R 类引用资源常量。
- **增量/并行编译**：开启 Gradle `org.gradle.parallel=true`、`kapt.incremental.apt=true` 等提升效率。

### 4.3 注解处理与字节码织入

- `kapt`、`annotationProcessor`、`ksp` 执行代码生成。
- Gradle Transform API 或 ASM/ByteBuddy 进行字节码插桩（传统 Transform 被 AGP 8.x 的 ASM Class Visitors 和 Articulation
  APIs 替换）。

### 4.4 资源与清单处理

- **`aapt2 compile`** 将 `res/` 编译成中间 `.flat` 资源包。
- **资源合并**：主模块 + 依赖 AAR 资源合成，处理命名冲突和叠加。
- **`aapt2 link`** 生成最终 `resources.arsc`、`res/` 目录与 `AndroidManifest.xml`，并输出 R 类常量表。
- **Data Binding/View Binding**：在此阶段生成绑定类。
- **构建变种处理**：`manifestPlaceholders`、`buildType`/`flavor` 的资源覆写在此合并。

### 4.5 本地代码构建（可选）

- 使用 `cmake` 或 `ndk-build` 编译 C/C++ 源文件，输出 `.so`（ABI 匹配 `armeabi-v7a/arm64-v8a` 等）。
- Gradle `externalNativeBuild` 任务协调 ABI 拆分、调试符号（`*.so.dbg`）。

### 4.6 字节码压缩与 dex 生成

- **R8**（默认启用）：执行代码缩减、Tree Shaking、混淆、优化（inlining、constant folding）。配置 `proguard-rules.pro`。
- **D8**：将优化后的 `.class` 转为 `.dex`，支持 desugaring（lambda、default method、Java 8 API backport）。
- **多 Dex**：当方法数超 65,536 时，AGP 自动拆分 dex（`main-dex list` 可控制核心类放入主 dex）。

### 4.7 打包产物

- **APK**：`apkbuilder` 将 `classes.dex`、`resources.arsc`、`res/`、`assets/`、`lib/`、`META-INF/` 等打包成 ZIP。
- **Android App Bundle (AAB)**：通过 Gradle `:app:bundleRelease` 调用 `bundletool` 生成 `.aab`，用于分发动态特性模块、按需拆分。
- **Split APK**：启用 ABI、屏幕密度、语言拆分，可减少下载体积。

### 4.8 签名与对齐

- **签名**：
    - V1（Jar Signature）：兼容旧设备；对 ZIP 条目逐条签名。
    - V2/V3：对整个 APK 分块签名，更快安全；V3 支持 key rotation。
    - V4（可选）：为 Play Store 加速增量更新提供校验。
    - 使用 `apksigner` 或 Gradle `signingConfig` 指定 keystore、别名、密码。
- **zipalign**：对齐 4 字节边界，降低安装时内存占用。AGP 在 `assemble` 阶段自动执行。

### 4.9 构建输出与发布

- `assembleDebug/Release` 输出 APK；`bundleRelease` 输出 AAB。
- 使用 `gradlew tasks --all` 浏览任务图；`gradlew :app:assembleRelease --scan` 获取 Build Scan 报告。
- 发布到 Play：上传 AAB，借助 Play Console 完成签名配置、测试轨道、分阶段发布。
- 企业内部分发可使用 APK + MDM 或自建更新平台。

## 5. 构建后流程（安装与运行时）

1. 安装器验证签名 → 解压资源 → 写入 `/data/app`。
2. 首次运行时 `dex2oat` 依据设备 profile 生成 `.oat/.vdex`，加速后续启动。
3. Profile Guided Compilation：系统在后台收集热点方法，触发 `cmd package compile -m speed-profile` 优化。

## 6. 构建优化实践

- **配置缓存**：启用 `org.gradle.configuration-cache=true`。
- **并行与守护进程**：`org.gradle.parallel=true`、`org.gradle.daemon=true`。
- **本地/远程构建缓存**：`gradle.properties` 中开启 `gradle.buildCache`.
- **依赖瘦身**：使用 `./gradlew :app:dependencies`，排查重复依赖；启用 R8 资源压缩（
  `android.buildFeatures.shrinkResources=true`）。
- **模块化**：拆分动态特性模块（Dynamic Feature），减少主 APK 体积。
- **持续集成**：在 CI（GitHub Actions、Jenkins、GitLab CI）上配置 `./gradlew test lint assembleRelease`，结合缓存与签名管理。

## 7. 常见问题排查

| 问题          | 可能原因          | 排查建议                                                     |
|-------------|---------------|----------------------------------------------------------|
| 构建极慢        | 配置阶段耗时、依赖解析过多 | 使用 `--scan` 分析，启用 configuration cache，镜像仓库               |
| R8 混淆后崩溃    | 保留规则缺失        | 在 `proguard-rules.pro` 添加 `-keep`，启用 stack trace retrace |
| MultiDex 崩溃 | 主 dex 类缺失     | 配置 `multiDexKeepFile` 或 `@Keep`，检查 Application 初始化类      |
| NDK 编译失败    | ABI 不匹配/工具链缺失 | 确认 `abiFilters`、NDK 版本；查看 `cmake` 日志                     |
| 资源冲突        | 依赖重复资源名       | 使用 `aapt2` 日志、`tools:replace`，调整命名空间                     |

## 8. 参考与深入阅读

- Android 官方文档：https://developer.android.com/studio/build
- AOSP 构建系统说明：https://source.android.com/docs/setup/build
- Android Gradle Plugin DSL：https://developer.android.com/build/gradle-tips
- R8 与代码压缩：https://developer.android.com/studio/build/shrink-code
- App Bundle 与 bundletool：https://developer.android.com/guide/app-bundle

> 提示：若需结合企业自建 CI/CD，可在本文流程基础上补充制品仓库、签名服务（如 Google Play App Signing）、灰度发布策略等扩展环节。
