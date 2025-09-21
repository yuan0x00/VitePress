# Java 工程能力地图

## 阶段 1 开发环境与语法基础

**核心技术点**

- 工具链：JDK 版本管理（SDKMAN、jenv）、IntelliJ IDEA 配置、Maven/Gradle 基础命令、Checkstyle/Spotless。
- 语法基础：基本类型、控制流、数组与集合初识、`String`/`StringBuilder`、自动装箱与拆箱。
- 类与对象：类声明、访问控制、构造方法、封装、简单继承与接口。
- 单元测试：JUnit5、AssertJ、Mockito、测试生命周期与断言风格。

**落地任务**

- 编写命令行应用（参数解析→业务逻辑→输出），覆盖单元测试与代码风格检查。
- 搭建 Maven 与 Gradle 双模版项目，完成本地构建与依赖管理演练。

## 阶段 2 面向对象与语言进阶

**核心技术点**

- 面向对象：继承、抽象类、接口多实现、组合优于继承、内部类、枚举。
- 泛型与集合：泛型方法/通配符、集合框架（List/Set/Map）、不可变集合、`Collections` 工具类。
- 异常与错误处理：受检/非受检异常、try-with-resources、自定义异常、日志与错误上下文。
- 注解与反射：元注解、运行时注解、反射访问、动态代理、服务加载器（SPI）。
- 模块化：JDK 模块系统（JPMS）、多模块依赖管理。

**落地任务**

- 将遗留 Java 代码重构为泛型集合方案并引入 try-with-resources，撰写重构记录。
- 实现注解驱动的轻量插件机制（扫描→注册→执行），并提供单元测试覆盖。

## 阶段 3 函数式与数据处理

**核心技术点**

- 函数式接口：`Predicate`、`Function`、自定义函数式接口、方法引用、`Optional`。
- Stream API：中间/终止操作、并行流、收集器、`Collectors` 自定义、性能注意事项。
- 日期时间：`java.time` API、时区处理、不可变日期类型、`Period`/`Duration`、`TemporalAdjuster`。
- I/O 与序列化：NIO.2、`Files` 工具、缓冲流、JSON 序列化（Jackson/JSON-B）、序列化安全。
- 数据校验与映射：Bean Validation、MapStruct、记录类型（Record）与模式匹配演进。

**落地任务**

- 构建数据处理流水线（文件读取→Stream 清洗→JSON 序列化），并对比传统循环性能。
- 实施 Bean Validation + MapStruct 案例，展示 DTO ↔ Domain 转换与测试策略。

## 阶段 4 并发与 JVM 能力

**核心技术点**

- 线程与执行器：线程生命周期、`ExecutorService`、线程池参数调优、`ScheduledExecutorService`。
- 同步与锁：`synchronized`、`ReentrantLock`、`StampedLock`、原子类、`ThreadLocal`、`CompletableFuture`。
- 异步与响应式：CompletionStage、`Flow` API、背压机制、Project Loom 虚拟线程趋势。
- JVM 基础：类加载过程、运行时数据区、JIT、逃逸分析、Java 内存模型（JMM）。
- GC 与诊断：Serial/Parallel/G1/ZGC、GC 日志解析、JFR、Java Mission Control、`jcmd`/`jmap`。

**落地任务**

- 搭建并发任务调度器，比较不同线程池策略并输出压测与监控数据。
- 采集 GC/JFR 数据，定位一次内存泄漏或停顿问题并撰写优化复盘。