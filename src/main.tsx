import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { TaiwanMapDemo } from './components/TaiwanMapDemo'
import { VisitRegionHeatPage } from './components/VisitRegionHeatPage'

try {
  const savedTheme = localStorage.getItem('tw_ktv_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
} catch {}

const isVisitRegionPage = new URLSearchParams(window.location.search).get('view') === 'visit-region-stats';
const isTaiwanMapDemo = import.meta.env.DEV && window.location.pathname === '/taiwan-map-demo';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTaiwanMapDemo ? <TaiwanMapDemo /> : isVisitRegionPage ? <VisitRegionHeatPage /> : <App />}
  </StrictMode>,
)
