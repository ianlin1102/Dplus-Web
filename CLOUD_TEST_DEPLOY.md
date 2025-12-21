# ☁️ 云数据库访问测试 - 部署指南

## 📋 测试目的

测试**静态网站托管**是否能直接访问微信云数据库，无需配置 Web 安全域名。

## 🎯 测试页面功能

我创建了一个完整的云访问测试页面 (`/cloud-test`)，包含：

1. **匿名登录测试** - 获取云开发访问权限
2. **数据库访问测试** - 尝试读取 3 个集合：
   - `ax_join` - 签到记录
   - `ax_user` - 用户数据
   - `ax_meet` - 课程数据
3. **云函数调用测试** - 调用 `checkin/rank_list` 云函数
4. **详细日志输出** - 实时显示测试结果

## 🚀 部署步骤

### 方式一：本地测试（推荐先做）

```bash
# 1. 进入项目目录
cd smartbeauty-web

# 2. 启动开发服务器
npm run dev

# 3. 访问测试页面
# 打开浏览器访问: http://localhost:5176/cloud-test

# 4. 执行测试
# 点击 "1. 匿名登录" → "2. 测试数据库访问" → "3. 测试云函数调用"
```

### 方式二：部署到静态托管

#### 步骤 1: 构建生产版本

```bash
# 在 smartbeauty-web 目录下
npm run build
```

构建完成后，`dist/` 目录包含所有静态文件。

#### 步骤 2: 上传到云开发静态托管

**使用腾讯云控制台（简单）**：

1. 登录 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)

2. 选择环境：`cloud1-6gnd02he13c1ff2e`

3. 左侧菜单 → **静态网站托管**

4. 点击 **开通**（如果还没开通）

5. 文件管理 → **上传文件**
   - 选择 `dist/` 目录下的所有文件
   - ⚠️ 注意保持目录结构

6. 配置：
   - 索引文档：`index.html`
   - 错误文档：`index.html`（用于 SPA 路由）

**使用 CLI 工具（高效）**：

```bash
# 1. 安装 CloudBase CLI（如果还没安装）
npm install -g @cloudbase/cli

# 2. 登录
cloudbase login

# 3. 部署
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
```

#### 步骤 3: 访问测试页面

部署完成后，访问：

```
https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test
```

或者你的自定义域名。

## 🧪 测试操作步骤

### 1. 匿名登录

点击 **"1. 匿名登录"** 按钮。

**预期结果**：
```
✅ CloudBase SDK 初始化成功
✅ 匿名登录成功!
   用户 ID: xxxxxxxxxx
```

**如果失败**：
- 检查环境 ID 是否正确
- 检查网络连接

### 2. 测试数据库访问

点击 **"2. 测试数据库访问"** 按钮。

**可能的结果**：

#### 结果 A: 成功 ✅

```
✅ 读取成功! 找到 5 条签到记录
   1. 用户: 张三
   2. 用户: 李四
   ...
✅ 读取成功! 找到 3 个用户
✅ 读取成功! 找到 3 个课程
   1. 街舞基础班
   2. 爵士舞进阶班
   ...
```

**说明**：静态托管可以直接访问云数据库！🎉

**下一步**：
- 可以继续使用 CloudBase SDK 直接访问数据库
- 无需配置 Web 安全域名
- 无需使用 HTTP 触发器方案
- 按照 [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) 开发网页管理后台

#### 结果 B: 权限错误 ❌

```
❌ 数据库访问失败: DATABASE_PERMISSION_DENIED
💡 原因分析: 数据库权限不足
   解决方案: 需要在云控制台配置 Web 安全域名
```

**说明**：免费套餐不支持 Web 端直接访问数据库。

**下一步**：
- 方案 1: 升级到付费套餐，配置 Web 安全域名
- 方案 2: 使用 HTTP 触发器 + API Key（推荐，免费）
  - 参考 [SECURITY_SETUP_GUIDE.md](SECURITY_SETUP_GUIDE.md)

### 3. 测试云函数调用

点击 **"3. 测试云函数调用"** 按钮。

**预期结果**：
```
✅ 云函数调用成功!
   获取到 5 条排行数据
   1. 张三 - 25 次
   2. 李四 - 22 次
   ...
```

## 📊 测试结果解读

### 场景 1: 全部成功 ✅

如果所有测试都通过：
- ✅ 静态托管可以访问云数据库
- ✅ 静态托管可以调用云函数
- ✅ 无需额外配置

**推荐方案**：
- 直接使用 CloudBase SDK
- 代码示例已在测试页面中
- 可以开始开发管理后台

### 场景 2: 数据库失败，云函数成功 ⚠️

如果数据库访问失败，但云函数调用成功：
- ❌ 不能直接访问数据库
- ✅ 可以通过云函数访问数据

**推荐方案**：
- 所有数据操作通过云函数
- 你已经有 175 个云函数 API
- 无需修改后端代码

### 场景 3: 全部失败 ❌

如果所有测试都失败：
- 检查环境 ID 配置
- 检查是否成功匿名登录
- 检查云函数是否部署
- 检查网络连接

## 🔍 故障排查

### 问题 1: 匿名登录失败

**可能原因**：
- 环境 ID 错误
- 未开通云开发

**解决方案**：
```javascript
// 检查 src/pages/CloudTest.jsx 中的环境 ID
const ENV_ID = 'cloud1-6gnd02he13c1ff2e'  // 确认是否正确
```

### 问题 2: 数据库权限错误

**错误信息**：
```
DATABASE_PERMISSION_DENIED
```

**原因**：
- 免费套餐限制
- 未配置 Web 安全域名

**解决方案**：
- 使用云函数访问数据
- 或升级到付费套餐

### 问题 3: 跨域错误

**错误信息**：
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**原因**：
- 静态托管域名未添加到白名单

**解决方案**：
1. 云控制台 → 设置 → 安全配置
2. 添加你的静态托管域名到白名单

### 问题 4: 云函数调用失败

**可能原因**：
- 云函数未部署
- 云函数代码错误
- 路由配置错误

**检查步骤**：
1. 云控制台 → 云函数 → 查看 `cloud` 函数
2. 查看云函数日志
3. 确认路由 `checkin/rank_list` 存在

## 📝 测试报告模板

测试完成后，记录结果：

```
## 云数据库访问测试报告

**测试环境**：
- 环境 ID: cloud1-6gnd02he13c1ff2e
- 测试地址: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test
- 测试时间: 2025-12-21

**测试结果**：

1. 匿名登录: [ ] 成功 / [ ] 失败
   - 错误信息: _______________

2. 数据库访问: [ ] 成功 / [ ] 失败
   - ax_join: [ ] 成功 / [ ] 失败
   - ax_user: [ ] 成功 / [ ] 失败
   - ax_meet: [ ] 成功 / [ ] 失败
   - 错误信息: _______________

3. 云函数调用: [ ] 成功 / [ ] 失败
   - 错误信息: _______________

**结论**：
[ ] 可以直接使用 CloudBase SDK
[ ] 需要使用云函数方案
[ ] 需要升级到付费套餐

**下一步计划**：
_______________
```

## 🎯 根据测试结果的开发方案

### 如果测试成功 ✅

使用 CloudBase SDK 直接访问：

```javascript
// 初始化
const app = cloudbase.init({ env: 'cloud1-6gnd02he13c1ff2e' })

// 匿名登录
await app.auth().anonymousAuthProvider().signIn()

// 读取数据库
const db = app.database()
const result = await db.collection('ax_meet')
  .where({ _pid: 'A00', MEET_STATUS: 1 })
  .get()

// 调用云函数
const funcResult = await app.callFunction({
  name: 'cloud',
  data: { route: 'admin/meet_list', page: 1 }
})
```

**优点**：
- 代码简单直接
- 性能好（直连数据库）
- 实时数据推送支持

### 如果测试失败 ❌

使用 HTTP 触发器方案：

```javascript
// 使用 secureApi.js（已经写好）
import { callSecureCloudRoute } from './services/secureApi'

// 调用 API
const result = await callSecureCloudRoute('admin/meet_list', {
  page: 1,
  size: 10
})
```

**优点**：
- 免费方案
- API Key 安全控制
- 频率限制保护

## 📞 需要帮助？

如果测试过程中遇到问题：

1. 查看浏览器控制台的详细错误
2. 查看测试页面的日志输出
3. 截图发给我，我帮你分析
4. 查看云函数日志（云控制台）

## 🎉 测试完成后

根据测试结果，告诉我：

1. 是否成功匿名登录？
2. 是否成功读取数据库？
3. 是否成功调用云函数？
4. 遇到了什么错误？

我会根据测试结果，给你最适合的开发方案！

---

**快速链接**：
- [本地测试](http://localhost:5176/cloud-test)
- [在线测试](https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test)
- [静态托管部署指南](STATIC_HOSTING_DEPLOY.md)
- [实施指南](IMPLEMENTATION_GUIDE.md)
