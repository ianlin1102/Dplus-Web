# 云函数 HTTP 访问配置指南（免费套餐）

由于免费套餐不支持 Web 安全域名配置，我们使用 **HTTP 触发器** 的方式访问云函数。

## ⚠️ 遇到的问题

错误代码：`OperationDenied.FreePackageDenied`
原因：免费套餐不支持添加 Web 安全域名

## ✅ 解决方案：使用 HTTP 触发器

### 第一步：开启云函数 HTTP 访问

1. 登录 [微信云开发控制台](https://console.cloud.tencent.com/tcb)

2. 选择环境：`cloud1-6gnd02he13c1ff2e`

3. 进入「云函数」

4. 找到 `cloud` 函数

5. 点击函数名称，进入详情页

6. 点击「触发方式」标签

7. 点击「创建触发器」
   - 触发方式：HTTP 触发器
   - 路径：`/cloud`（或自定义）
   - 认证方式：免鉴权（测试用，生产环境建议用鉴权）

8. 创建后会得到一个 HTTP 访问地址，类似：
   ```
   https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud
   ```

### 第二步：配置 HTTP 访问地址

将得到的地址填入配置文件：

**编辑文件：** `src/services/httpApi.js`

```javascript
// 将这一行
const CLOUD_FUNCTION_HTTP_URL = 'YOUR_CLOUD_FUNCTION_HTTP_URL'

// 改为你的实际地址
const CLOUD_FUNCTION_HTTP_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud'
```

### 第三步：更新测试页面使用 HTTP API

**编辑文件：** `src/pages/RankingTest.jsx`

修改导入：
```javascript
// 原来的导入
import { getRankList, clearRankCache } from '../services/api'

// 改为 HTTP 版本
import { getRankListHTTP as getRankList, clearRankCacheHTTP as clearRankCache } from '../services/httpApi'
```

或者直接替换 `api.js` 的实现为 HTTP 方式。

### 第四步：移除登录相关代码（HTTP 方式不需要登录）

在 `RankingTest.jsx` 中：

1. 移除登录状态检查
2. 移除匿名登录按钮
3. 直接加载数据

简化后的代码：
```javascript
useEffect(() => {
  loadRankData('all')
}, [])
```

## 🔒 安全性说明

### 开发/测试阶段
- 使用「免鉴权」HTTP 触发器
- 任何人都可以访问（请勿在生产环境使用）

### 生产环境建议
1. **升级到付费版**，配置 Web 安全域名
2. 或使用 HTTP 触发器的**鉴权方式**
3. 在云函数中添加访问控制逻辑

## 📊 两种方案对比

| 特性 | CloudBase SDK | HTTP 触发器 |
|------|--------------|-------------|
| 免费套餐 | ❌ 需要配置安全域名（付费功能） | ✅ 支持 |
| 登录鉴权 | ✅ 支持匿名/自定义登录 | ⚠️ 需自行实现或使用付费鉴权 |
| 数据库操作 | ✅ 直接操作 | ❌ 只能通过云函数 |
| 难度 | 简单 | 简单 |
| 安全性 | 高（需配置） | 低（免鉴权）/高（付费鉴权） |

## 🚀 推荐方案

### 方案一：HTTP 触发器（免费，推荐测试用）
```javascript
// httpApi.js
const CLOUD_FUNCTION_HTTP_URL = 'https://xxx.service.tcloudbase.com/cloud'

export const getRankList = async (type = 'all', limit = 10) => {
  const response = await fetch(CLOUD_FUNCTION_HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route: 'checkin/rank_list', type, limit })
  })
  return await response.json()
}
```

### 方案二：升级付费套餐（生产环境推荐）
- 开启 Web 安全域名
- 使用 CloudBase SDK
- 更完善的权限控制

## 📝 完整步骤总结

1. ✅ 在云控制台为 `cloud` 函数创建 HTTP 触发器
2. ✅ 复制得到的 HTTP 访问地址
3. ✅ 修改 `src/services/httpApi.js`，填入地址
4. ✅ 修改 `RankingTest.jsx`，使用 HTTP API
5. ✅ 移除登录相关代码
6. ✅ 测试访问

## 🔧 故障排查

### 问题 1: 404 Not Found
**原因**：HTTP 访问地址错误
**解决**：检查云函数触发器配置，确保地址正确

### 问题 2: CORS 错误
**原因**：跨域请求被阻止
**解决**：
1. 在云函数中添加 CORS 头
2. 或在云控制台的 HTTP 触发器配置中开启 CORS

在云函数 `cloud/index.js` 中添加：
```javascript
exports.main = async (event, context) => {
  // 添加 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // 你的业务逻辑...
  const result = await handleRequest(event)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  }
}
```

### 问题 3: 数据返回格式错误
**原因**：HTTP 触发器返回格式需要特殊处理
**解决**：确保云函数返回正确的 HTTP 响应格式

---

💡 **提示**：HTTP 触发器方式虽然免费，但安全性较低。建议：
- 测试阶段使用 HTTP 触发器
- 生产环境升级付费套餐，使用 CloudBase SDK + Web 安全域名
