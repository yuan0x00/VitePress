# OkHttp 原理与源码解读

## 核心概述
OkHttp 是 Square 开源的高性能 HTTP 客户端，提供连接池、透明压缩、缓存与 WebSocket 支持。其设计重点在于通过拦截器链与连接复用实现稳定且高效的网络通信。

## 模块与架构
- **拦截器链**：`RealInterceptorChain` 串联用户、重试、桥接、缓存、连接、网络拦截器等节点。
- **连接管理**：`ConnectionPool` 维护持久连接，结合 HTTP/2 多路复用降低握手成本。
- **调度中心**：`Dispatcher` 管理同步/异步请求队列与线程池。
- **缓存体系**：支持内存 + 磁盘缓存，标准遵循 RFC 7234。
- **事件监听**：`EventListener` 提供关键阶段回调，便于埋点与调试。

## 请求执行流程
1. 构建 `OkHttpClient` 并调用 `newCall(request)` 返回 `RealCall`。
2. `RealCall.enqueue` 提交到 `Dispatcher` 线程池；`execute` 则阻塞当前线程。
3. `RealCall` 通过 `RealInterceptorChain.proceed` 触发拦截器依次执行。
4. `ConnectInterceptor` 负责从连接池获取或新建 `RealConnection`。
5. `CallServerInterceptor` 最终与服务器读写数据，得到 `Response`。

```java
// 拦截器链核心片段，展示链式调用流程
public Response proceed(Request request, StreamAllocation allocation, HttpCodec codec, RealConnection connection) throws IOException {
    if (index >= interceptors.size()) throw new AssertionError();
    RealInterceptorChain next = new RealInterceptorChain(interceptors, streamAllocation, httpCodec, connection, index + 1, request);
    Interceptor interceptor = interceptors.get(index);
    // 每个拦截器负责处理自身逻辑，并调用 next.proceed 进入下一个
    Response response = interceptor.intercept(next);
    return response;
}
```

## 关键源码细节
- **连接池**：默认最大闲置连接 5 条、保持 5 分钟，可通过 `ConnectionPool` 自定义；利用 `cleanupRunnable` 定时回收。
- **HTTP/2**：`RealConnection` 在握手后构建 `Http2Connection`，通过 Stream 分发请求，多路复用减轻阻塞。
- **超时控制**：`OkHttpClient` 对连接、读、写分别提供超时；`CallTimeoutInterceptor` 保障整体耗时边界。
- **缓存实现**：`Cache` 基于 `DiskLruCache`，遵循响应头策略；通过 `CacheStrategy` 决定命中、条件请求或回源。

## 常见扩展
- 自定义拦截器实现统一 Header、签名、限流或离线缓存策略。
- 通过 `EventListener.Factory` 采集 DNS、连接、请求、响应等阶段耗时。
- 配合 `MockWebServer` 进行集成测试，验证弱网重试与缓存控制。

## 风险与优化建议
- **资源释放**：确保 `ResponseBody` 在使用后关闭，否则连接无法回收。
- **线程安全**：拦截器需无状态或自行同步；避免在拦截器中执行耗时阻塞操作。
- **证书管理**：HTTPS 场景下关注证书锁定（Pinning）与自签证书信任链配置。

## 调试方法
- 启用 `HttpLoggingInterceptor` 或 `EventListener` 输出详细日志。
- 使用 `setProxy` + Charles/Fiddler 进行抓包分析。
- 结合 `StrictMode` 检测主线程网络调用，保障响应性。
