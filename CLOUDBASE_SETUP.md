# 微信云开发 Web 端接入指南

本文档说明如何在 Web 应用中通过 CloudBase SDK 访问微信小程序的云数据库。

## 📋 前置条件

1. ✅ 已安装 `@cloudbase/js-sdk`
2. ✅ 有微信云环境 ID：`cloud1-6gnd02he13c1ff2e`

## 🔧 配置步骤

### 1. 云环境配置

云环境 ID 已在 `/src/services/cloudbase.js` 中配置：

```javascript
const ENV_ID = 'cloud1-6gnd02he13c1ff2e'
```

### 2. 安全域名配置（重要！）

⚠️ **在微信云控制台添加安全域名，否则 Web 端无法访问云服务：**

1. 登录 [微信云开发控制台](https://console.cloud.tencent.com/tcb)
2. 选择环境：`cloud1-6gnd02he13c1ff2e`
3. 进入「设置」→「安全配置」→「Web 安全域名」
4. 添加你的域名：
   - 开发环境：`http://localhost:5173`
   - 生产环境：`https://yourdomain.com`

### 3. 登录授权配置

Web 端访问云数据库需要先进行身份验证。有以下几种方式：

#### 方式一：匿名登录（推荐用于测试）

```javascript
import { app } from './services/cloudbase'

// 启用匿名登录
await app.auth().anonymousAuthProvider().signIn()
```

⚠️ 需要在云控制台开启匿名登录：
1. 控制台 → 环境 → 登录授权
2. 开启「匿名登录」

#### 方式二：自定义登录

使用自定义登录票据（需要后端配合）：

```javascript
const ticket = 'your-custom-login-ticket'
await app.auth().customAuthProvider().signIn(ticket)
```

## 📁 项目结构

```
smartbeauty-web/
├── src/
│   ├── services/
│   │   ├── cloudbase.js    # CloudBase 初始化配置
│   │   └── api.js          # API 封装（云函数/数据库）
│   └── pages/
│       ├── RankingTest.jsx # 排行榜测试页面
│       └── RankingTest.css # 样式
```

## 🚀 使用示例

### 1. 调用云函数

```javascript
import { callCloudFunction } from './services/api'

const result = await callCloudFunction('cloud', {
  route: 'checkin/rank_list',
  type: 'all',
  limit: 10
})
```

### 2. 查询数据库

```javascript
import { db } from './services/cloudbase'

const result = await db.collection('user')
  .limit(20)
  .get()

console.log(result.data)
```

### 3. 使用封装的 API

```javascript
import { getRankList } from './services/api'

// 获取排行榜
const rankData = await getRankList('all', 10)
console.log(rankData.list)
```

## 🧪 测试页面

访问测试页面查看云数据读取效果：

```
http://localhost:5173/ranking-test
```

该页面展示：
- ✅ 从云数据库读取排行榜数据
- ✅ 总榜/月榜切换
- ✅ 霓虹蓝紫粉风格 UI
- ✅ 高度按核销次数成比例显示
- ✅ 刷新缓存功能
- ✅ 调试信息显示

## 📊 数据库集合说明

### `user` 集合
用户信息表

### `meet` 集合
课程/活动信息表

字段：
- `MEET_STATUS`: 1=正常，其他=禁用
- `MEET_ORDER`: 排序
- `MEET_TITLE`: 标题

### `meet_join` 集合
用户报名/核销记录表

字段：
- `JOIN_IS_CHECKIN`: 1=已核销
- `JOIN_STATUS`: 状态
- `JOIN_USER_ID`: 用户 ID

## 🔒 权限说明

### 当前权限模式
小程序云函数默认权限：仅创建者可读写

### Web 端访问建议

1. **开发/测试阶段**：
   - 使用匿名登录
   - 设置数据库权限为「所有用户可读，仅创建者可写」

2. **生产环境**：
   - 使用自定义登录
   - 设置严格的数据库权限规则
   - 通过云函数访问数据（推荐）

## ⚠️ 常见问题

### 1. 跨域错误

**问题**：`Access-Control-Allow-Origin` 错误

**解决**：在云控制台添加 Web 安全域名（见「配置步骤」第2步）

### 2. 权限不足

**问题**：`permission denied`

**解决**：
- 检查是否已登录（匿名或自定义）
- 检查数据库权限设置
- 优先使用云函数访问数据

### 3. 环境 ID 错误

**问题**：`env not exists`

**解决**：检查 `cloudbase.js` 中的 `ENV_ID` 是否正确

## 📚 API 文档

### `callCloudRoute(route, params)`

调用云路由（推荐）

```javascript
const data = await callCloudRoute('checkin/rank_list', {
  type: 'all',
  limit: 10
})
```

### `getRankList(type, limit)`

获取排行榜

```javascript
const data = await getRankList('month', 5)
```

### `clearRankCache()`

清除排行榜缓存

```javascript
await clearRankCache()
```

## 🔄 开发流程

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **配置云环境**
   - 添加安全域名
   - 开启匿名登录

3. **访问测试页面**
   ```
   http://localhost:5173/ranking-test
   ```

4. **查看数据**
   - 检查排行榜是否正确显示
   - 查看浏览器控制台调试信息

## 🌐 部署注意事项

部署到生产环境时：

1. ✅ 添加生产域名到安全域名列表
2. ✅ 配置 HTTPS（微信云要求）
3. ✅ 设置合理的数据库权限
4. ✅ 启用自定义登录替代匿名登录
5. ✅ 配置 CDN 加速静态资源

## 🎨 UI 风格

排行榜采用霓虹蓝紫粉风格，与小程序端保持一致：

- 🥇 第一名：粉紫霓虹 `#ff00de`
- 🥈 第二名：赛博青蓝 `#00f2ff`
- 🥉 第三名：深邃电紫 `#7d00ff`

## 📞 技术支持

遇到问题？检查：
1. 浏览器控制台错误信息
2. 云函数日志（云控制台）
3. 数据库权限设置
4. 安全域名配置

---

✨ **提示**：优先使用云函数访问数据，而不是直接操作数据库，这样更安全且易于维护！
