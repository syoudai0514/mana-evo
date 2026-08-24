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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL
    }).catch((error) => {
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
