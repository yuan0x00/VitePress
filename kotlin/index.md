## 一、Kotlin 基础

### 1. 基本语法

- **变量与常量**：`val`（不可变）、`var`（可变）、类型推断
- **基本数据类型**：Int、Double、String、Boolean 等
- **控制流**：if、when（类似 switch）、for、while 循环
- **函数**：函数声明、默认参数、命名参数、lambda 表达式
- **空安全**：可空类型（`?`）、安全调用（`?.`）、Elvis 运算符（`?:`）、非空断言（`!!`）

### 2. 面向对象编程

- **类与对象**：类的定义、构造函数（主构造函数、次构造函数）、初始化块
- **继承与接口**：`open` 关键字、抽象类、接口实现
- **数据类**：`data class` 自动生成 `toString()`、`equals()` 等
- **伴生对象**：`companion object` 用于静态成员
- **密封类**：`sealed class` 用于受限的类层次结构

### 3. 高级特性

- **扩展函数与属性**：为现有类添加功能
- **高阶函数**：函数作为参数或返回值
- **内联函数**：`inline` 优化 lambda 性能
- **委托**：属性委托（`by lazy`、`observable`）、接口委托
- **泛型**：泛型类、函数、协变（`out`）、逆变（`in`）

## 二、安卓开发中的 Kotlin 核心应用

### 1. 安卓基础组件

- **Activity**：使用 Kotlin 管理生命周期、传递数据（Intent）
- **Fragment**：Kotlin 中的 Fragment 导航、View Binding
- **View**：Kotlin 合成属性（Synthetic）、View Binding、Jetpack Compose
- **布局**：XML 布局与 Kotlin 交互、ConstraintLayout 使用
- **资源管理**：字符串、图片、颜色等资源的 Kotlin 访问

### 2. Jetpack 库与 Kotlin

- **ViewModel**：结合 `LiveData` 或 `StateFlow` 实现 MVVM 架构
- **LiveData**：响应式数据观察
- **Room**：Kotlin 下的数据库操作、DAO 定义、协程支持
- **Navigation**：导航图、Safe Args、Kotlin 下的 Fragment 切换
- **WorkManager**：后台任务调度
- **Data Binding**：Kotlin 与 XML 数据绑定

### 3. 协程（Coroutines）

- **基础**：`launch`、`async`、`withContext`、协程作用域
- **生命周期管理**：`lifecycleScope`、`viewModelScope`
- **异常处理**：`CoroutineExceptionHandler`
- **异步流（Flow）**：`StateFlow` 和 `SharedFlow` 在 UI 层的应用
- **与 Retrofit 结合**：异步网络请求处理

## 三、高级主题

### 1. 架构模式

- **MVVM**：Kotlin 结合 Jetpack 组件实现 MVVM
- **MVI**：Kotlin 下的状态管理与单向数据流
- **依赖注入**：Hilt 或 Koin 在 Kotlin 中的应用
- **模块化**：多模块项目结构、Kotlin 模块间通信

### 2. 性能优化

- **内存管理**：避免内存泄漏（弱引用、清理资源）
- **协程优化**：避免过度使用协程、合理选择调度器
- **ProGuard/R8**：Kotlin 代码的混淆与优化

### 3. 测试

- **单元测试**：JUnit、Mockito-Kotlin、KotlinTest
- **UI 测试**：Espresso、Robolectric
- **协程测试**：`kotlinx-coroutines-test` 库

### 4. 高级库与工具

- **Retrofit**：Kotlin 协程与网络请求
- **Glide/Picasso**：图片加载与缓存
- **Jetpack Compose**：Kotlin 下的声明式 UI 开发
- **Kotlin Multiplatform Mobile (KMM)**：跨平台开发基础
