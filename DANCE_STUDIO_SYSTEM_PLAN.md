# 🩰 舞社预约管理系统 - 完整实施方案

## 📋 系统概述

一个**小程序 + 网页**双端的舞社课程预约和管理系统。

### 目标用户
- **学生（主要用小程序）**：浏览课程、预约、签到
- **管理员（主要用网页）**：管理课程、查看预约、统计数据

### 技术栈
- **小程序端**：微信原生小程序 + 云开发 SDK
- **网页端**：React + Vite + 云开发 HTTP API
- **后端**：微信云开发（云函数 + 云数据库 + 云存储）

---

## 🗄️ 第一步：数据库设计

### 1.1 创建数据库集合

在云控制台创建以下集合：

```bash
云控制台 → 数据库 → 集合管理 → 添加集合
```

#### courses（课程表）

```json
{
  "_id": "自动生成",
  "name": "街舞基础班",
  "description": "适合零基础学员，从基础律动开始",
  "instructor": "张老师",
  "category": "街舞",
  "coverImage": "cloud://xxx.png",
  "price": 150,
  "duration": 90,
  "maxStudents": 20,
  "schedule": [
    {
      "dayOfWeek": 1,
      "startTime": "19:00",
      "endTime": "20:30"
    },
    {
      "dayOfWeek": 3,
      "startTime": "19:00",
      "endTime": "20:30"
    }
  ],
  "status": "active",
  "_createTime": "数据库自动",
  "_updateTime": "数据库自动"
}
```

**字段说明**：
- `name`: 课程名称
- `instructor`: 教师名称
- `category`: 课程分类（街舞、爵士、芭蕾、现代舞等）
- `schedule`: 每周的上课时间安排
- `dayOfWeek`: 0=周日, 1=周一, ..., 6=周六
- `status`: active（进行中）、paused（暂停）、ended（结束）

**权限设置**：
- 所有用户可读
- 仅管理员可写

#### bookings（预约表）

```json
{
  "_id": "自动生成",
  "courseId": "course_xxx",
  "courseName": "街舞基础班",
  "userId": "user_openid_xxx",
  "userName": "小明",
  "userAvatar": "https://xxx",
  "userPhone": "13800138000",
  "bookingDate": "2025-12-25",
  "timeSlot": "19:00-20:30",
  "status": "confirmed",
  "checkedIn": false,
  "checkinTime": null,
  "cancelledAt": null,
  "cancelReason": "",
  "_createTime": "数据库自动",
  "_updateTime": "数据库自动"
}
```

**字段说明**：
- `courseId`: 关联的课程 ID
- `userId`: 用户的 openid
- `bookingDate`: 预约的具体日期（YYYY-MM-DD）
- `status`: confirmed（已确认）、cancelled（已取消）、completed（已完成）、no_show（缺席）
- `checkedIn`: 是否已签到

**权限设置**：
- 用户可读写自己的预约
- 管理员可读写所有预约

#### users（用户表）

```json
{
  "_id": "openid_xxx",
  "openid": "openid_xxx",
  "nickName": "小明",
  "avatarUrl": "https://xxx",
  "phone": "13800138000",
  "membershipLevel": "normal",
  "membershipExpiry": "2026-12-31",
  "remainingClasses": 10,
  "totalBookings": 25,
  "totalCheckins": 20,
  "totalNoShows": 2,
  "registeredAt": "2025-01-01",
  "_createTime": "数据库自动",
  "_updateTime": "数据库自动"
}
```

**字段说明**：
- `membershipLevel`: normal（普通）、vip（会员）、instructor（教师）
- `remainingClasses`: 剩余课时（次卡制）
- `totalNoShows`: 累计缺席次数

**权限设置**：
- 用户可读自己的信息
- 仅管理员可写

#### checkins（签到记录）

你已经有这个表了，可以扩展：

```json
{
  "_id": "自动生成",
  "userId": "openid_xxx",
  "userName": "小明",
  "courseId": "course_xxx",
  "courseName": "街舞基础班",
  "bookingId": "booking_xxx",
  "checkinTime": "2025-12-25 19:05:30",
  "checkinType": "scan",
  "checkinBy": "admin_openid_xxx",
  // ... 你现有的其他字段
  "_createTime": "数据库自动"
}
```

**字段说明**：
- `checkinType`: scan（扫码）、manual（手动核销）、auto（自动签到）
- `checkinBy`: 核销人员的 openid

#### admins（管理员表）

```json
{
  "_id": "admin_001",
  "openid": "admin_openid_xxx",
  "name": "管理员",
  "role": "super_admin",
  "permissions": [
    "manage_courses",
    "manage_bookings",
    "manage_users",
    "view_statistics",
    "checkin"
  ],
  "active": true,
  "_createTime": "数据库自动"
}
```

**权限设置**：
- 仅管理员可读写

---

## ☁️ 第二步：云函数开发

### 2.1 文件结构

```
cloudfunctions/
└── cloud/
    ├── index.js              # 主入口（已有）
    ├── security.js           # 安全模块（已有）
    ├── project/
    │   ├── controller/
    │   │   ├── checkin_controller.js      # 签到控制器（已有）
    │   │   ├── course_controller.js       # 课程控制器（新建）
    │   │   ├── booking_controller.js      # 预约控制器（新建）
    │   │   ├── user_controller.js         # 用户控制器（新建）
    │   │   └── admin_controller.js        # 管理员控制器（新建）
    │   └── service/
    │       ├── course_service.js          # 课程业务逻辑
    │       ├── booking_service.js         # 预约业务逻辑
    │       └── user_service.js            # 用户业务逻辑
    └── package.json
```

### 2.2 核心云函数路由

#### 课程管理路由（course/*）

```javascript
// course/list - 获取课程列表
// 参数: { category, status, page, limit }
// 返回: { list: [], total: 100 }

// course/detail - 获取课程详情
// 参数: { courseId }
// 返回: { course: {...} }

// course/create - 创建课程（管理员）
// 参数: { name, description, instructor, ... }
// 返回: { courseId }

// course/update - 更新课程（管理员）
// 参数: { courseId, updates: {...} }
// 返回: { success: true }

// course/delete - 删除课程（管理员）
// 参数: { courseId }
// 返回: { success: true }

// course/schedules - 获取课程的可预约时间
// 参数: { courseId, startDate, endDate }
// 返回: { schedules: [{date, timeSlot, available, booked}] }
```

#### 预约管理路由（booking/*）

```javascript
// booking/create - 创建预约
// 参数: { courseId, bookingDate, timeSlot }
// 返回: { bookingId }

// booking/cancel - 取消预约
// 参数: { bookingId, reason }
// 返回: { success: true }

// booking/my_list - 我的预约列表
// 参数: { status, page, limit }
// 返回: { list: [], total: 10 }

// booking/admin_list - 所有预约列表（管理员）
// 参数: { courseId, date, status, page, limit }
// 返回: { list: [], total: 100 }

// booking/check_availability - 检查是否可预约
// 参数: { courseId, bookingDate, timeSlot }
// 返回: { available: true, reason: "" }
```

#### 签到管理路由（checkin/*）

你已经有的，扩展：

```javascript
// checkin/scan - 扫码签到
// checkin/manual - 手动签到（管理员）
// checkin/rank_list - 排行榜（已有）
// checkin/my_history - 我的签到历史
// checkin/statistics - 签到统计（管理员）
```

#### 用户管理路由（user/*）

```javascript
// user/profile - 获取用户信息
// user/update - 更新用户信息
// user/statistics - 用户统计数据
```

#### 管理员路由（admin/*）

```javascript
// admin/statistics - 整体数据统计
// admin/verify - 验证管理员权限
```

---

## 📱 第三步：小程序端开发

### 3.1 页面结构

```
miniprogram/
├── pages/
│   ├── index/                    # 首页（已有）
│   ├── courses/                  # 课程列表（新建）
│   │   ├── list.wxml
│   │   ├── list.js
│   │   └── list.wxss
│   ├── course-detail/            # 课程详情（新建）
│   │   ├── detail.wxml
│   │   ├── detail.js
│   │   └── detail.wxss
│   ├── booking/                  # 预约页面（新建）
│   │   ├── booking.wxml
│   │   ├── booking.js
│   │   └── booking.wxss
│   ├── my-bookings/              # 我的预约（新建）
│   │   ├── list.wxml
│   │   ├── list.js
│   │   └── list.wxss
│   └── profile/                  # 个人中心（新建）
│       ├── profile.wxml
│       ├── profile.js
│       └── profile.wxss
└── cmpts/                        # 组件（已有）
```

### 3.2 核心功能实现示例

#### 课程列表

```javascript
// pages/courses/list.js
Page({
  data: {
    courses: [],
    categories: ['全部', '街舞', '爵士', '芭蕾', '现代舞'],
    activeCategory: '全部'
  },

  onLoad() {
    this.loadCourses()
  },

  async loadCourses() {
    wx.showLoading({ title: '加载中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'cloud',
        data: {
          route: 'course/list',
          category: this.data.activeCategory === '全部' ? null : this.data.activeCategory,
          status: 'active'
        }
      })

      this.setData({
        courses: res.result.data.list
      })
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  onCourseClick(e) {
    const courseId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/course-detail/detail?id=${courseId}`
    })
  }
})
```

#### 预约课程

```javascript
// pages/booking/booking.js
Page({
  data: {
    course: {},
    selectedDate: '',
    selectedTimeSlot: '',
    availableSchedules: []
  },

  async onLoad(options) {
    const courseId = options.courseId
    await this.loadCourse(courseId)
    await this.loadSchedules(courseId)
  },

  async onBooking() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'cloud',
        data: {
          route: 'booking/create',
          courseId: this.data.course._id,
          bookingDate: this.data.selectedDate,
          timeSlot: this.data.selectedTimeSlot
        }
      })

      wx.showToast({ title: '预约成功', icon: 'success' })

      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/my-bookings/list'
        })
      }, 1500)
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'error' })
    }
  }
})
```

---

## 💻 第四步：网页管理后台开发

### 4.1 页面结构

```
smartbeauty-web/
└── src/
    ├── pages/
    │   ├── Dashboard.jsx          # 仪表盘（统计概览）
    │   ├── CourseManagement.jsx   # 课程管理
    │   ├── BookingManagement.jsx  # 预约管理
    │   ├── UserManagement.jsx     # 学员管理
    │   ├── CheckinManagement.jsx  # 签到核销
    │   ├── Statistics.jsx         # 数据统计
    │   └── RankingTest.jsx        # 排行榜（已有）
    ├── components/
    │   ├── CourseForm.jsx         # 课程表单
    │   ├── BookingTable.jsx       # 预约表格
    │   ├── StatisticsChart.jsx    # 统计图表
    │   └── Sidebar.jsx            # 侧边导航
    └── services/
        ├── secureApi.js           # API 服务（已有）
        ├── courseApi.js           # 课程 API
        ├── bookingApi.js          # 预约 API
        └── adminApi.js            # 管理员 API
```

### 4.2 核心功能示例

#### 仪表盘

```jsx
// Dashboard.jsx
import { useState, useEffect } from 'react'
import { callSecureCloudRoute } from '../services/secureApi'

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    todayCheckins: 0,
    totalStudents: 0,
    activeCourses: 0
  })

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const data = await callSecureCloudRoute('admin/statistics')
      setStats(data)
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  }

  return (
    <div className="dashboard">
      <h1>数据概览</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>今日预约</h3>
          <p className="stat-value">{stats.todayBookings}</p>
        </div>

        <div className="stat-card">
          <h3>今日签到</h3>
          <p className="stat-value">{stats.todayCheckins}</p>
        </div>

        <div className="stat-card">
          <h3>总学员数</h3>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>

        <div className="stat-card">
          <h3>进行中课程</h3>
          <p className="stat-value">{stats.activeCourses}</p>
        </div>
      </div>

      {/* 图表、最近预约等 */}
    </div>
  )
}
```

#### 课程管理

```jsx
// CourseManagement.jsx
import { useState, useEffect } from 'react'
import { callSecureCloudRoute } from '../services/secureApi'

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)

  const loadCourses = async () => {
    try {
      const data = await callSecureCloudRoute('course/list', { status: 'all' })
      setCourses(data.list)
    } catch (error) {
      console.error('加载课程失败:', error)
    }
  }

  const handleCreate = async (courseData) => {
    try {
      await callSecureCloudRoute('course/create', courseData)
      await loadCourses()
      setShowForm(false)
    } catch (error) {
      console.error('创建课程失败:', error)
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('确定删除这个课程吗？')) return

    try {
      await callSecureCloudRoute('course/delete', { courseId })
      await loadCourses()
    } catch (error) {
      console.error('删除课程失败:', error)
    }
  }

  return (
    <div className="course-management">
      <div className="header">
        <h1>课程管理</h1>
        <button onClick={() => setShowForm(true)}>+ 新建课程</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>课程名称</th>
            <th>教师</th>
            <th>分类</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course._id}>
              <td>{course.name}</td>
              <td>{course.instructor}</td>
              <td>{course.category}</td>
              <td>{course.status}</td>
              <td>
                <button onClick={() => handleEdit(course)}>编辑</button>
                <button onClick={() => handleDelete(course._id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && <CourseForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
    </div>
  )
}
```

---

## 🔒 第五步：安全和权限控制

### 5.1 管理员验证

在云函数中添加管理员验证：

```javascript
// cloudfunctions/cloud/middleware/auth.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 验证管理员权限
 */
async function verifyAdmin(userId) {
  const { data } = await db.collection('admins')
    .where({
      openid: userId,
      active: true
    })
    .get()

  return data.length > 0 ? data[0] : null
}

/**
 * 检查特定权限
 */
function hasPermission(admin, permission) {
  return admin && admin.permissions.includes(permission)
}

module.exports = {
  verifyAdmin,
  hasPermission
}
```

### 5.2 云函数中使用

```javascript
// cloudfunctions/cloud/project/controller/course_controller.js
const auth = require('../../middleware/auth')

class CourseController {
  async create(params, context) {
    // 获取当前用户 openid
    const userId = context.OPENID || context.FROM_OPENID

    // 验证管理员权限
    const admin = await auth.verifyAdmin(userId)
    if (!admin || !auth.hasPermission(admin, 'manage_courses')) {
      throw new Error('无权限操作')
    }

    // 创建课程逻辑
    // ...
  }
}
```

### 5.3 网页端管理员登录

两种方式：

**方式一：微信扫码登录（推荐）**

```javascript
// 在网页显示二维码，管理员用小程序扫码
// 小程序调用云函数生成登录凭证
// 网页轮询获取登录状态
```

**方式二：API Key 验证（简单）**

```javascript
// 你已经实现的方式
// 管理员使用固定的 API Key 访问
```

---

## 📊 第六步：数据统计功能

### 6.1 统计维度

```javascript
// admin/statistics 云函数
{
  today: {
    bookings: 15,      // 今日预约
    checkins: 12,      // 今日签到
    newUsers: 3        // 新增用户
  },
  week: {
    bookings: 95,
    checkins: 80,
    revenue: 12000     // 本周营收（如果有付费）
  },
  month: {
    bookings: 380,
    checkins: 320,
    revenue: 48000
  },
  popularCourses: [   // 热门课程
    { courseName: "街舞基础班", bookings: 120 },
    { courseName: "爵士进阶班", bookings: 95 }
  ],
  activeStudents: [   // 活跃学员
    { userName: "小明", checkins: 25 },
    { userName: "小红", checkins: 22 }
  ]
}
```

---

## 🚀 实施时间线

### 阶段一：基础框架（1-2 周）
- [ ] 创建数据库集合
- [ ] 开发核心云函数（课程、预约）
- [ ] 小程序端课程浏览、预约功能
- [ ] 网页端课程管理基础界面

### 阶段二：完善功能（1-2 周）
- [ ] 小程序端我的预约、个人中心
- [ ] 网页端预约管理、学员管理
- [ ] 签到功能集成
- [ ] 数据统计功能

### 阶段三：优化和上线（1 周）
- [ ] UI/UX 优化
- [ ] 性能优化
- [ ] 测试和修复 bug
- [ ] 部署上线

---

## 💡 技术要点

### 数据同步
小程序和网页访问**同一个云数据库**，数据自动同步，无需额外处理。

### 实时更新
- 小程序：使用数据库的实时数据推送（`watch()`）
- 网页：定时刷新或使用 WebSocket

### 图片上传
```javascript
// 小程序上传到云存储
wx.cloud.uploadFile({
  cloudPath: 'courses/cover_' + Date.now() + '.jpg',
  filePath: tempFilePath
})

// 网页上传（通过云函数）
// 先上传到临时服务器，云函数再转存到云存储
```

### 支付集成（可选）
如果需要在线支付：
- 小程序：微信支付（官方 API）
- 网页：微信 H5 支付

---

## 📞 下一步建议

1. **先确认数据库结构**
   - 我可以帮你创建数据库初始化脚本
   - 或者直接在云控制台手动创建

2. **选择开发优先级**
   - 建议先做：课程管理 → 预约功能 → 签到功能
   - 统计功能可以最后做

3. **决定管理员登录方式**
   - 简单：继续用 API Key
   - 安全：微信扫码登录

**你想从哪个部分开始？我可以帮你写具体的代码实现。**
