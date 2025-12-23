# GitHub Actions 自动部署配置

## 📋 配置说明

此工作流实现了从 GitHub 推送代码到腾讯云 CloudBase 静态托管的自动部署。

## 🔐 必需的 GitHub Secrets

在仓库设置中配置以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `TCB_SECRET_ID` | 腾讯云 API 密钥 ID | `AKIDxxxxxxxxxx` |
| `TCB_SECRET_KEY` | 腾讯云 API 密钥 Key | `xxxxxxxxxxxxxx` |
| `TCB_ENV_ID` | 云开发环境 ID | `cloud1-6gnd02he13c1ff2e` |

### 如何配置 Secrets：

1. 访问：https://github.com/ianlin1102/Dplus-Web/settings/secrets/actions
2. 点击 **New repository secret**
3. 依次添加上述三个 Secrets

## 🚀 触发方式

### 自动触发
- 推送代码到 `main` 分支时自动触发部署

### 手动触发
1. 访问：https://github.com/ianlin1102/Dplus-Web/actions
2. 选择 **Deploy to CloudBase Static Hosting** 工作流
3. 点击 **Run workflow** → **Run workflow**

## 📊 工作流步骤

1. **检出代码** - 从 GitHub 拉取最新代码
2. **设置 Node.js** - 配置 Node.js 20 环境
3. **安装依赖** - 执行 `npm ci`
4. **构建项目** - 执行 `npm run build`
5. **验证构建** - 检查 `dist/` 目录
6. **安装 CloudBase CLI** - 安装腾讯云工具
7. **登录 CloudBase** - 使用 API 密钥登录
8. **部署到静态托管** - 上传文件到云端
9. **输出结果** - 显示部署状态和访问地址

## 🔍 查看部署状态

访问：https://github.com/ianlin1102/Dplus-Web/actions

## 🌐 部署地址

https://cloud1-6gnd02he13c1ff2e-1380655578.tcloudbaseapp.com/

## ⚙️ 自定义配置

### 修改 Node.js 版本

编辑 `deploy.yml` 中的：
```yaml
env:
  NODE_VERSION: '20'  # 改成你需要的版本
```

### 修改部署路径

编辑部署命令：
```yaml
tcb hosting deploy ./dist / -e ${{ secrets.TCB_ENV_ID }}
#                       ↑    ↑
#                    构建目录 部署路径
```

### 添加部署前测试

在 `Build project` 步骤后添加：
```yaml
- name: 🧪 Run tests
  run: npm test
```

## 📝 注意事项

1. ⚠️ **Secrets 安全**：不要在代码中硬编码 API 密钥
2. ⚠️ **权限控制**：建议使用子账号 API 密钥（仅授予 CloudBase 权限）
3. ⚠️ **构建时间**：首次构建可能需要 2-3 分钟（安装依赖）
4. ✅ **缓存加速**：后续构建利用 npm 缓存，约 1 分钟完成
5. ✅ **并行运行**：多次推送会排队执行，不会冲突

## 🆚 与腾讯云托管 CI/CD 的区别

| 特性 | 腾讯云托管 CI/CD | GitHub Actions |
|-----|----------------|----------------|
| 配置难度 | 简单（网页配置） | 中等（需要写 YAML） |
| 构建环境 | 腾讯云服务器 | GitHub 服务器 |
| 构建日志 | 腾讯云控制台 | GitHub Actions 页面 |
| 自定义能力 | 有限 | 完全自定义 |
| 执行速度 | 较快 | 快（GitHub 全球服务器） |
| 成本 | 免费 | 免费（公开仓库） |

## 🔄 迁移建议

如果你已经在使用腾讯云托管的 CI/CD：

1. **可以共存**：两种方式可以同时启用，互不冲突
2. **逐步切换**：先测试 GitHub Actions，确认无误后再禁用腾讯云托管 CI/CD
3. **回滚方案**：如果 GitHub Actions 有问题，腾讯云托管可以作为备份

## 🐛 故障排查

### 部署失败常见原因

1. **Secrets 配置错误**
   - 检查 SecretId 和 SecretKey 是否正确
   - 检查环境 ID 是否正确

2. **API 密钥权限不足**
   - 确保 API 密钥有 CloudBase 访问权限
   - 建议使用主账号密钥测试

3. **构建失败**
   - 检查 `npm ci` 是否成功
   - 检查 `npm run build` 是否正常

4. **网络问题**
   - GitHub Actions 到腾讯云可能偶尔超时
   - 可以手动重新运行工作流

### 查看详细日志

1. 访问：https://github.com/ianlin1102/Dplus-Web/actions
2. 点击失败的工作流运行
3. 展开每个步骤查看详细输出
