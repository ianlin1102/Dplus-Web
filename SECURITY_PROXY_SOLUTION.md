# 安全访问控制方案（免费套餐适用）

由于免费套餐限制较多，这里提供一个**云函数代理 + 访问控制**的解决方案。

## 🛡️ 可用的安全控制方式

### 方案一：云函数层面的访问控制（推荐）

在云函数中实现 IP 白名单、请求验证等安全机制。

#### 1. IP 白名单控制

修改云函数 `cloudfunctions/cloud/index.js`，添加 IP 验证：

```javascript
// 云函数入口
exports.main = async (event, context) => {
  // 获取请求者 IP
  const clientIP = event.headers['x-real-ip'] ||
                   event.headers['x-forwarded-for'] ||
                   event.requestContext.sourceIp

  // IP 白名单（开发环境）
  const IP_WHITELIST = [
    '127.0.0.1',          // 本地开发
    'YOUR_HOME_IP',       // 你的家庭 IP
    'YOUR_OFFICE_IP',     // 你的办公室 IP
  ]

  // 检查 IP 是否在白名单中
  if (!IP_WHITELIST.includes(clientIP)) {
    return {
      code: 403,
      msg: `访问被拒绝，IP: ${clientIP} 不在白名单中`,
      data: null
    }
  }

  // 继续处理业务逻辑
  const { route, ...params } = event
  // ... 你的业务代码
}
```

#### 2. API Key 验证（推荐）

使用简单的 API Key 验证：

```javascript
exports.main = async (event, context) => {
  // 从请求头中获取 API Key
  const apiKey = event.headers['x-api-key'] || event.apiKey

  // 验证 API Key
  const VALID_API_KEYS = [
    'your-secret-api-key-123456',  // Web 应用使用
    'another-key-for-testing'       // 测试用
  ]

  if (!VALID_API_KEYS.includes(apiKey)) {
    return {
      code: 401,
      msg: '无效的 API Key',
      data: null
    }
  }

  // 验证通过，继续处理
  const { route, ...params } = event
  // ... 业务逻辑
}
```

#### 3. 请求签名验证（最安全）

实现类似 AWS 的签名验证机制：

```javascript
const crypto = require('crypto')

// 验证请求签名
function verifySignature(event) {
  const SECRET_KEY = 'your-secret-key-here'

  // 从请求中获取签名和时间戳
  const { signature, timestamp, ...data } = event

  // 防重放攻击：检查时间戳（5分钟内有效）
  const now = Date.now()
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return false
  }

  // 计算签名
  const sortedData = Object.keys(data).sort().reduce((obj, key) => {
    obj[key] = data[key]
    return obj
  }, {})

  const signStr = JSON.stringify(sortedData) + timestamp + SECRET_KEY
  const expectedSignature = crypto.createHash('sha256').update(signStr).digest('hex')

  return signature === expectedSignature
}

exports.main = async (event, context) => {
  if (!verifySignature(event)) {
    return {
      code: 403,
      msg: '签名验证失败',
      data: null
    }
  }

  // 验证通过...
}
```

#### 4. 请求频率限制

防止滥用，限制请求频率：

```javascript
// 使用云数据库存储访问记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function checkRateLimit(clientIP) {
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000

  // 查询过去一分钟的请求次数
  const { total } = await db.collection('api_access_log')
    .where({
      ip: clientIP,
      timestamp: db.command.gte(oneMinuteAgo)
    })
    .count()

  // 限制：每分钟最多 60 次请求
  if (total >= 60) {
    return false
  }

  // 记录本次访问
  await db.collection('api_access_log').add({
    data: {
      ip: clientIP,
      timestamp: now
    }
  })

  return true
}

exports.main = async (event, context) => {
  const clientIP = event.requestContext.sourceIp

  if (!await checkRateLimit(clientIP)) {
    return {
      code: 429,
      msg: '请求过于频繁，请稍后再试',
      data: null
    }
  }

  // 继续处理...
}
```

### 方案二：前端层面的访问控制

在 Web 应用中添加 API Key：

#### 修改 `src/services/httpApi.js`

```javascript
// API Key（存储在环境变量中更安全）
const API_KEY = import.meta.env.VITE_API_KEY || 'your-default-api-key'

export const callCloudRouteHTTP = async (route, params = {}) => {
  try {
    const response = await fetch(CLOUD_FUNCTION_HTTP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,  // 添加 API Key 到请求头
      },
      body: JSON.stringify({
        route,
        ...params,
        // 添加时间戳（防重放）
        timestamp: Date.now()
      })
    })

    // ... 处理响应
  } catch (error) {
    console.error(`HTTP 路由 ${route} 调用失败:`, error)
    throw error
  }
}
```

#### 创建环境变量文件 `.env`

```env
# Web 应用环境变量
VITE_API_KEY=your-secret-api-key-123456
VITE_CLOUD_FUNCTION_URL=https://xxx.service.tcloudbase.com/cloud
```

⚠️ **重要**：将 `.env` 添加到 `.gitignore`，不要提交到代码仓库！

### 方案三：组合使用（最佳实践）

结合多种安全措施：

```javascript
// 云函数完整安全控制示例
exports.main = async (event, context) => {
  try {
    // 1. API Key 验证
    const apiKey = event.headers['x-api-key']
    if (!isValidApiKey(apiKey)) {
      return errorResponse(401, '无效的 API Key')
    }

    // 2. IP 白名单检查（可选，开发环境使用）
    const clientIP = getClientIP(event)
    if (process.env.ENABLE_IP_WHITELIST === 'true') {
      if (!isIPWhitelisted(clientIP)) {
        return errorResponse(403, `IP ${clientIP} 未授权`)
      }
    }

    // 3. 频率限制
    if (!await checkRateLimit(clientIP)) {
      return errorResponse(429, '请求过于频繁')
    }

    // 4. 请求签名验证（可选，高安全场景）
    if (event.signature && !verifySignature(event)) {
      return errorResponse(403, '签名验证失败')
    }

    // 5. 记录访问日志
    await logAccess({
      ip: clientIP,
      apiKey: apiKey,
      route: event.route,
      timestamp: Date.now()
    })

    // 6. 执行业务逻辑
    const result = await handleRequest(event)

    return successResponse(result)

  } catch (error) {
    console.error('云函数执行错误:', error)
    return errorResponse(500, '服务器内部错误')
  }
}

// 辅助函数
function getClientIP(event) {
  return event.headers['x-real-ip'] ||
         event.headers['x-forwarded-for']?.split(',')[0] ||
         event.requestContext.sourceIp
}

function isValidApiKey(apiKey) {
  const validKeys = process.env.VALID_API_KEYS?.split(',') || []
  return validKeys.includes(apiKey)
}

function errorResponse(code, msg) {
  return {
    statusCode: code === 401 || code === 403 ? code : 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ code, msg, data: null })
  }
}

function successResponse(data) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ code: 0, msg: 'success', data })
  }
}
```

## 🔧 配置步骤

### 1. 在云函数中配置环境变量

云控制台 → 云函数 → cloud → 环境变量：

```
VALID_API_KEYS=key1,key2,key3
ENABLE_IP_WHITELIST=false
SECRET_KEY=your-secret-signing-key
```

### 2. 在 Web 应用中配置

创建 `.env` 文件：

```env
VITE_API_KEY=key1
VITE_CLOUD_FUNCTION_URL=https://xxx.service.tcloudbase.com/cloud
```

### 3. 创建访问日志数据库集合

在云控制台创建集合 `api_access_log`，字段：

```javascript
{
  ip: String,
  apiKey: String,
  route: String,
  timestamp: Number,
  userAgent: String
}
```

## 📊 安全方案对比

| 方案 | 安全性 | 实现难度 | 免费套餐 | 推荐场景 |
|------|--------|----------|----------|----------|
| IP 白名单 | ⭐⭐⭐ | 简单 | ✅ | 固定 IP 的开发环境 |
| API Key | ⭐⭐⭐⭐ | 简单 | ✅ | 一般 Web 应用 |
| 请求签名 | ⭐⭐⭐⭐⭐ | 中等 | ✅ | 高安全要求场景 |
| 频率限制 | ⭐⭐⭐ | 中等 | ✅ | 防滥用 |
| 组合方案 | ⭐⭐⭐⭐⭐ | 复杂 | ✅ | 生产环境 |

## 🎯 推荐配置（免费套餐）

**开发/测试环境：**
- ✅ API Key 验证
- ✅ 基础频率限制（每分钟 60 次）
- ❌ IP 白名单（动态 IP 不方便）

**生产环境（免费套餐）：**
- ✅ API Key 验证
- ✅ 请求签名验证
- ✅ 严格的频率限制（每分钟 30 次）
- ✅ 访问日志记录

## 📝 完整示例代码

查看以下文件获取完整实现：
- `cloudfunctions/cloud/security.js` - 安全验证模块
- `src/services/secureApi.js` - 前端安全请求封装

---

💡 **提示**：
- 免费套餐下，云函数是最灵活的安全控制点
- API Key 应该存储在环境变量中，不要硬编码
- 定期轮换 API Key 提高安全性
- 监控访问日志，及时发现异常访问
