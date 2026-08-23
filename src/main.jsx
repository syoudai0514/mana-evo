import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GameProvider as LearningProvider } from './kids-quest-study/state/GameContext.jsx'
import './kids-quest-study/styles/learning.css'
import './styles.css'
import './parent-controls.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LearningProvider>
      <App />
    </LearningProvider>
  </React.StrictMode>
)
