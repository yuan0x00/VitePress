# Retrofit 原理与源码解读

## 核心概述
Retrofit 基于 OkHttp 提供类型安全的 HTTP Client，通过注解驱动的接口定义 + 动态代理 + 可插拔的适配器与转换器，构建出高度可测试且易扩展的网络访问层。

## 模块与架构
- **注解解析**：`ServiceMethod` 负责解析接口方法上的 HTTP 注解、参数注解并缓存结果。
- **动态代理**：`Proxy.newProxyInstance` 拦截接口调用，交由 `InvocationHandler` 执行。
- **请求构建**：`RequestFactory` 将注解信息转换为 `okhttp3.Request`。
- **调用执行**：默认使用 `OkHttpCall`，也可通过 `CallAdapter` 自定义返回类型（如 RxJava、协程）。
- **数据转换**：`Converter` 将请求 / 响应在 Java/Kotlin 对象与网络传输格式间转换。

## 核心调用链
1. `Retrofit.create(FooService.class)` 生成接口的动态代理；服务方法的解析结果缓存在 `ServiceMethodCache`。
2. 业务层调用接口方法被代理拦截，转交 `ServiceMethod.invoke`。
3. `ServiceMethod` 根据入参组装 `okhttp3.Request`，并委托 `CallAdapter` 得到最终返回类型。
4. 默认 `CallAdapter` 返回 `OkHttpCall`，其 `enqueue` / `execute` 又会落到 OkHttp 的异步/同步请求流程。

```java
// Retrofit 动态代理核心逻辑（删减版，中文注释保留关键点）
public Object invoke(Object proxy, Method method, Object[] args) {
    ServiceMethod<?> serviceMethod = loadServiceMethod(method); // 解析并缓存注解
    OkHttpCall<?> call = new OkHttpCall<>(serviceMethod, args); // 构建 OkHttpCall
    return serviceMethod.callAdapter.adapt(call);                // 适配返回类型
}
```

## 关键源码细节
- **注解处理**：`RequestFactory.Builder` 会遍历方法注解确认 HTTP 动词、路径、查询参数等；参数注解决定如何注入到请求。
- **缓存策略**：`ServiceMethodCache` 使用 `ConcurrentHashMap`，保证首次解析后即可复用，降低反射开销。
- **异常包装**：通过 `HttpException`、`InvocationException` 统一抛出网络/解析错误，便于上层区分。

## 扩展与实践
- 配置 `Converter.Factory` 支持 JSON（Gson/Moshi）或 ProtoBuf；自定义 `RequestBody` 编码。
- 编写 `CallAdapter.Factory` 适配协程 `suspend`、`LiveData` 或 `Flow` 返回类型。
- 结合 OkHttp 拦截器完成统一 Header、签名、埋点与日志。

## 风险与优化建议
- **线程调度**：Retrofit 不负责线程切换，需在 `CallAdapter` 层处理（如 RxJava Scheduler 或协程 `Dispatcher`）。
- **错误处理**：建议统一封装响应模型（Result/ApiResponse），避免在业务层重复解析异常。
- **性能**：避免在 `Converter` 内进行大对象拷贝；对响应流采用流式解析（如 Moshi 的流 API）。

## 调试方法
- 开启 OkHttp `HttpLoggingInterceptor` 或自定义网络日志。
- 在 `CallAdapter` 层测量耗时，结合埋点分析慢接口。
- 配合 MockWebServer 做集成测试，验证注解配置与解析结果。
