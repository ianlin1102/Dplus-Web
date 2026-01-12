import { useState, useRef } from 'react'
import { X, Upload, Image, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { uploadPaymentProof } from '../services/cardService'
import './UploadProofModal.css'

/**
 * 上传支付凭证弹窗组件
 */
const UploadProofModal = ({ isOpen, onClose, purchaseId, onSuccess }) => {
  const { language } = useLanguage()
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const texts = language === 'zh' ? {
    title: '上传支付凭证',
    subtitle: '请上传 Zelle 转账截图',
    orderId: '订单号',
    selectFile: '选择图片',
    dragHint: '点击选择或拖拽图片到此处',
    supportedFormats: '支持 JPG、PNG、GIF 格式，最大 10MB',
    uploading: '上传中',
    uploadButton: '确认上传',
    successTitle: '上传成功',
    successMessage: '凭证已上传，请等待工作人员确认',
    close: '关闭',
    cancel: '取消',
    retry: '重新选择',
  } : {
    title: 'Upload Payment Proof',
    subtitle: 'Please upload your Zelle transfer screenshot',
    orderId: 'Order ID',
    selectFile: 'Select Image',
    dragHint: 'Click to select or drag image here',
    supportedFormats: 'Supports JPG, PNG, GIF formats, max 10MB',
    uploading: 'Uploading',
    uploadButton: 'Confirm Upload',
    successTitle: 'Upload Successful',
    successMessage: 'Proof uploaded, please wait for staff confirmation',
    close: 'Close',
    cancel: 'Cancel',
    retry: 'Select Again',
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const validateAndSetFile = (file) => {
    setError(null)

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError(language === 'zh' ? '请选择 JPG、PNG 或 GIF 格式的图片' : 'Please select JPG, PNG or GIF image')
      return
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'zh' ? '图片大小不能超过 10MB' : 'Image size cannot exceed 10MB')
      return
    }

    setSelectedFile(file)
    // 创建预览 URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile || !purchaseId) return

    setUploading(true)
    setError(null)

    try {
      const result = await uploadPaymentProof(purchaseId, selectedFile, (progress) => {
        setUploadProgress(progress)
      })

      if (result.success) {
        setUploadSuccess(true)
        onSuccess?.(result)
      }
    } catch (err) {
      console.error('上传失败:', err)
      setError(language === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    // 清理预览 URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    setUploadSuccess(false)
    setError(null)
    onClose()
  }

  const handleRetry = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    fileInputRef.current?.click()
  }

  return (
    <div className="upload-overlay" onClick={handleClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="upload-header">
          <div>
            <h2>{texts.title}</h2>
            <p className="upload-subtitle">{texts.subtitle}</p>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={uploading}>
            <X size={20} />
          </button>
        </div>

        {/* Order ID */}
        <div className="order-info">
          <span className="order-label">{texts.orderId}:</span>
          <span className="order-id">{purchaseId}</span>
        </div>

        {/* Upload Area */}
        {!uploadSuccess ? (
          <>
            <div
              className={`upload-area ${previewUrl ? 'has-preview' : ''} ${error ? 'has-error' : ''}`}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button className="retry-btn" onClick={handleRetry}>
                    {texts.retry}
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <Upload size={40} />
                  </div>
                  <p className="upload-hint">{texts.dragHint}</p>
                  <p className="upload-formats">{texts.supportedFormats}</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="upload-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Progress */}
            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="progress-text">{texts.uploading}... {uploadProgress}%</span>
              </div>
            )}

            {/* Footer */}
            <div className="upload-footer">
              <button className="btn-cancel" onClick={handleClose} disabled={uploading}>
                {texts.cancel}
              </button>
              <button
                className={`btn-upload ${selectedFile ? 'active' : ''}`}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    {texts.uploading}...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    {texts.uploadButton}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="upload-success">
            <div className="success-icon">
              <CheckCircle size={60} />
            </div>
            <h3>{texts.successTitle}</h3>
            <p>{texts.successMessage}</p>
            <button className="btn-close" onClick={handleClose}>
              {texts.close}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadProofModal
