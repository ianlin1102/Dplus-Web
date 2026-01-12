/**
 * 预约/活动编辑器页面
 * Admin - Meet/Course Editor
 * 功能：编辑预约的各项设置（基本信息、样式、费用、取消规则等）
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { callAdminAPI } from '../../../services/adminService'
import './MeetEditor.css'

// Icons
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
)

const SaveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)

const TABS = [
  { key: 'basic', label: '基本信息', icon: InfoIcon },
  { key: 'style', label: '样式设置', icon: ImageIcon },
  { key: 'cost', label: '费用设置', icon: DollarIcon },
  { key: 'cancel', label: '取消规则', icon: ClockIcon },
  { key: 'form', label: '表单字段', icon: ListIcon }
]

export default function MeetEditor() {
  const navigate = useNavigate()
  const { meetId } = useParams()
  const [searchParams] = useSearchParams()
  const meetIdFromQuery = searchParams.get('id') || meetId
  const { isAdmin } = useAuth()

  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // 表单数据
  const [formData, setFormData] = useState({
    // 基本信息
    title: '',
    content: '',
    typeId: '',
    typeName: '',
    instructorId: '',
    instructorName: '',
    courseInfo: '',
    order: 9999,
    status: 1,
    isShowLimit: 1,
    maxCnt: 20,

    // 样式设置
    styleSet: {
      desc: '',
      pic: ''
    },

    // 费用设置
    costSet: {
      isEnabled: false,
      costType: 'free',
      timesCost: 1,
      balanceCost: 0,
      allowAutoSelect: true
    },

    // 取消规则
    cancelSet: {
      isLimit: false,
      days: 0,
      hours: 2,
      minutes: 0
    },

    // 表单字段
    formSet: []
  })

  // 加载预约详情
  const loadMeetDetail = useCallback(async () => {
    if (!meetIdFromQuery) {
      setError('缺少预约ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await callAdminAPI('admin/meet_detail', { id: meetIdFromQuery })

      if (result.success && result.data) {
        const meet = result.data
        setFormData({
          title: meet.MEET_TITLE || '',
          content: typeof meet.MEET_CONTENT === 'string' ? meet.MEET_CONTENT : '',
          typeId: meet.MEET_TYPE_ID || '',
          typeName: meet.MEET_TYPE_NAME || '',
          instructorId: meet.MEET_INSTRUCTOR_ID || '',
          instructorName: meet.MEET_INSTRUCTOR_NAME || '',
          courseInfo: meet.MEET_COURSE_INFO || '',
          order: meet.MEET_ORDER || 9999,
          status: meet.MEET_STATUS ?? 1,
          isShowLimit: meet.MEET_IS_SHOW_LIMIT ?? 1,
          maxCnt: meet.MEET_MAX_CNT || 20,
          styleSet: meet.MEET_STYLE_SET || { desc: '', pic: '' },
          costSet: meet.MEET_COST_SET || {
            isEnabled: false,
            costType: 'free',
            timesCost: 1,
            balanceCost: 0,
            allowAutoSelect: true
          },
          cancelSet: meet.MEET_CANCEL_SET || {
            isLimit: false,
            days: 0,
            hours: 2,
            minutes: 0
          },
          formSet: meet.MEET_FORM_SET || []
        })
      } else {
        setError(result.message || '加载失败')
      }
    } catch (err) {
      console.error('加载预约详情失败:', err)
      setError(err.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [meetIdFromQuery])

  useEffect(() => {
    if (isAdmin() && meetIdFromQuery) {
      loadMeetDetail()
    }
  }, [loadMeetDetail, isAdmin, meetIdFromQuery])

  // 保存
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updateData = {
        id: meetIdFromQuery,
        title: formData.title,
        typeId: formData.typeId,
        typeName: formData.typeName,
        instructorId: formData.instructorId,
        instructorName: formData.instructorName,
        courseInfo: formData.courseInfo,
        order: formData.order,
        status: formData.status,
        isShowLimit: formData.isShowLimit,
        maxCnt: formData.maxCnt,
        styleSet: formData.styleSet,
        costSet: formData.costSet,
        cancelSet: formData.cancelSet,
        formSet: formData.formSet
      }

      const result = await callAdminAPI('admin/meet_edit', updateData)

      if (result.success) {
        setSuccessMsg('保存成功')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setError(result.message || '保存失败')
      }
    } catch (err) {
      console.error('保存失败:', err)
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 更新表单数据
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }))
  }

  // 渲染基本信息 Tab
  const renderBasicTab = () => (
    <div className="tab-content">
      <div className="form-group">
        <label>活动标题 *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="请输入活动标题"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>分类名称</label>
          <input
            type="text"
            value={formData.typeName}
            onChange={(e) => updateField('typeName', e.target.value)}
            placeholder="如：瑜伽、普拉提"
          />
        </div>
        <div className="form-group">
          <label>导师姓名</label>
          <input
            type="text"
            value={formData.instructorName}
            onChange={(e) => updateField('instructorName', e.target.value)}
            placeholder="授课导师"
          />
        </div>
      </div>

      <div className="form-group">
        <label>课程信息</label>
        <textarea
          value={formData.courseInfo}
          onChange={(e) => updateField('courseInfo', e.target.value)}
          placeholder="课程相关信息..."
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>最大人数</label>
          <input
            type="number"
            value={formData.maxCnt}
            onChange={(e) => updateField('maxCnt', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="form-group">
          <label>排序值</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => updateField('order', parseInt(e.target.value) || 9999)}
            min="0"
          />
          <span className="field-hint">越小越靠前，0表示置顶</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>状态</label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', parseInt(e.target.value))}
          >
            <option value={1}>使用中</option>
            <option value={0}>未启用</option>
            <option value={9}>停止预约</option>
            <option value={10}>已关闭</option>
          </select>
        </div>
        <div className="form-group">
          <label>显示剩余名额</label>
          <select
            value={formData.isShowLimit}
            onChange={(e) => updateField('isShowLimit', parseInt(e.target.value))}
          >
            <option value={1}>显示</option>
            <option value={0}>隐藏</option>
          </select>
        </div>
      </div>
    </div>
  )

  // 渲染样式设置 Tab
  const renderStyleTab = () => (
    <div className="tab-content">
      <div className="form-group">
        <label>简短描述</label>
        <textarea
          value={formData.styleSet.desc || ''}
          onChange={(e) => updateNestedField('styleSet', 'desc', e.target.value)}
          placeholder="显示在列表中的简短描述..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>封面图片 URL</label>
        <input
          type="text"
          value={formData.styleSet.pic || ''}
          onChange={(e) => updateNestedField('styleSet', 'pic', e.target.value)}
          placeholder="图片云存储 ID 或 URL"
        />
        <span className="field-hint">支持云存储 cloudId 或网络图片链接</span>
      </div>

      {formData.styleSet.pic && (
        <div className="preview-box">
          <p className="preview-label">封面预览：</p>
          <div className="image-preview">
            <img
              src={formData.styleSet.pic}
              alt="封面预览"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        </div>
      )}
    </div>
  )

  // 渲染费用设置 Tab
  const renderCostTab = () => (
    <div className="tab-content">
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.costSet.isEnabled}
            onChange={(e) => updateNestedField('costSet', 'isEnabled', e.target.checked)}
          />
          <span>启用付费/扣费</span>
        </label>
        <span className="field-hint">启用后，用户预约时需要使用卡项进行支付</span>
      </div>

      {formData.costSet.isEnabled && (
        <>
          <div className="form-group">
            <label>扣费类型</label>
            <select
              value={formData.costSet.costType}
              onChange={(e) => updateNestedField('costSet', 'costType', e.target.value)}
            >
              <option value="free">免费</option>
              <option value="times">仅次数卡</option>
              <option value="balance">仅余额卡</option>
              <option value="both">次数卡或余额卡</option>
            </select>
          </div>

          {(formData.costSet.costType === 'times' || formData.costSet.costType === 'both') && (
            <div className="form-group">
              <label>消耗次数</label>
              <input
                type="number"
                value={formData.costSet.timesCost}
                onChange={(e) => updateNestedField('costSet', 'timesCost', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="field-hint">每次预约消耗的次数</span>
            </div>
          )}

          {(formData.costSet.costType === 'balance' || formData.costSet.costType === 'both') && (
            <div className="form-group">
              <label>消耗金额 (元)</label>
              <input
                type="number"
                value={formData.costSet.balanceCost}
                onChange={(e) => updateNestedField('costSet', 'balanceCost', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
              <span className="field-hint">每次预约消耗的金额</span>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.costSet.allowAutoSelect}
                onChange={(e) => updateNestedField('costSet', 'allowAutoSelect', e.target.checked)}
              />
              <span>允许自动选择卡项</span>
            </label>
            <span className="field-hint">启用后，系统会自动选择用户合适的卡项进行扣费</span>
          </div>
        </>
      )}
    </div>
  )

  // 渲染取消规则 Tab
  const renderCancelTab = () => (
    <div className="tab-content">
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.cancelSet.isLimit}
            onChange={(e) => updateNestedField('cancelSet', 'isLimit', e.target.checked)}
          />
          <span>限制取消时间</span>
        </label>
        <span className="field-hint">启用后，距离活动开始一定时间内不能取消</span>
      </div>

      {formData.cancelSet.isLimit && (
        <div className="cancel-time-setting">
          <p className="setting-desc">距离活动开始前</p>
          <div className="time-inputs">
            <div className="time-input-group">
              <input
                type="number"
                value={formData.cancelSet.days}
                onChange={(e) => updateNestedField('cancelSet', 'days', parseInt(e.target.value) || 0)}
                min="0"
                max="7"
              />
              <span>天</span>
            </div>
            <div className="time-input-group">
              <input
                type="number"
                value={formData.cancelSet.hours}
                onChange={(e) => updateNestedField('cancelSet', 'hours', parseInt(e.target.value) || 0)}
                min="0"
                max="23"
              />
              <span>小时</span>
            </div>
            <div className="time-input-group">
              <select
                value={formData.cancelSet.minutes}
                onChange={(e) => updateNestedField('cancelSet', 'minutes', parseInt(e.target.value))}
              >
                <option value={0}>0分</option>
                <option value={15}>15分</option>
                <option value={30}>30分</option>
                <option value={45}>45分</option>
              </select>
            </div>
          </div>
          <p className="setting-desc">内不能取消</p>
        </div>
      )}

      <div className="info-box">
        <InfoIcon />
        <div>
          <p>取消规则说明：</p>
          <ul>
            <li>用户取消预约后，已扣费的卡项次数/金额将自动返还</li>
            <li>如果启用限制，超过限制时间的预约将无法取消</li>
            <li>管理员可以随时手动取消任何预约</li>
          </ul>
        </div>
      </div>
    </div>
  )

  // 渲染表单字段 Tab
  const renderFormTab = () => {
    const addFormField = () => {
      setFormData(prev => ({
        ...prev,
        formSet: [...prev.formSet, {
          mark: `field_${Date.now()}`,
          title: '',
          type: 'text',
          must: false,
          placeholder: ''
        }]
      }))
    }

    const updateFormField = (index, field, value) => {
      setFormData(prev => {
        const newFormSet = [...prev.formSet]
        newFormSet[index] = { ...newFormSet[index], [field]: value }
        return { ...prev, formSet: newFormSet }
      })
    }

    const removeFormField = (index) => {
      if (!window.confirm('确认删除此字段？')) return
      setFormData(prev => ({
        ...prev,
        formSet: prev.formSet.filter((_, i) => i !== index)
      }))
    }

    return (
      <div className="tab-content">
        <div className="form-fields-header">
          <p>预约时需要用户填写的信息</p>
          <button className="add-field-btn" onClick={addFormField}>
            + 添加字段
          </button>
        </div>

        {formData.formSet.length === 0 ? (
          <div className="empty-fields">
            <p>暂无自定义字段</p>
            <p className="hint">点击上方按钮添加字段</p>
          </div>
        ) : (
          <div className="form-fields-list">
            {formData.formSet.map((field, index) => (
              <div key={field.mark || index} className="form-field-item">
                <div className="field-header">
                  <span className="field-index">#{index + 1}</span>
                  <button className="remove-field-btn" onClick={() => removeFormField(index)}>
                    删除
                  </button>
                </div>

                <div className="field-row">
                  <div className="field-col">
                    <label>字段名称</label>
                    <input
                      type="text"
                      value={field.title}
                      onChange={(e) => updateFormField(index, 'title', e.target.value)}
                      placeholder="如：联系电话"
                    />
                  </div>
                  <div className="field-col">
                    <label>字段类型</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateFormField(index, 'type', e.target.value)}
                    >
                      <option value="text">文本</option>
                      <option value="mobile">手机号</option>
                      <option value="number">数字</option>
                      <option value="select">单选</option>
                      <option value="textarea">多行文本</option>
                    </select>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-col">
                    <label>提示文字</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateFormField(index, 'placeholder', e.target.value)}
                      placeholder="输入框提示..."
                    />
                  </div>
                  <div className="field-col checkbox-col">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={field.must}
                        onChange={(e) => updateFormField(index, 'must', e.target.checked)}
                      />
                      <span>必填</span>
                    </label>
                  </div>
                </div>

                {field.type === 'select' && (
                  <div className="field-row">
                    <div className="field-col full">
                      <label>选项 (每行一个)</label>
                      <textarea
                        value={(field.options || []).join('\n')}
                        onChange={(e) => updateFormField(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                        placeholder="选项1&#10;选项2&#10;选项3"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="meet-editor">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="meet-editor">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/admin/meets')}>
          <BackIcon />
          <span>返回</span>
        </button>
        <div className="header-content">
          <h1>编辑预约设置</h1>
          <p className="subtitle">{formData.title || '未命名活动'}</p>
        </div>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <SaveIcon />
          <span>{saving ? '保存中...' : '保存'}</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="message success">
          {successMsg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs-nav">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <TabIcon />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-panel">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'cost' && renderCostTab()}
        {activeTab === 'cancel' && renderCancelTab()}
        {activeTab === 'form' && renderFormTab()}
      </div>
    </div>
  )
}
