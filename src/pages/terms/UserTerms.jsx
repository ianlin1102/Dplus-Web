/**
 * 用户服务条款页面
 * 滚动阅读 + 打勾确认 + 输入法律姓名
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { getTermsContent, agreeUserTerms, checkUserTerms } from '../../services/termsService'
import './UserTerms.css'

const UserTerms = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { language } = useLanguage()
  const { isLoggedIn, user } = useAuth()
  const scrollRef = useRef(null)

  // 返回 URL（同意后跳转回去）
  const returnUrl = location.state?.returnUrl || '/dashboard'

  // 状态
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState([])
  const [version, setVersion] = useState(0)
  const [alreadyAgreed, setAlreadyAgreed] = useState(false)
  const [agreedVersion, setAgreedVersion] = useState(0)

  // 表单状态
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [checkbox, setCheckbox] = useState(false)
  const [printedName, setPrintedName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // 检查登录状态
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { state: { returnUrl: '/terms/user' } })
    }
  }, [isLoggedIn, navigate])

  // 加载条款内容和检查状态
  useEffect(() => {
    const loadData = async () => {
      if (!isLoggedIn()) return

      try {
        setLoading(true)

        // 并行加载条款内容和检查状态
        const [termsResult, checkResult] = await Promise.all([
          getTermsContent('user_terms'),
          checkUserTerms()
        ])

        if (termsResult.success) {
          setSections(termsResult.sections)
          setVersion(termsResult.version)
        }

        if (checkResult.success) {
          // 检查是否已同意最新版本
          if (!checkResult.needAgree && checkResult.userAgreed === 1) {
            setAlreadyAgreed(true)
            setAgreedVersion(checkResult.userVersion)
          }
        }
      } catch (err) {
        console.error('加载条款失败:', err)
        setError(language === 'zh' ? '加载失败' : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isLoggedIn, language])

  // 检查是否需要滚动 - 如果内容短于视窗则自动启用同意区域
  useEffect(() => {
    if (loading || scrolledToBottom || alreadyAgreed) return

    const checkScrollNeeded = () => {
      const element = scrollRef.current
      if (!element) return

      // 如果内容高度小于等于可视区域高度（允许50px误差），不需要滚动
      if (element.scrollHeight <= element.clientHeight + 50) {
        setScrolledToBottom(true)
      }
    }

    // 延迟检查，等待 DOM 渲染完成
    const timer = setTimeout(checkScrollNeeded, 300)

    // 窗口大小变化时重新检查
    window.addEventListener('resize', checkScrollNeeded)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScrollNeeded)
    }
  }, [loading, scrolledToBottom, alreadyAgreed, sections])

  // 监听滚动事件（节流）
  const scrollTicking = useRef(false)
  const handleScroll = useCallback((e) => {
    if (scrolledToBottom || scrollTicking.current) return
    scrollTicking.current = true
    requestAnimationFrame(() => {
      const element = e.target
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50
      if (isAtBottom) {
        setScrolledToBottom(true)
      }
      scrollTicking.current = false
    })
  }, [scrolledToBottom])

  // 提交同意
  const handleSubmit = async () => {
    if (!scrolledToBottom) {
      setError(language === 'zh' ? '请先阅读完整条款' : 'Please read the full terms')
      return
    }
    if (!checkbox) {
      setError(language === 'zh' ? '请勾选同意条款' : 'Please check the agreement box')
      return
    }
    if (!printedName.trim()) {
      setError(language === 'zh' ? '请输入您的法律姓名' : 'Please enter your legal name')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await agreeUserTerms(version, printedName.trim(), checkbox)

      if (result.success) {
        setSuccess(true)
        // 延迟跳转
        setTimeout(() => {
          navigate(returnUrl)
        }, 1500)
      } else {
        setError(result.message || (language === 'zh' ? '提交失败' : 'Submit failed'))
      }
    } catch (err) {
      console.error('同意条款失败:', err)
      setError(language === 'zh' ? '提交失败，请重试' : 'Submit failed, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="user-terms-page">
        <div className="loading-state">
          <Loader2 className="loading-spinner" size={40} />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    )
  }

  // 成功状态
  if (success) {
    return (
      <div className="user-terms-page">
        <div className="success-state">
          <CheckCircle size={60} className="success-icon" />
          <h2>{language === 'zh' ? '同意成功!' : 'Agreement Submitted!'}</h2>
          <p>{language === 'zh' ? '正在返回...' : 'Redirecting...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-terms-page">
      {/* 条款内容（滚动区域） */}
      <div
        className="terms-content"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* 头部 - sticky 在滚动区域内 */}
        <header className="terms-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>{language === 'zh' ? '用户服务条款' : 'User Service Terms'}</h1>
          <div className="header-spacer" />
        </header>

        <div className="terms-content-inner">
        {/* 版本信息 */}
        <div className="terms-version-info">
          <span className="version-badge">V{version}</span>
          {alreadyAgreed && (
            <span className="agreed-badge">
              {language === 'zh' ? `已同意 V${agreedVersion}` : `Agreed V${agreedVersion}`}
            </span>
          )}
        </div>
        {/* Header section */}
        {sections.length > 0 && sections[0].isHeader && (
          <div className="terms-document-header">
            <h2 className="terms-document-title">
              {language === 'zh' ? sections[0].header_zh : sections[0].header_en}
            </h2>
            {(language === 'zh' ? sections[0].header_en : sections[0].header_zh) && (
              <h3 className="terms-document-subtitle">
                {language === 'zh' ? sections[0].header_en : sections[0].header_zh}
              </h3>
            )}
            <p className="terms-document-intro">
              {language === 'zh' ? sections[0].intro_zh : sections[0].intro_en}
            </p>
          </div>
        )}

        {/* Regular sections */}
        {sections.filter(s => !s.isHeader).map((section, idx) => (
          <div key={idx} className="terms-section">
            <h3 className="section-title">
              {language === 'zh'
                ? (section.title_zh || section.title)
                : (section.title_en || section.title_zh || section.title)}
            </h3>
            <div className="section-content" style={{whiteSpace: 'pre-wrap'}}>
              {language === 'zh'
                ? (section.content_zh || section.content)
                : (section.content_en || section.content_zh || section.content)}
            </div>
          </div>
        ))}

        {/* 滚动提示 */}
        {!scrolledToBottom && (
          <div className="scroll-hint">
            <span>↓ {language === 'zh' ? '请继续滚动阅读完整条款' : 'Please scroll to read full terms'} ↓</span>
          </div>
        )}
        </div>
      </div>

      {/* 同意区域 */}
      <div className="agree-section visible">
        <div className="agree-section-inner">
        {/* 未读完遮罩 */}
        {!scrolledToBottom && !alreadyAgreed && (
          <div className="agree-mask">
            <span>{language === 'zh' ? '请先阅读完用户协议' : 'Please read the full agreement first'}</span>
          </div>
        )}
        {/* 已同意状态 */}
        {alreadyAgreed ? (
          <div className="already-agreed">
            <CheckCircle size={24} className="agreed-icon" />
            <span>
              {language === 'zh'
                ? '您已同意用户服务条款'
                : 'You have agreed to the terms'}
            </span>
            <button className="return-btn" onClick={() => navigate(returnUrl)}>
              {language === 'zh' ? '返回' : 'Return'}
            </button>
          </div>
        ) : (
          <>
            {/* 打勾确认 */}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkbox}
                onChange={(e) => setCheckbox(e.target.checked)}
                disabled={!scrolledToBottom}
              />
              <span>
                {language === 'zh'
                  ? '我已阅读并同意上述条款'
                  : 'I have read and agree to the above terms'}
              </span>
            </label>

            {/* 输入法律姓名 */}
            <div className="name-input-group">
              <label className="name-label">
                {language === 'zh'
                  ? '请输入您的法律姓名 (Printed Name)'
                  : 'Please enter your legal name (Printed Name)'}
              </label>
              <input
                type="text"
                className="name-input"
                placeholder={language === 'zh' ? '如：张三 / John Smith' : 'e.g. John Smith'}
                value={printedName}
                onChange={(e) => setPrintedName(e.target.value)}
                disabled={!scrolledToBottom}
                maxLength={50}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              className={`submit-btn ${submitting ? 'loading' : ''}`}
              onClick={handleSubmit}
              disabled={!scrolledToBottom || !checkbox || !printedName.trim() || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="btn-spinner" size={20} />
                  {language === 'zh' ? '提交中...' : 'Submitting...'}
                </>
              ) : (
                language === 'zh' ? '确认同意' : 'Confirm Agreement'
              )}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default UserTerms
