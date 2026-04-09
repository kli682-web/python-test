import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google' // 1. 导入 Provider
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. 用 Provider 包裹 App，确保 Client ID 正确 */}
    <GoogleOAuthProvider clientId="130114719090-pk81vceiioo3c2iugu9plbejjki0lm75.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)