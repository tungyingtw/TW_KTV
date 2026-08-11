import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { TaiwanMapDemo } from './components/TaiwanMapDemo'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && window.location.pathname === '/taiwan-map-demo' ? <TaiwanMapDemo /> : <App />}
  </StrictMode>,
)
