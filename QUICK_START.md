# 🚀 快速开始

## ✅ 已完成的工作

1. ✅ 安装了 `@cloudbase/js-sdk`
2. ✅ 配置了云环境 ID：`cloud1-6gnd02he13c1ff2e`
3. ✅ 创建了云服务配置文件
4. ✅ 创建了API服务封装
5. ✅ 创建了排行榜测试页面

## 📝 下一步操作

### 第一步：配置云控制台

访问 [微信云开发控制台](https://console.cloud.tencent.com/tcb)

#### 1. 开启匿名登录
```
环境 cloud1-6gnd02he13c1ff2e
  → 登录授权
  → 开启「匿名登录」
```

#### 2. 添加 Web 安全域名
```
环境 cloud1-6gnd02he13c1ff2e
  → 设置
  → 安全配置
  → Web 安全域名
  → 添加域名：http://localhost:5173
```

### 第二步：启动开发服务器

```bash
cd /Users/evergreen/Desktop/个人代码/微信开发/smartbeauty-web
npm run dev
```

### 第三步：访问测试页面

打开浏览器访问：
```
http://localhost:5173/ranking-test
```

### 第四步：测试功能

1. 点击「🔐 匿名登录」按钮
2. 登录成功后，会自动加载排行榜数据
3. 可以切换「总榜」和「月榜」
4. 点击「🔄 刷新数据」清除缓存并重新加载

## 📂 文件说明

### 核心配置文件

- [`src/services/cloudbase.js`](src/services/cloudbase.js) - CloudBase SDK 初始化和登录
- [`src/services/api.js`](src/services/api.js) - API 封装，包括排行榜等接口

### 测试页面

- [`src/pages/RankingTest.jsx`](src/pages/RankingTest.jsx) - 排行榜测试页面
- [`src/pages/RankingTest.css`](src/pages/RankingTest.css) - 霓虹风格样式

### 路由配置

- [`src/App.jsx`](src/App.jsx) - 已添加 `/ranking-test` 路由

## 🎨 排行榜样式

排行榜采用霓虹蓝紫粉风格，与小程序保持一致：

- 🥇 冠军：粉紫霓虹 (#ff00de)
- 🥈 亚军：赛博青蓝 (#00f2ff)
- 🥉 季军：深邃电紫 (#7d00ff)

柱状图高度自动按核销次数成比例计算（60-280px）。

## ⚠️ 常见问题

### 问题 1: 跨域错误

**错误信息**：`Access-Control-Allow-Origin`

**解决方案**：在云控制台添加 Web 安全域名（见「第一步」）

### 问题 2: 登录失败

**错误信息**：`permission denied` 或 `auth failed`

**解决方案**：
1. 检查云控制台是否已开启匿名登录
2. 检查 Web 安全域名是否正确配置
3. 刷新页面重试

### 问题 3: 数据加载失败

**错误信息**：`Failed to fetch` 或 `Network error`

**解决方案**：
1. 确保已成功登录（查看登录状态徽章）
2. 检查云函数是否正常运行
3. 查看浏览器控制台的详细错误信息

## 📞 调试技巧

### 浏览器控制台

打开浏览器控制台（F12）查看：
- Network 标签：查看网络请求
- Console 标签：查看日志和错误信息

### 测试页面调试信息

页面底部有「📊 调试信息」区域，显示原始数据结构。

## 🌐 API 使用示例

### 获取排行榜

```javascript
import { getRankList } from './services/api'

// 获取总榜前 10 名
const data = await getRankList('all', 10)
console.log(data.list)

// 获取月榜前 5 名
const monthData = await getRankList('month', 5)
console.log(monthData.list)
```

### 查询数据库

```javascript
import { db } from './services/cloudbase'

// 查询用户
const users = await db.collection('user').limit(20).get()
console.log(users.data)

// 查询课程
const meets = await db.collection('meet')
  .where({ MEET_STATUS: 1 })
  .limit(10)
  .get()
console.log(meets.data)
```

### 调用云函数

```javascript
import { callCloudRoute } from './services/api'

// 调用任意云路由
const result = await callCloudRoute('your/route', {
  param1: 'value1',
  param2: 'value2'
})
```

## 📖 更多文档

详细配置和高级用法请参考：
- [CLOUDBASE_SETUP.md](CLOUDBASE_SETUP.md) - 完整配置指南

## ✨ 下一步开发建议

1. **集成到现有页面**
   - 在 Home.jsx 或其他页面中引入排行榜组件
   - 复用 API 服务读取其他数据（课程、用户等）

2. **优化用户体验**
   - 添加骨架屏加载效果
   - 优化错误提示
   - 添加数据缓存

3. **生产环境准备**
   - 配置生产域名
   - 启用自定义登录
   - 设置数据库权限
   - 配置 CDN

---

🎉 **现在就可以开始测试了！** 按照上面的步骤操作即可。
