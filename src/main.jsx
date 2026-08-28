import React from 'react'
import ReactDOM from 'react-dom/client'
import './kids-quest-study/engine/speechPacing.js'
import App from './App.jsx'
import { GameProvider as LearningProvider } from './kids-quest-study/state/GameContext.jsx'
import CloudAccountShell from './platform/CloudAccountShell.jsx'
import './kids-quest-study/styles/learning.css'
import './styles.css'
import './parent-controls.css'
import './kids-quest-study/styles/trace-mobile.css'
import './game/runtime.css'
import './ui/iphone-playtest-refresh.css'
import './platform/cloud-save.css'
import './platform/adult-cloud-controls.css'
import './ui/battle-portrait-contract.css'
import './premium-ui-v4.css'

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
    <CloudAccountShell>
      <LearningProvider>
        <App />
      </LearningProvider>
    </CloudAccountShell>
  </React.StrictMode>
)
