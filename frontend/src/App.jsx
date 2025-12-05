import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Links from './pages/Links'
import LinkDetails from './pages/LinkDetails'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedLink, setSelectedLink] = useState(null)

  const navigateTo = (page, link = null) => {
    setCurrentPage(page)
    if (link) setSelectedLink(link)
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="logo">🔗</span>
            <span className="brand-name">URL Shortener</span>
          </div>
          <div className="nav-links">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              Home
            </button>
            <button 
              className={`nav-link ${currentPage === 'links' ? 'active' : ''}`}
              onClick={() => navigateTo('links')}
            >
              Links
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentPage === 'home' && <Home navigateTo={navigateTo} />}
        {currentPage === 'links' && <Links navigateTo={navigateTo} />}
        {currentPage === 'details' && <LinkDetails link={selectedLink} navigateTo={navigateTo} />}
      </main>
    </div>
  )
}

export default App
