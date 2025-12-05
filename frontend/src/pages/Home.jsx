import { useState } from 'react'
import axios from 'axios'
import './Home.css'

const API_URL = 'http://localhost:3000'

function Home({ navigateTo }) {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const payload = { url }
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim()
      }

      const response = await axios.post(`${API_URL}/short`, payload)
      setResult(response.data)
      setUrl('')
      setCustomAlias('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create short URL')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Your Connections Platform</h1>
        <p className="hero-subtitle">Shorten, customize, and track your links</p>
      </div>

      <div className="create-section">
        <div className="create-card">
          <h2 className="card-title">Quick create</h2>
          <p className="card-subtitle">You can create links and track their performance</p>

          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-group">
              <label className="form-label">Enter your destination URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/my-long-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Custom alias (optional)
                <span className="label-hint">3-20 characters, letters, numbers, hyphens, underscores</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="my-custom-link"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                pattern="[a-zA-Z0-9_-]{3,20}"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create short link'}
            </button>
          </form>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="success-message">
                <span className="success-icon">🎉</span>
                <span className="success-text">Your link is ready!</span>
              </div>

              <div className="result-card">
                <div className="result-url">
                  <span className="url-label">Short URL:</span>
                  <a href={result.shorter_url} target="_blank" rel="noopener noreferrer" className="short-url">
                    {result.shorter_url}
                  </a>
                </div>
                <button className="btn-copy" onClick={() => copyToClipboard(result.shorter_url)}>
                  Copy link
                </button>
              </div>

              <div className="qr-section">
                <h3 className="qr-title">QR Codes available:</h3>
                <div className="qr-preview">
                  <img src={result.qr_code.png} alt="QR Code" className="qr-image" />
                </div>
                <div className="qr-downloads">
                  <a href={`${result.qr_code.png}&download=true`} className="btn-download" download>
                    Download PNG
                  </a>
                  <a href={`${result.qr_code.jpeg}&download=true`} className="btn-download" download>
                    Download JPEG
                  </a>
                  <a href={`${result.qr_code.svg}&download=true`} className="btn-download" download>
                    Download SVG
                  </a>
                </div>
              </div>

              <button className="btn-secondary" onClick={() => navigateTo('links')}>
                View all links
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
