import React from 'react'
import ReactDOM from 'react-dom/client'
import './kids-quest-study/engine/speechPacing.js'
import App from './App.jsx'
import { GameProvider as LearningProvider } from './kids-quest-study/state/GameContext.jsx'
import './kids-quest-study/styles/learning.css'
import './styles.css'
import './parent-controls.css'
import './kids-quest-study/styles/trace-mobile.css'
import './game/runtime.css'
import './premium-ui-v4.css'

const CANONICAL_HOST = 'syoudai0514.github.io'
const CANONICAL_PATH = '/mana-evo/'
if (window.location.hostname === CANONICAL_HOST && !window.location.pathname.startsWith(CANONICAL_PATH)) {
  window.location.replace(`${CANONICAL_PATH}${window.location.search}${window.location.hash}`)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    navigator.serviceWorker.register(`${baseUrl}sw.js`, {
      scope: baseUrl,
      updateViaCache: 'none'
    }).then((registration) => registration.update()).catch((error) => {
      console.warn('ManaEvo service worker registration failed', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LearningProvider>
      <App />
    </LearningProvider>
  </React.StrictMode>
)
