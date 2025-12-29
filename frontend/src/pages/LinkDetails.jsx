import { useState, useEffect } from 'react'
import axios from 'axios'
import './LinkDetails.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function LinkDetails({ link, navigateTo }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (link) {
      fetchAnalytics()
    }
  }, [link])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/${link.url_id}`)
      setAnalytics(response.data)
    } catch (err) {
      console.error('Failed to fetch analytics', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (!link) {
    return <div>No link selected</div>
  }

  if (loading) {
    return <div className="loading">Loading analytics...</div>
  }

  return (
    <div className="details-page">
      <button className="btn-back" onClick={() => navigateTo('links')}>
        ← Back to list
      </button>

      <div className="details-header">
        <div>
          <h1 className="details-title">Link Analytics</h1>
          <a
            href={analytics.shorter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="details-link"
          >
            {analytics.shorter_url}
          </a>
          <a
            href={analytics.org_url}
            target="_blank"
            rel="noopener noreferrer"
            className="details-original"
          >
            ↳ {analytics.org_url}
          </a>
        </div>
        <button
          className="btn-copy-lg"
          onClick={() => copyToClipboard(analytics.shorter_url)}
        >
          Copy link
        </button>
      </div>

      <div className="stats-overview">
        <div className="stat-box">
          <span className="stat-box-label">Total Clicks</span>
          <span className="stat-box-value">{analytics.analytics.totalClicks}</span>
        </div>
        <div className="stat-box">
          <span className="stat-box-label">Created</span>
          <span className="stat-box-value">
            {new Date(analytics.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3 className="card-title">Clicks by Country</h3>
          <div className="data-list">
            {Object.entries(analytics.analytics.clicksByCountry).length > 0 ? (
              Object.entries(analytics.analytics.clicksByCountry)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <div key={country} className="data-item">
                    <span className="data-label">{country}</span>
                    <span className="data-value">{count}</span>
                  </div>
                ))
            ) : (
              <p className="no-data">No data yet</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3 className="card-title">Clicks by Device</h3>
          <div className="data-list">
            {Object.entries(analytics.analytics.clicksByDevice).length > 0 ? (
              Object.entries(analytics.analytics.clicksByDevice)
                .sort((a, b) => b[1] - a[1])
                .map(([device, count]) => (
                  <div key={device} className="data-item">
                    <span className="data-label">{device}</span>
                    <span className="data-value">{count}</span>
                  </div>
                ))
            ) : (
              <p className="no-data">No data yet</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3 className="card-title">Clicks by Browser</h3>
          <div className="data-list">
            {Object.entries(analytics.analytics.clicksByBrowser).length > 0 ? (
              Object.entries(analytics.analytics.clicksByBrowser)
                .sort((a, b) => b[1] - a[1])
                .map(([browser, count]) => (
                  <div key={browser} className="data-item">
                    <span className="data-label">{browser}</span>
                    <span className="data-value">{count}</span>
                  </div>
                ))
            ) : (
              <p className="no-data">No data yet</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3 className="card-title">Top Referrers</h3>
          <div className="data-list">
            {Object.entries(analytics.analytics.topReferrers).length > 0 ? (
              Object.entries(analytics.analytics.topReferrers)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([referrer, count]) => (
                  <div key={referrer} className="data-item">
                    <span className="data-label">{referrer.substring(0, 40)}...</span>
                    <span className="data-value">{count}</span>
                  </div>
                ))
            ) : (
              <p className="no-data">No referrer data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="qr-section-details">
        <h2 className="section-title">QR Code</h2>
        <div className="qr-container">
          <div className="qr-preview-large">
            <img
              src={`${API_URL}/qr/${link.url_id}?format=png`}
              alt="QR Code"
              className="qr-image-large"
            />
          </div>
          <div className="qr-actions">
            <p className="qr-description">
              Download your QR code in multiple formats for offline sharing
            </p>
            <div className="qr-buttons">
              <a
                href={`${API_URL}/qr/${link.url_id}?format=png&download=true`}
                className="btn-qr"
                download
              >
                Download PNG
              </a>
              <a
                href={`${API_URL}/qr/${link.url_id}?format=jpeg&download=true`}
                className="btn-qr"
                download
              >
                Download JPEG
              </a>
              <a
                href={`${API_URL}/qr/${link.url_id}?format=svg&download=true`}
                className="btn-qr"
                download
              >
                Download SVG
              </a>
            </div>
          </div>
        </div>
      </div>

      {analytics.analytics.recentClicks.length > 0 && (
        <div className="recent-clicks">
          <h2 className="section-title">Recent Clicks</h2>
          <div className="clicks-table">
            {analytics.analytics.recentClicks.map((click, index) => (
              <div key={index} className="click-row">
                <div className="click-info">
                  <span className="click-country">{click.country}</span>
                  <span className="click-detail">
                    {click.browser} on {click.os} • {click.device_type}
                  </span>
                </div>
                <span className="click-time">
                  {new Date(click.clicked_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LinkDetails
