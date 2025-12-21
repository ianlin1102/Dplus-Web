# 🛡️ 安全访问控制完整配置指南

本指南将帮你配置一个**安全的、免费的** Web 访问云数据方案。

## 📋 方案概述

由于免费套餐不支持 Web 安全域名，我们使用：
- ✅ **云函数 HTTP 触发器**（数据入口）
- ✅ **API Key 验证**（身份认证）
- ✅ **IP 频率限制**（防滥用）
- ✅ **访问日志记录**（审计追踪）

## 🚀 快速开始（5 步完成）

### 第一步：创建数据库集合

在云控制台创建访问日志集合：

1. 环境：`cloud1-6gnd02he13c1ff2e`
2. 数据库 → 集合管理 → 添加集合
3. 集合名称：`api_access_log`
4. 权限：仅创建者可读写

### 第二步：配置云函数安全模块

1. 将 `cloudfunctions/cloud/security.js` 上传到云函数目录

2. 在云控制台配置云函数环境变量：

   **云函数 → cloud → 配置 → 环境变量**

   ```
   VALID_API_KEYS=test-key-123,production-key-456
   ENABLE_IP_WHITELIST=false
   RATE_LIMIT=60
   ```

   说明：
   - `VALID_API_KEYS`: 有效的 API Keys（逗号分隔）
   - `ENABLE_IP_WHITELIST`: 是否启用 IP 白名单（一般设为 false）
   - `RATE_LIMIT`: 每分钟最大请求数

3. 修改 `cloudfunctions/cloud/index.js`，集成安全验证：

   ```javascript
   const cloud = require('wx-server-sdk')
   const security = require('./security')

   cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

   exports.main = async (event, context) => {
     // 安全验证
     const securityResult = await security.securityCheck(event)

     if (!securityResult.passed) {
       return security.errorResponse(securityResult.code, securityResult.msg)
     }

     // 验证通过，继续处理业务逻辑
     const { route, ...params } = event

     try {
       // 你的原有路由处理逻辑
       let result
       if (route.startsWith('checkin/')) {
         const CheckinController = require('./project/controller/checkin_controller.js')
         const ctrl = new CheckinController()
         result = await ctrl.route(route, params)
       }
       // ... 其他路由

       return {
         code: 0,
         msg: 'success',
         data: result
       }

     } catch (error) {
       console.error('业务处理错误:', error)
       return security.errorResponse(500, '服务器内部错误')
     }
   }
   ```

4. 部署云函数：
   ```bash
   # 在云函数目录
   npm install
   # 然后在微信开发者工具中右键 cloud 函数 → 上传并部署：云端安装依赖
   ```

### 第三步：开启 HTTP 触发器

1. 云控制台 → 云函数 → cloud → 触发方式
2. 创建触发器：
   - 触发方式：HTTP 触发器
   - 路径：`/cloud`
   - 认证：免鉴权
3. 复制生成的 HTTP 访问地址，例如：
   ```
   https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud
   ```

### 第四步：配置 Web 应用

1. 复制环境变量模板：
   ```bash
   cd smartbeauty-web
   cp .env.example .env
   ```

2. 编辑 `.env` 文件：
   ```env
   # 使用云函数环境变量中配置的 API Key
   VITE_API_KEY=test-key-123

   # 使用第三步获得的 HTTP 访问地址
   VITE_CLOUD_FUNCTION_URL=https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud
   ```

3. 添加 `.env` 到 `.gitignore`（如果还没有）：
   ```bash
   echo ".env" >> .gitignore
   ```

### 第五步：测试验证

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问测试页面：
   ```
   http://localhost:5176/ranking-test
   ```

3. 打开浏览器控制台，检查：
   - Network 标签：查看请求是否携带 `X-API-Key` 头
   - Console 标签：查看是否有错误

4. 测试 API Key 验证：
   - 正确的 Key：应该成功加载数据
   - 错误的 Key：应该返回 401 错误
   - 无 Key：应该返回 401 错误

## 🔧 高级配置

### 启用 IP 白名单（可选）

如果你有固定 IP，可以启用 IP 白名单增强安全：

1. 修改云函数环境变量：
   ```
   ENABLE_IP_WHITELIST=true
   IP_WHITELIST=123.456.789.0,123.456.789.1
   ```

2. 重新部署云函数

⚠️ **注意**：动态 IP 不适合使用白名单

### 调整频率限制

根据实际需求调整：

```
RATE_LIMIT=30   # 每分钟最多 30 次请求（更严格）
RATE_LIMIT=120  # 每分钟最多 120 次请求（更宽松）
```

### 生产环境 API Key 管理

1. **生成强 API Key**：
   ```javascript
   // Node.js 生成随机 Key
   const crypto = require('crypto')
   const apiKey = crypto.randomBytes(32).toString('hex')
   console.log(apiKey)
   // 例如：7f3d8e9c2a1b4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0a1b2c3d4e5f6a7b8c9d
   ```

2. **分环境管理**：
   - 开发环境：`dev-key-xxx`
   - 测试环境：`test-key-xxx`
   - 生产环境：`prod-key-xxx`

3. **定期轮换**：建议每 3-6 个月更换一次

### 查看访问日志

在云控制台 → 数据库 → api_access_log：

```javascript
// 查询最近的访问记录
{
  timestamp: { $gte: Date.now() - 3600000 }  // 最近 1 小时
}

// 查询某个 IP 的访问
{
  ip: "123.456.789.0"
}

// 查询频繁访问的 IP
// 使用聚合查询统计
```

## 📊 监控与维护

### 日常检查

1. **访问日志审计**（每周）：
   - 检查是否有异常 IP
   - 检查是否有频繁失败的请求
   - 分析访问模式

2. **清理旧日志**（每月）：
   ```javascript
   // 在云控制台数据库手动删除或写定时触发器
   // 删除 30 天前的日志
   db.collection('api_access_log')
     .where({
       timestamp: db.command.lt(Date.now() - 30 * 24 * 3600000)
     })
     .remove()
   ```

### 应急处理

**如果发现异常访问**：

1. 立即更换 API Key：
   - 生成新的 Key
   - 更新云函数环境变量
   - 更新 Web 应用 `.env` 文件

2. 临时启用 IP 白名单：
   ```
   ENABLE_IP_WHITELIST=true
   IP_WHITELIST=your-safe-ip
   ```

3. 降低频率限制：
   ```
   RATE_LIMIT=10
   ```

## 🔍 故障排查

### 问题 1: 401 API Key 无效

**检查清单**：
- [ ] `.env` 文件是否正确配置
- [ ] API Key 是否与云函数环境变量一致
- [ ] 是否重启了开发服务器（修改 .env 后需要重启）
- [ ] 浏览器是否缓存了旧的请求

### 问题 2: 429 请求过于频繁

**原因**：触发了频率限制

**解决**：
1. 检查代码是否有死循环请求
2. 适当增加 `RATE_LIMIT` 值
3. 清理数据库中的访问日志

### 问题 3: CORS 错误

**解决**：在云函数响应中添加 CORS 头：

```javascript
// security.js 的 errorResponse 函数中
function errorResponse(code, msg) {
  return {
    statusCode: code === 401 || code === 403 ? code : 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
    },
    body: JSON.stringify({ code, msg, data: null })
  }
}
```

## 📝 总结

配置完成后，你将拥有：

✅ **免费** - 完全基于免费套餐
✅ **安全** - API Key + 频率限制 + 日志审计
✅ **灵活** - 可随时调整安全策略
✅ **可控** - 完整的访问日志记录

## 🎯 下一步

1. ✅ 完成上述 5 步配置
2. ✅ 测试 API 访问是否正常
3. ✅ 集成到你的实际页面中
4. ✅ 监控访问日志
5. ✅ 根据实际情况调整安全策略

---

💡 **需要帮助？**
- 查看浏览器控制台错误信息
- 查看云函数日志（云控制台 → 云函数 → 日志）
- 参考 `SECURITY_PROXY_SOLUTION.md` 获取更多安全方案
