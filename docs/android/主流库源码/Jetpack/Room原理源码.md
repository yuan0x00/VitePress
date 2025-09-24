# Room 原理与源码解读

## 核心概述
Room 是 Jetpack 提供的持久化组件，基于 SQLite 之上提供类型安全、编译期校验与响应式数据访问能力。通过注解生成 DAO 实现、编译期 SQL 校验以及与 LiveData/Flow 的整合，Room 降低了数据库开发复杂度并提升可维护性。

## 模块与架构
- **Annotation Processor**：解析 `@Database`、`@Entity`、`@Dao` 等注解，生成 SQLite 表结构、DAO 实现与元数据。
- **SQLiteOpenHelper**：`RoomDatabase` 内部封装 `SupportSQLiteOpenHelper` 管理数据库创建与升级。
- **InvalidationTracker**：监听表变更，触发 LiveData/Flow/Observable 的数据刷新。
- **TypeConverter**：自定义类型与 SQLite 支持类型之间转换。
- **Query Verification**：编译期对 SQL 语句进行语法与列校验，运行期提供参数绑定与异常包装。

## 初始化与数据库构建
1. `Room.databaseBuilder(context, AppDatabase.class, "app.db")` 构建 `RoomDatabase.Builder`。
2. 构建器配置迁移策略、线程池、日志等，最终调用 `build()`。
3. `build()` 会创建 `RoomDatabase` 子类（编译期生成的 `AppDatabase_Impl`），并初始化 `SupportSQLiteOpenHelper`。
4. 首次访问数据库时，`SupportSQLiteOpenHelper` 打开数据库并执行 `CREATE TABLE` 或迁移脚本。

```kotlin
// Kotlin 版本的 RoomDatabase_Impl 片段，展示数据库创建流程
override fun createOpenHelper(config: DatabaseConfiguration): SupportSQLiteOpenHelper {
    val callback = object : RoomOpenHelper(config, object : Delegate(1) { // schemaVersion
        override fun createAllTables(db: SupportSQLiteDatabase) {
            db.execSQL("CREATE TABLE IF NOT EXISTS `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` TEXT NOT NULL)")
        }
        override fun onValidateSchema(db: SupportSQLiteDatabase): ValidationResult {
            // 对比运行期表结构与预期 schema
            val existingTable = TableInfo.read(db, "users")
            return if (existingTable == expectedUsersTable) ValidationResult(true, null)
            else ValidationResult(false, "users 表结构不匹配")
        }
    }, "expected_hash", "legacy_hash")
    val sqliteOpenHelperFactory = config.sqliteOpenHelperFactory
    return sqliteOpenHelperFactory.create(SupportSQLiteOpenHelper.Configuration.builder(config.context)
        .name(config.name)
        .callback(callback)
        .build())
}
```

## DAO 调用链
1. 编译期生成的 `UserDao_Impl` 实现接口方法，将 SQL 定义转换为 `RoomSQLiteQuery`。
2. 查询方法会借助 `DBUtil.query` 打开游标，并通过 `CursorUtil` 将列映射到实体对象。
3. 对于 `LiveData` 返回类型，`RoomTrackingLiveData` 会在订阅时注册 `InvalidationTracker.Observer`，表数据变更后重新查询。
4. 对于 `Flow`，`CoroutinesRoom.createFlow` 利用冷流 + `InvalidationTracker` 实现数据库变更通知。

## 关键源码细节
- **编译期生成**：`RoomProcessor` 会构建 `DatabaseBundle`、`EntityBundle`，根据 `RoomTypeConverters` 处理自定义类型。
- **迁移体系**：`RoomOpenHelper.onUpgrade` 会根据版本号执行注册的 `Migration`，支持多跳迁移链路。
- **并发控制**：默认禁止主线程访问数据库；`allowMainThreadQueries()` 可放开但不推荐。写操作通过事务保证一致性。
- **查询优化**：`QueryInterceptorDatabase` 可选用于日志与性能分析，结合 `setQueryCallback` 获取 SQL 执行信息。

## 实践与扩展建议
- 为复杂查询编写 `@RewriteQueriesToDropUnusedColumns`，减少无用列传输。
- 使用 `@Embedded`、`@Relation` 管理一对多/一对一关系，避免手写 JOIN 映射。
- 结合 `PagingSource` 与 `Flow` 构建分页 + 响应式的数据流。
- 在多模块中共享数据库 schema 时，统一在 base 模块声明 `Entity` 与 DAO，避免重复定义。

## 风险与优化
- **迁移缺失**：升级版本忘记提供 `Migration` 会触发 `IllegalStateException` 或数据清空，应建立迁移 checklist。
- **大事务阻塞**：批量写入建议使用 `Batched` 事务或分批提交，避免长事务锁表。
- **类型转换性能**：`TypeConverter` 中避免重型对象序列化，可使用 ProtoBuf/JSON + 缓存。

## 调试方法
- 启用 `RoomDatabase.setQueryCallback` 输出 SQL 与耗时，定位慢查询。
- 使用 `adb shell` + `sqlite3` 检查实际表结构与索引。
- 借助 `Testing` 组件的 in-memory 模式进行单元测试，结合 `Robolectric` 或仪器测试验证迁移脚本。
