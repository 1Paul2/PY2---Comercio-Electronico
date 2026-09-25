import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'
import { CartProvider } from './context/CartContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </HashRouter>
  </StrictMode>,
)