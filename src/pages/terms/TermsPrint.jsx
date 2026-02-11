/**
 * 条款协议打印页面
 * 用于生成 PDF（通过浏览器打印功能）
 */

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import './TermsPrint.css'

const CLOUD_FUNCTION_URL = 'https://cloud1-6gnd02he13c1ff2e-1380655578.ap-shanghai.app.tcloudbase.com/cloud'

export default function TermsPrint() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const token = searchParams.get('token') || ''

      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: 'terms/get_agreement_for_print',
          PID: 'A00',
          token,
          params: { id }
        })
      })

      const result = await response.json()

      if ((result.code === 200 || result.code === 0) && result.data) {
        setData(result.data)
      } else {
        setError(result.msg || 'Agreement record not found')
      }
    } catch (err) {
      setError(err.message || 'Failed to load agreement')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return '-'
    const d = new Date(timestamp)
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function getPlatformLabel(type) {
    const labels = {
      wechat: 'WeChat Mini Program',
      google: 'Web (Google)',
      username: 'Web (Account)'
    }
    return labels[type] || 'Dplus Platform'
  }

  if (loading) return <div className="print-loading">Loading...</div>
  if (error) return <div className="print-error">{error}</div>
  if (!data) return null

  const { agreement, user, terms, logo } = data
  const sections = terms.sections || []
  const headerSection = sections.find(s => s.isHeader)
  const regularSections = sections.filter(s => !s.isHeader)

  return (
    <div className="print-page">
      {/* Print button - hidden when printing */}
      <div className="print-controls no-print">
        <button onClick={() => window.print()} className="print-btn">
          Print / Save as PDF
        </button>
      </div>

      <div className="print-content">
        {/* Company Header */}
        <div className="print-company-header">
          {logo && <img src={logo} alt="Logo" className="print-logo" />}
          <h1 className="print-company-name">Dplus Dance Studio</h1>
        </div>

        {/* Document Title */}
        {headerSection && (
          <div className="print-doc-header">
            <h2 className="print-doc-title">{headerSection.header_en}</h2>
            <h3 className="print-doc-title-zh">{headerSection.header_zh}</h3>
            <div className="print-version">Version {agreement.AGREE_VERSION}</div>
          </div>
        )}

        {/* Intro - both languages */}
        {headerSection && (
          <div className="print-intro">
            <p>{headerSection.intro_en}</p>
            <p className="print-intro-zh">{headerSection.intro_zh}</p>
          </div>
        )}

        {/* Terms Sections - both languages */}
        {regularSections.map((section, idx) => (
          <div key={idx} className="print-section">
            <h4 className="print-section-title">
              {section.title_en || section.title_zh || section.title}
            </h4>
            <p className="print-section-content">
              {section.content_en || section.content_zh || section.content}
            </p>
            {section.title_zh && section.title_en && (
              <>
                <h4 className="print-section-title-zh">
                  {section.title_zh}
                </h4>
                <p className="print-section-content-zh">
                  {section.content_zh}
                </p>
              </>
            )}
          </div>
        ))}

        {/* Electronic Acknowledgement */}
        <div className="print-acknowledgement">
          <h3>Electronic Acknowledgement / 电子确认</h3>
          <p className="print-ack-text">
            I confirm that I have read, understood, and voluntarily agree to all terms of this Agreement.
          </p>
          <p className="print-ack-text-zh">
            本人确认已完整阅读、理解并自愿接受本协议的全部条款。
          </p>

          <div className="print-signature-block">
            <div className="print-sig-row">
              <span className="print-sig-label">Agreed by / 签署人:</span>
              <span className="print-sig-value">{agreement.AGREE_PRINTED_NAME}</span>
            </div>
            <div className="print-sig-row">
              <span className="print-sig-label">Phone / 电话:</span>
              <span className="print-sig-value">{user.USER_MOBILE || '-'}</span>
            </div>
            <div className="print-sig-row">
              <span className="print-sig-label">Date / 日期:</span>
              <span className="print-sig-value">{formatDate(agreement.AGREE_TIME)}</span>
            </div>
            <div className="print-sig-row">
              <span className="print-sig-label">Platform / 平台:</span>
              <span className="print-sig-value">{getPlatformLabel(agreement.AGREE_UNIQUE_TYPE)}</span>
            </div>
          </div>

          <p className="print-electronic-note">
            Electronically agreed via Dplus Platform / 通过 Dplus 平台电子签署
          </p>
        </div>
      </div>
    </div>
  )
}
