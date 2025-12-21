# 🌐 静态网站托管部署指南

使用腾讯云开发的静态网站托管功能部署你的 React 应用。

## 📋 方案架构

```
┌─────────────────────────────────────────────────┐
│  用户访问                                        │
│  https://your-app.tcloudbaseapp.com             │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  静态网站托管（CDN）                             │
│  - React 编译后的静态文件                        │
│  - HTML, CSS, JS                                │
└──────────────────┬──────────────────────────────┘
                   ↓ API 调用
┌─────────────────────────────────────────────────┐
│  云函数 HTTP 触发器                              │
│  - API Key 验证                                 │
│  - 频率限制                                      │
│  - 业务逻辑                                      │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│  云数据库                                        │
│  - 排行榜数据                                    │
│  - 用户数据                                      │
└─────────────────────────────────────────────────┘
```

## 🚀 部署步骤

### 第一步：配置生产环境变量

创建 `.env.production` 文件：

```env
# 生产环境 API Key（使用强密码）
VITE_API_KEY=prod-your-strong-api-key-here

# 云函数 HTTP 访问地址
VITE_CLOUD_FUNCTION_URL=https://cloud1-6gnd02he13c1ff2e-1380655578.service.tcloudbase.com/cloud
```

### 第二步：构建生产版本

```bash
# 在 smartbeauty-web 目录下执行
npm run build
```

构建完成后会在 `dist/` 目录生成静态文件：
```
dist/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── ...
```

### 第三步：开启静态网站托管

1. 登录 [微信云开发控制台](https://console.cloud.tencent.com/tcb)

2. 选择环境：`cloud1-6gnd02he13c1ff2e`

3. 左侧菜单 → **静态网站托管**

4. 点击 **开通**（如果还没开通）

5. 等待开通完成（通常几秒钟）

### 第四步：上传静态文件

**方式一：通过控制台上传（推荐新手）**

1. 静态网站托管 → 文件管理

2. 点击 **上传文件**

3. 选择 `dist/` 目录下的所有文件上传
   - ⚠️ 注意：保持目录结构，`index.html` 要在根目录

4. 上传完成后点击 **设置** → **基础配置**
   - 索引文档：`index.html`
   - 错误文档：`index.html`（用于 SPA 路由）

**方式二：使用 CLI 工具上传（推荐）**

1. 安装腾讯云开发 CLI：
   ```bash
   npm install -g @cloudbase/cli
   ```

2. 登录：
   ```bash
   cloudbase login
   ```

3. 部署：
   ```bash
   cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
   ```

### 第五步：配置 SPA 路由支持

由于是 React SPA 应用，需要配置路由重定向：

1. 控制台 → 静态网站托管 → 设置 → 基础配置

2. 配置：
   - **索引文档**：`index.html`
   - **错误文档**：`index.html`

这样所有 404 请求都会返回 `index.html`，React Router 可以正常工作。

### 第六步：访问你的网站

部署完成后，你会得到一个默认域名：

```
https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com
```

或者类似：
```
https://cloud1-6gnd02he13c1ff2e.web.app
```

访问这个域名即可看到你的应用！

## 🔧 高级配置

### 自定义域名

1. 静态网站托管 → 设置 → 域名管理

2. 添加自定义域名：
   - 域名：`www.yourdomain.com`
   - 需要在域名服务商添加 CNAME 记录

3. 配置 SSL 证书（自动申请或上传）

### 缓存配置

为了加速访问，配置 CDN 缓存：

```
静态网站托管 → 设置 → 缓存配置
```

推荐配置：
- HTML 文件：不缓存或缓存 5 分钟
- JS/CSS 文件：缓存 30 天（文件名带 hash）
- 图片/字体：缓存 30 天

### 环境变量管理

**开发环境** `.env.development`:
```env
VITE_API_KEY=dev-test-key-123
VITE_CLOUD_FUNCTION_URL=https://xxx.service.tcloudbase.com/cloud
```

**生产环境** `.env.production`:
```env
VITE_API_KEY=prod-strong-key-abc123xyz
VITE_CLOUD_FUNCTION_URL=https://xxx.service.tcloudbase.com/cloud
```

构建时自动使用对应环境的配置：
```bash
npm run dev        # 使用 .env.development
npm run build      # 使用 .env.production
```

## 📦 自动化部署（可选）

创建部署脚本 `scripts/deploy.sh`:

```bash
#!/bin/bash

# 构建生产版本
echo "📦 构建生产版本..."
npm run build

# 部署到静态托管
echo "🚀 部署到云开发..."
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e

echo "✅ 部署完成！"
echo "访问地址: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com"
```

添加到 `package.json`:
```json
{
  "scripts": {
    "deploy": "sh scripts/deploy.sh"
  }
}
```

使用：
```bash
npm run deploy
```

## 🔍 部署后测试

### 1. 检查静态资源加载

打开浏览器控制台 → Network 标签：
- ✅ HTML/CSS/JS 是否正常加载
- ✅ 状态码是否为 200
- ✅ 是否来自 CDN（查看响应头）

### 2. 检查 API 调用

控制台 → Network → XHR：
- ✅ 云函数请求是否成功
- ✅ 是否携带 API Key
- ✅ 数据是否正确返回

### 3. 检查路由

访问不同路由：
- `https://your-app.com/`
- `https://your-app.com/ranking-test`
- `https://your-app.com/about`

确保都能正常访问（不报 404）。

## 💰 免费额度

静态网站托管免费额度：
- ✅ 容量：5 GB
- ✅ 流量：5 GB/月
- ✅ CDN 加速：免费
- ✅ HTTPS：免费

**适用场景**：
- 个人博客、作品展示
- 小型 Web 应用
- 企业官网
- Landing Page

超出免费额度后按量计费，价格参考：
- 容量：0.043 元/GB/天
- 流量：0.18 元/GB

## 📊 性能优化

### 1. 代码分割

在 `vite.config.js` 中配置：

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react']
        }
      }
    }
  }
})
```

### 2. 压缩图片

使用图片压缩工具：
- TinyPNG
- ImageOptim
- Vite 插件：`vite-plugin-imagemin`

### 3. 启用 Gzip

云开发 CDN 自动支持 Gzip 压缩，无需配置。

## 🛠️ 常见问题

### 问题 1: 刷新页面出现 404

**原因**：SPA 路由配置问题

**解决**：设置错误文档为 `index.html`（见第五步）

### 问题 2: API 调用失败

**检查清单**：
- [ ] `.env.production` 是否正确配置
- [ ] 是否重新构建（`npm run build`）
- [ ] 云函数 HTTP 触发器是否开启
- [ ] API Key 是否匹配

### 问题 3: 静态资源 404

**原因**：路径问题

**解决**：在 `vite.config.js` 中配置 base：

```javascript
export default defineConfig({
  base: '/', // 或者你的子路径
  // ...
})
```

### 问题 4: 文件上传失败

**可能原因**：
- 文件太大（单文件限制 50MB）
- 网络问题

**解决**：
- 分批上传
- 使用 CLI 工具
- 检查网络连接

## 📝 部署检查清单

部署前检查：

- [ ] 配置 `.env.production` 文件
- [ ] 更新云函数环境变量中的 API Keys
- [ ] 测试 API 调用是否正常
- [ ] 运行 `npm run build` 无错误
- [ ] 检查 `dist/` 目录文件完整

部署后检查：

- [ ] 访问默认域名能正常打开
- [ ] 所有页面路由正常
- [ ] API 功能正常
- [ ] 静态资源加载正常
- [ ] 控制台无错误

## 🎯 推荐工作流

**开发阶段**：
```bash
npm run dev  # 本地开发，http://localhost:5176
```

**测试阶段**：
```bash
npm run build     # 构建
npm run preview   # 预览构建结果
```

**部署阶段**：
```bash
npm run deploy    # 一键部署
```

## 📚 相关文档

- [腾讯云开发静态托管文档](https://cloud.tencent.com/document/product/876/40270)
- [CloudBase CLI 文档](https://docs.cloudbase.net/cli/intro.html)
- [Vite 部署文档](https://vitejs.dev/guide/static-deploy.html)

---

✨ **恭喜！** 完成配置后，你的应用将拥有：
- 🌍 全球 CDN 加速
- 🔒 HTTPS 加密
- 💰 免费托管
- 🚀 高性能访问
