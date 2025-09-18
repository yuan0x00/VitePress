## 一、面向对象基础

- 类与对象、封装、继承、多态
- 抽象类与接口（含默认方法、静态方法）
- 构造方法、this、super
- static 关键字（静态变量、静态方法、静态代码块）
- 内部类（成员内部类、静态内部类、匿名内部类、局部内部类）
- 匿名类在 Android 中的典型使用（如 OnClickListener、Runnable）

---

## 二、异常处理

- try-catch-finally 结构
- throw 与 throws 区别
- 自定义异常
- 异常分类：Checked Exception / RuntimeException
- Android 中崩溃捕获机制与 Java 异常关系

---

## 三、集合框架

- List：ArrayList / LinkedList / Vector
- Set：HashSet / LinkedHashSet / TreeSet
- Map：HashMap / LinkedHashMap / TreeMap / WeakHashMap
- Android 优化替代：SparseArray / SparseBooleanArray / ArrayMap
- 迭代器（Iterator / ListIterator）
- Fail-Fast 机制与并发修改异常
- Collections 工具类常用方法（sort / reverse / binarySearch）

---

## 四、泛型机制

- 泛型类、泛型方法、泛型接口
- 通配符：? / `<? extends T>` / `<? super T>`
- 泛型擦除原理
- 泛型与重载冲突问题
- 在 Android 中的实际应用（如 `Adapter<T>`、`LiveData<T>`、Retrofit 泛型回调）

---

## 五、多线程与并发

- Thread 类与 Runnable 接口
- 线程状态与生命周期（NEW / RUNNABLE / BLOCKED / WAITING / TIMED_WAITING / TERMINATED）
- synchronized 关键字（方法锁 / 对象锁 / 类锁）
- volatile 关键字（可见性 / 禁止重排序）
- wait() / notify() / notifyAll() 机制
- join() / sleep() / yield() 区别
- 线程池：ExecutorService / ThreadPoolExecutor / Executors 工厂方法
- Callable / Future / FutureTask
- Lock 接口与 ReentrantLock
- Condition 与 await/signal
- 原子类：AtomicInteger / AtomicBoolean / AtomicReference
- ThreadLocal 原理与内存泄漏风险（Android 中 Handler / Looper 场景）

---

## 六、IO 与序列化

- 字节流 / 字符流（InputStream / OutputStream / Reader / Writer）
- 缓冲流（BufferedInputStream / BufferedReader）
- 序列化：Serializable 接口与 serialVersionUID
- transient 关键字
- Parcelable 接口（Android 特有，替代 Serializable）
- 对比 Serializable 与 Parcelable 性能与使用场景

---

## 七、反射与注解

- Class 类获取方式（Class.forName / 对象.getClass / 类名.class）
- 反射获取构造器、方法、字段并调用/赋值
- 反射性能问题与 Android 限制（高版本限制私有 API 反射）
- 注解定义（@interface）与元注解（@Retention / @Target / @Documented）
- 运行时注解处理（配合反射，如 ButterKnife、Retrofit）
- 编译时注解处理（APT，如 Room、Dagger、ViewBinding）

---

## 八、内存管理与引用类型

- JVM / ART 内存模型简要（堆、栈、方法区）
- 对象生命周期与 GC 触发条件
- 强引用 / 软引用（SoftReference） / 弱引用（WeakReference） / 虚引用（PhantomReference）
- 引用队列（ReferenceQueue）与回收监听
- Android 中弱引用典型使用场景（防止 Handler、View、Context 泄漏）

---

## 九、常用工具类与语法糖

- Object 类常用方法：equals / hashCode / toString / clone
- String / StringBuilder / StringBuffer 区别
- 包装类与自动装箱/拆箱（Integer.valueOf / 缓存机制）
- 枚举类（enum）与在 Android 中使用（如状态管理）
- 位运算符（& | ^ ~ `<<` `>>` `>>>`）在 Flag 管理中的使用（如 View.setVisibility）
- Java 8+ 特性在 Android 中支持情况（Lambda / 方法引用 / Optional / Stream API）

---

## 十、设计模式（Java 层实现）

- 单例模式（饿汉 / 懒汉 / 双重检查锁 / 静态内部类 / 枚举）
- 工厂模式（简单工厂 / 工厂方法 / 抽象工厂）
- 建造者模式（AlertDialog.Builder / Retrofit.Builder）
- 观察者模式（自定义 Listener / Java Observable）
- 适配器模式（Adapter / RecyclerView.Adapter）
- 策略模式（替换 if-else 分支）
- 装饰器模式（InputStream 包装）
- 代理模式（静态代理 / 动态代理 — Retrofit 核心）

---

## 十一、Android 特有 Java 机制

- Context 体系与内存泄漏防范
- Handler / Looper / MessageQueue 机制（Java 层实现）
- AsyncTask 原理（已废弃，但需理解）
- Application 与 Activity 生命周期中的 Java 对象管理
- 静态变量与单例持有 Context 的风险
- 匿名内部类持有外部类引用导致的泄漏
