# 🔧 静态托管部署问题排查指南

## 问题：访问 /cloud-test 出现 404 或空白页

### 快速诊断

**第 1 步：访问根路径**

访问：`https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/`

- ✅ **能访问** → 部署成功，是路由配置问题 → 跳到 [解决方案 A](#解决方案-a配置-spa-路由)
- ❌ **不能访问** → 部署有问题 → 跳到 [解决方案 B](#解决方案-b重新部署)

---

## 解决方案 A：配置 SPA 路由

React 是单页应用（SPA），需要特殊配置才能支持 `/cloud-test` 这样的路由。

### 方法 1：在云控制台配置（推荐）

1. 打开 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)

2. 选择环境：`cloud1-6gnd02he13c1ff2e`

3. 左侧菜单 → **静态网站托管**

4. 点击 **设置** → **基础配置**

5. 配置以下内容：
   ```
   索引文档: index.html
   错误文档: index.html    ← 关键！必须设置
   ```

6. 点击 **保存**

7. 等待 1-2 分钟配置生效

8. 重新访问：`https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test`

**原理**：
- 当用户访问 `/cloud-test` 时，服务器找不到这个文件，返回 404
- 配置了"错误文档: index.html"后，404 会返回 index.html
- React Router 接管路由，正确渲染 `/cloud-test` 页面

### 方法 2：使用 Hash 路由（备用方案）

如果不想配置服务器，可以改用 Hash 路由。

修改 `src/App.jsx`：

```jsx
// 原来
import { BrowserRouter as Router, ... } from 'react-router-dom'

// 改成
import { HashRouter as Router, ... } from 'react-router-dom'
```

然后重新构建和部署：
```bash
npm run build
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
```

访问地址变成：
```
https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/#/cloud-test
```

**缺点**：URL 中有 `#`，不够美观。

---

## 解决方案 B：重新部署

### 检查构建输出

1. 检查 `dist/` 目录结构：

```bash
cd smartbeauty-web
ls -la dist/
```

应该看到：
```
dist/
├── index.html        ← 必须存在
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── vite.svg（可选）
```

2. 检查 `index.html` 内容：

```bash
cat dist/index.html
```

应该包含：
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" crossorigin src="/assets/index-xxx.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-xxx.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

### 使用 CLI 重新部署（推荐）

#### 方式 1：使用我写好的脚本

```bash
cd smartbeauty-web
./deploy.sh
```

这个脚本会：
- 自动构建
- 自动部署
- 检查错误

#### 方式 2：手动执行命令

```bash
# 1. 确保安装了 CLI
npm install -g @cloudbase/cli

# 2. 登录（如果还没登录）
cloudbase login

# 3. 构建
npm run build

# 4. 部署
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
```

### 手动上传（不推荐，容易出错）

如果一定要手动上传：

1. 云控制台 → 静态网站托管 → 文件管理

2. **先删除旧文件**：
   - 选择所有文件
   - 点击删除

3. **上传新文件**：
   - 点击"上传文件"
   - 选择 `dist/` 目录下的 **index.html**
   - 再上传 `dist/assets/` 整个文件夹

4. **关键**：确保上传后的结构是：
   ```
   /                      ← 网站根目录
   ├── index.html         ← 在根目录，不是在子文件夹
   └── assets/
       ├── index-xxx.js
       └── index-xxx.css
   ```

5. 配置错误文档（见解决方案 A）

---

## 常见错误和解决方法

### 错误 1: 404 Not Found

**症状**：访问 `/cloud-test` 显示 404

**原因**：未配置 SPA 路由

**解决**：参考 [解决方案 A](#解决方案-a配置-spa-路由)

### 错误 2: 空白页

**症状**：访问显示空白页

**检查步骤**：

1. 打开浏览器开发者工具（F12）→ Console

2. 查看错误信息：

   **如果看到**：
   ```
   Failed to load resource: 404 (Not Found)
   /assets/index-xxx.js
   ```

   **原因**：JS/CSS 文件路径错误或未上传

   **解决**：检查 `dist/assets/` 文件是否上传成功

   **如果看到**：
   ```
   Uncaught SyntaxError: Unexpected token '<'
   ```

   **原因**：服务器返回了 HTML 而不是 JS 文件（路径配置问题）

   **解决**：检查 `vite.config.js` 中的 `base` 配置

3. Network 标签：
   - 查看哪些资源加载失败
   - 检查路径是否正确

### 错误 3: Vite base 路径问题

**检查 vite.config.js**：

```javascript
// 应该是这样
export default defineConfig({
  plugins: [react()],
  base: '/',  // ← 确保是 '/'
  server: {
    port: 5176,
    strictPort: false,
    open: true
  }
})
```

如果 `base` 不是 `/`，需要改成 `/` 然后重新构建。

### 错误 4: CORS 跨域错误

**症状**：控制台显示 CORS 错误

**原因**：CloudBase SDK 访问被拒绝

**解决**：这是预期的！这正是我们要测试的内容。

---

## 验证部署成功

### 测试清单

- [ ] 访问根路径 `/` 能看到首页
- [ ] 访问 `/cloud-test` 能看到测试页面
- [ ] 浏览器控制台没有 404 错误
- [ ] 页面样式正常显示
- [ ] 可以点击按钮（即使功能可能失败）

### 完整测试流程

1. **访问根路径**
   ```
   https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/
   ```
   应该看到你的首页

2. **访问测试页面**
   ```
   https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test
   ```
   应该看到"☁️ 云数据库访问测试"标题

3. **打开开发者工具**
   - 按 F12
   - 查看 Console 标签
   - 应该看到：`✅ CloudBase SDK 初始化成功`

4. **执行测试**
   - 点击"1. 匿名登录"
   - 查看日志输出
   - 测试云数据库访问

---

## 调试技巧

### 本地预览构建结果

部署前，可以先本地预览：

```bash
npm run build
npm run preview
```

访问 `http://localhost:4173/cloud-test`

如果本地预览正常，但部署后不行 → 是服务器配置问题

如果本地预览也不行 → 是构建问题

### 查看部署日志

使用 CLI 部署时，查看输出：

```bash
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
```

应该看到：
```
✔ 开始上传文件
✔ [1/10] index.html
✔ [2/10] assets/index-xxx.js
...
✔ 上传完成
```

### 清除缓存

如果部署后页面没更新：

1. 浏览器：Ctrl+Shift+R（强制刷新）
2. 云控制台：清除 CDN 缓存
   - 静态网站托管 → 设置 → 缓存配置 → 清除缓存

---

## 完整的部署检查清单

部署前检查：
- [ ] `npm run build` 成功完成
- [ ] `dist/` 目录存在
- [ ] `dist/index.html` 存在
- [ ] `dist/assets/` 目录有文件

部署后检查：
- [ ] 云控制台能看到上传的文件
- [ ] 文件结构正确（index.html 在根目录）
- [ ] 配置了错误文档为 `index.html`
- [ ] 访问根路径成功
- [ ] 访问 `/cloud-test` 成功

测试时检查：
- [ ] 浏览器控制台无 404 错误
- [ ] 页面样式正常
- [ ] 可以点击按钮
- [ ] SDK 初始化成功

---

## 还是不行？

### 提供以下信息：

1. **访问根路径的结果**
   - URL: `https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/`
   - 看到了什么？

2. **访问测试页的结果**
   - URL: `https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test`
   - 看到了什么？（404？空白？其他？）

3. **浏览器控制台错误**
   - 按 F12 → Console
   - 截图所有错误信息

4. **部署方式**
   - 使用 CLI？还是手动上传？
   - 部署时的输出信息

5. **云控制台配置**
   - 错误文档是否配置为 `index.html`？
   - 截图静态托管的文件列表

提供这些信息后，我能准确定位问题！

---

## 快速参考

**推荐部署方式**：
```bash
./deploy.sh
```

**手动部署命令**：
```bash
npm run build
cloudbase hosting deploy ./dist -e cloud1-6gnd02he13c1ff2e
```

**必须配置**：
- 错误文档: `index.html`

**测试地址**：
- 根路径: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/
- 测试页: https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/cloud-test
