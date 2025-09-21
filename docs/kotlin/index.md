# Kotlin 工程能力地图

## 阶段 1 语言基础

**核心技术点**

- 语法与类型：`val`/`var`、类型推断、基本类型、字符串模板、范围表达式。
- 控制流：`if` 表达式、`when` 模式匹配、`for`/`while` 循环、尾递归优化。
- 函数与参数：默认/命名参数、可变参数、单表达式函数、扩展函数、局部函数。
- 空安全：可空类型、`?.`、`?:`、`!!`、`let`、`run`、`require`/`check`。

**落地任务**

- 实现命令行工具（参数解析 → 业务逻辑 → 输出），覆盖空安全与扩展函数。
- 编写 Kotlin Koans 或 LeetCode 解题笔记，关注函数式思维与代码整洁。

## 阶段 2 面向对象与数据建模

**核心技术点**

- 类与构造：主/次构造、初始化块、访问修饰符、`data class`、`sealed class`。
- 继承与接口：`open`、抽象类、接口默认实现、多态、接口委托。
- 伴生对象与对象声明：`companion object`、单例、匿名对象、对象表达式。
- 枚举与密封接口：状态建模、`when` 匹配完整性检查。

**落地任务**

- 用 `sealed class` 建模网络请求状态，并在单元测试中验证分支覆盖。
- 将 Java 老代码迁移至 Kotlin，重构为数据类 + 扩展函数，记录等价性校验方法。

## 阶段 3 函数式与集合操作

**核心技术点**

- 高阶函数：函数类型、Lambda、`inline`、`crossinline`、`noinline`。
- 集合 API：`map`/`filter`/`fold`/`sequence`、懒序列、`groupBy`、`chunked`。
- DSL 构建：`apply`、`also`、`with`、`buildString`、`invoke` 运算符。
- 尾随 Lambda 与领域特定语言设计。

**落地任务**

- 编写 DSL 创建配置文件（如 Gradle-like），输出 AST/执行结果。
- 对比列表/序列处理大型数据集的性能，使用 JMH 或 Benchmark 测试。

## 阶段 4 协程与并发模型

**核心技术点**

- 协程基础：`suspend`、`CoroutineScope`、`Job`、`SupervisorJob`、调度器。
- 结构化并发：`launch`/`async`、`withContext`、协程作用域管理、异常传播。
- Flow：`Flow`/`StateFlow`/`SharedFlow`、背压策略、`flowOn`、`retry`、`catch`。
- 协程与平台：`lifecycleScope`、`viewModelScope`、`CoroutineScope` in backend、`Dispatchers` 对比。
- 测试：`kotlinx-coroutines-test`、`runTest`、`TestDispatcher`、虚拟时间。

**落地任务**

- 实现并发数据聚合器（网络请求 + 缓存 + 超时重试），编写协程单测与 Flow 单测。
- 分析协程泄漏案例（未取消/异常吞噬），给出修复方案并形成规范。

## 阶段 5 高级工程实践

**核心技术点**

- 泛型与类型系统：型变 (`out`/`in`)、型投影、`reified`、协变集合、`typealias`。
- 反射与注解：`KClass`、`callBy`、`annotations`、元注解、自定义注解与编译器插件概念。
- 多平台：KMM 项目结构、`expect/actual`、共享模块、平台特化、Compose Multiplatform。
- 编译与性能：Kotlin 编译流程、增量编译、编译插件、性能陷阱（装箱、扩展属性、Lambda 分配）。
- 工程治理：Detekt、ktlint、Dokka、Gradle Kotlin DSL 脚本组织、版本对齐。

**落地任务**

- 构建泛型工具库，演示 `reified` 与内联函数简化反射逻辑。
- 创建 KMM Demo（共享数据层 + 平台 UI 桥接），记录调试经验。
- 对大型模块进行 ktlint/Detekt 改造，输出规范落地与问题清单。