# 🩰 舞社预约系统实施指南 - 基于现有 SmartBeauty 代码

## 📊 现状分析

### ✅ 已有功能（无需开发）

你的 **SmartBeauty 小程序**已经完整实现了舞社预约系统需要的所有核心功能：

#### 小程序端（用户端）
- ✅ **预约系统** - 完整的预约流程（浏览、预约、取消、签到）
- ✅ **卡项系统** - 次数卡、储值卡管理（正好对应舞社的"课程包"）
- ✅ **签到功能** - 扫码签到、手动签到
- ✅ **排行榜** - 上课排行榜（已修改）
- ✅ **个人中心** - 我的预约、我的卡项
- ✅ **积分系统** - 签到积分、积分排行

#### 管理后台（小程序端）
- ✅ **课程管理** - 对应现有的"预约管理"（`ax_meet` 表）
- ✅ **学员管理** - 用户管理
- ✅ **预约管理** - 查看所有预约、签到核销
- ✅ **卡项管理** - 为学员充值课时
- ✅ **数据统计** - 预约统计、签到统计
- ✅ **数据导出** - Excel 导出功能

### 🚧 需要新建的功能

唯一需要开发的是：**网页管理后台**（React）

原因：
- 小程序管理后台功能完整但操作不便（小屏幕）
- 网页后台更适合管理员日常工作（大屏幕、多标签页）
- 可以复用现有云函数 API（175 个路由已经写好）

---

## 🎯 实施方案

### 方案一：快速启动（推荐）

**直接使用现有小程序，只开发网页端管理后台**

#### 步骤 1：配置现有数据
1. 修改机构名称：`关于我们` → 改成你的舞社名称
2. 修改轮播图和资讯：上传舞社的宣传图片
3. 配置课程（即预约项目）：
   - 街舞基础班 → 创建一个"预约"
   - 爵士舞进阶班 → 创建一个"预约"
4. 配置导师：上传舞蹈老师信息

#### 步骤 2：开发网页管理后台
使用 React + 现有云函数 API

**优势**：
- 云函数已有 175 个 API 路由
- 数据库已经设计好
- 只需要写前端界面即可

#### 步骤 3：部署上线
- 小程序：提交审核
- 网页：静态托管部署

**预计时间**：1-2 周

---

### 方案二：长期优化（可选）

**在方案一基础上逐步优化**

1. UI 优化：改成更适合舞社的设计风格
2. 术语调整：
   - "美容项目" → "舞蹈课程"
   - "卡项" → "课程包"
   - "签到" → "上课打卡"
3. 功能增强：
   - 视频展示（学员作品）
   - 在线报名（新学员）
   - 课程评价系统

**预计时间**：持续迭代

---

## 💻 网页管理后台开发详细计划

### 架构设计

```
smartbeauty-web/
└── src/
    ├── pages/
    │   ├── Login.jsx              # 登录页
    │   ├── Dashboard.jsx          # 仪表盘
    │   ├── CourseManagement.jsx   # 课程管理（复用 meet API）
    │   ├── BookingManagement.jsx  # 预约管理（复用 join API）
    │   ├── StudentManagement.jsx  # 学员管理（复用 user API）
    │   ├── CardManagement.jsx     # 课程包管理（复用 card API）
    │   ├── CheckinManagement.jsx  # 签到管理（复用 checkin API）
    │   └── Statistics.jsx         # 数据统计
    ├── components/
    │   ├── Layout.jsx             # 布局组件（侧边栏+顶栏）
    │   ├── CourseForm.jsx         # 课程表单
    │   ├── BookingTable.jsx       # 预约表格
    │   └── StatsCard.jsx          # 统计卡片
    └── services/
        ├── secureApi.js           # API 服务（已有）
        ├── courseApi.js           # 课程 API（封装 meet 路由）
        ├── bookingApi.js          # 预约 API（封装 join 路由）
        ├── studentApi.js          # 学员 API（封装 user 路由）
        └── authApi.js             # 认证 API（admin/login）
```

### API 映射关系

你的现有云函数路由 ↔ 舞社术语：

| 舞社概念 | 现有路由 | 说明 |
|---------|---------|------|
| **课程** | `admin/meet_list` | 获取课程列表 |
|  | `admin/meet_insert` | 创建课程 |
|  | `admin/meet_edit` | 编辑课程 |
|  | `admin/meet_del` | 删除课程 |
| **预约** | `admin/join_list` | 所有学员预约 |
|  | `admin/join_detail` | 预约详情 |
|  | `admin/join_status` | 修改预约状态 |
| **学员** | `admin/user_list` | 学员列表 |
|  | `admin/user_detail` | 学员详情 |
|  | `admin/user_del` | 删除学员 |
| **课程包** | `admin/card_list` | 课程包列表 |
|  | `admin/card_insert` | 创建课程包 |
|  | `admin/user_card_add` | 给学员充值课时 |
| **签到** | `admin/join_scan` | 扫码签到 |
|  | `admin/join_checkin` | 手动签到 |
|  | `checkin/rank_list` | 上课排行榜 |
| **统计** | `admin/statistic_*` | 各类统计数据 |

### 核心页面代码示例

#### 1. API 服务层

```javascript
// src/services/courseApi.js
import { callSecureCloudRoute } from './secureApi'

/**
 * 课程 API（复用 meet 路由）
 */

// 获取课程列表
export const getCourseList = async (params = {}) => {
  return await callSecureCloudRoute('admin/meet_list', {
    search: params.search || '',
    isOver: params.isOver || '',
    sort: params.sort || { 'MEET_ORDER': 'asc' },
    page: params.page || 1,
    size: params.size || 10
  })
}

// 获取课程详情
export const getCourseDetail = async (id) => {
  return await callSecureCloudRoute('admin/meet_detail', { id })
}

// 创建课程
export const createCourse = async (courseData) => {
  return await callSecureCloudRoute('admin/meet_insert', courseData)
}

// 编辑课程
export const updateCourse = async (id, courseData) => {
  return await callSecureCloudRoute('admin/meet_edit', {
    id,
    ...courseData
  })
}

// 删除课程
export const deleteCourse = async (id) => {
  return await callSecureCloudRoute('admin/meet_del', { id })
}

// 修改课程状态
export const updateCourseStatus = async (id, status) => {
  return await callSecureCloudRoute('admin/meet_status', { id, status })
}

// 导出课程数据
export const exportCourses = async () => {
  return await callSecureCloudRoute('admin/meet_export')
}
```

```javascript
// src/services/bookingApi.js
import { callSecureCloudRoute } from './secureApi'

/**
 * 预约 API（复用 join 路由）
 */

// 获取预约列表
export const getBookingList = async (params = {}) => {
  return await callSecureCloudRoute('admin/join_list', {
    meetId: params.courseId || '',
    status: params.status || '',
    search: params.search || '',
    sortType: params.sortType || 'status',
    sortVal: params.sortVal || 'asc',
    page: params.page || 1,
    size: params.size || 30
  })
}

// 获取预约详情
export const getBookingDetail = async (id) => {
  return await callSecureCloudRoute('admin/join_detail', { joinId: id })
}

// 签到
export const checkinBooking = async (joinId) => {
  return await callSecureCloudRoute('admin/join_checkin', {
    joinId,
    flag: 1  // 1=签到, 0=取消签到
  })
}

// 取消预约
export const cancelBooking = async (joinId, reason = '') => {
  return await callSecureCloudRoute('admin/join_status', {
    joinId,
    status: 10,  // 10=已取消
    reason
  })
}

// 导出预约数据
export const exportBookings = async (meetId) => {
  return await callSecureCloudRoute('admin/join_data_export', { meetId })
}
```

```javascript
// src/services/authApi.js
import { callSecureCloudRoute } from './secureApi'

/**
 * 管理员认证 API
 */

// 登录
export const adminLogin = async (username, password) => {
  const result = await callSecureCloudRoute('admin/login', {
    name: username,
    password: password
  })

  // 保存 token
  if (result.token) {
    localStorage.setItem('admin_token', result.token)
    localStorage.setItem('admin_name', result.name)
  }

  return result
}

// 登出
export const adminLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_name')
}

// 检查登录状态
export const isLoggedIn = () => {
  return !!localStorage.getItem('admin_token')
}

// 获取当前管理员信息
export const getAdminInfo = () => {
  return {
    token: localStorage.getItem('admin_token'),
    name: localStorage.getItem('admin_name')
  }
}
```

#### 2. 登录页面

```jsx
// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../services/authApi'
import './Login.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await adminLogin(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>舞社管理后台</h1>
        <p className="subtitle">SmartBeauty Dance Studio</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="hint">
          默认账号：admin / 密码：123456
        </div>
      </div>
    </div>
  )
}
```

```css
/* src/pages/Login.css */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #333;
}

.login-card .subtitle {
  color: #666;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button[type="submit"]:hover {
  opacity: 0.9;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 16px;
  padding: 12px;
  background: #fee;
  border-radius: 6px;
  font-size: 14px;
}

.hint {
  margin-top: 24px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
```

#### 3. 仪表盘

```jsx
// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { callSecureCloudRoute } from '../services/secureApi'
import Layout from '../components/Layout'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayBookings: 0,
    todayCheckins: 0,
    activeCourses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      // 并行获取多个统计数据
      const [userRes, meetRes, joinRes] = await Promise.all([
        callSecureCloudRoute('admin/user_list', { page: 1, size: 1 }),
        callSecureCloudRoute('admin/meet_list', { page: 1, size: 1 }),
        callSecureCloudRoute('admin/join_list', { page: 1, size: 1 })
      ])

      setStats({
        totalStudents: userRes.total || 0,
        activeCourses: meetRes.total || 0,
        todayBookings: joinRes.total || 0,
        todayCheckins: 0  // 需要额外接口
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Layout><div className="loading">加载中...</div></Layout>
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>数据概览</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>总学员数</h3>
              <p className="stat-value">{stats.totalStudents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>进行中课程</h3>
              <p className="stat-value">{stats.activeCourses}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>今日预约</h3>
              <p className="stat-value">{stats.todayBookings}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>今日签到</h3>
              <p className="stat-value">{stats.todayCheckins}</p>
            </div>
          </div>
        </div>

        {/* 可以添加图表、最近活动等 */}
      </div>
    </Layout>
  )
}
```

#### 4. 课程管理页面

```jsx
// src/pages/CourseManagement.jsx
import { useState, useEffect } from 'react'
import { getCourseList, deleteCourse, updateCourseStatus } from '../services/courseApi'
import Layout from '../components/Layout'
import './CourseManagement.css'

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0
  })

  useEffect(() => {
    loadCourses()
  }, [pagination.page])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const result = await getCourseList({
        page: pagination.page,
        size: pagination.size
      })

      setCourses(result.list || [])
      setPagination(prev => ({
        ...prev,
        total: result.total || 0
      }))
    } catch (error) {
      console.error('加载课程失败:', error)
      alert('加载课程失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`确定要删除课程"${title}"吗？`)) return

    try {
      await deleteCourse(id)
      alert('删除成功')
      loadCourses()
    } catch (error) {
      alert('删除失败：' + error.message)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    try {
      await updateCourseStatus(id, newStatus)
      loadCourses()
    } catch (error) {
      alert('状态修改失败：' + error.message)
    }
  }

  return (
    <Layout>
      <div className="course-management">
        <div className="page-header">
          <h1>课程管理</h1>
          <button className="btn-primary" onClick={() => {/* TODO: 打开创建表单 */}}>
            + 新建课程
          </button>
        </div>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>课程名称</th>
                  <th>状态</th>
                  <th>最大人数</th>
                  <th>当前预约</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course._id}>
                    <td>
                      <div className="course-title">
                        {course.MEET_TITLE}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${course.MEET_STATUS}`}>
                        {getStatusText(course.MEET_STATUS)}
                      </span>
                    </td>
                    <td>{course.MEET_MAX_CNT || '-'}</td>
                    <td>{course.MEET_JOIN_CNT || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => {/* TODO: 编辑 */}}>编辑</button>
                        <button onClick={() => handleToggleStatus(course._id, course.MEET_STATUS)}>
                          {course.MEET_STATUS === 1 ? '停用' : '启用'}
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(course._id, course.MEET_TITLE)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                上一页
              </button>
              <span>第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.size)} 页</span>
              <button
                disabled={pagination.page * pagination.size >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

function getStatusText(status) {
  const map = {
    0: '未启用',
    1: '进行中',
    9: '已停止',
    10: '已结束'
  }
  return map[status] || '未知'
}
```

---

## 📝 后续开发任务清单

### 网页管理后台（估计 1-2 周）

#### 第一周：核心功能
- [ ] 登录页面和认证
- [ ] 仪表盘（数据概览）
- [ ] 课程管理（列表、新建、编辑、删除）
- [ ] 预约管理（列表、详情、签到）
- [ ] 学员管理（列表、详情）

#### 第二周：扩展功能
- [ ] 课程包管理
- [ ] 数据统计（图表展示）
- [ ] 签到记录查询
- [ ] 数据导出（Excel）
- [ ] 系统设置

#### 优化和部署
- [ ] UI/UX 优化
- [ ] 响应式适配
- [ ] 测试和修复 bug
- [ ] 部署到静态托管

---

## 🚀 快速启动步骤

### 1. 立即可用（5 分钟）

```bash
# 1. 打开小程序
使用微信开发者工具打开 smartbeauty-master

# 2. 配置云环境
确认 cloud ID: cloud1-6gnd02he13c1ff2e

# 3. 测试预约功能
进入小程序 → 预约列表 → 创建预约

# 4. 测试管理后台
进入小程序管理后台 → admin/123456 登录
```

### 2. 配置舞社信息（30 分钟）

1. 修改"关于我们"页面
2. 上传舞社轮播图
3. 添加舞蹈老师信息
4. 创建 3-5 个舞蹈课程（使用预约管理）
5. 创建课程包（使用卡项管理）

### 3. 开发网页后台（1-2 周）

按照上面的代码示例，逐步开发各个页面。

---

## 💡 核心优势

使用现有 SmartBeauty 代码的优势：

1. **0 后端开发** - 175 个 API 已经写好
2. **0 数据库设计** - 18 个表结构完整
3. **功能完整** - 预约、卡项、签到、统计全有
4. **成熟稳定** - 10 万行代码经过测试
5. **快速上线** - 只需开发前端界面

---

## 📞 下一步

**建议操作顺序**：

1. **先测试小程序** - 确认现有功能是否满足需求
2. **配置舞社信息** - 把美容改成舞蹈
3. **开发网页后台** - 从登录页和仪表盘开始
4. **逐步完善** - 根据实际使用反馈优化

**我可以帮你**：
- 写具体的页面代码（课程管理、预约管理等）
- 配置路由和状态管理
- 优化 UI 设计
- 解决开发中的问题

你想从哪里开始？
