import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import RootLayout from './routes/RootLayout.jsx'
import HomePage from './routes/HomePage.jsx'
import LoginPage from './routes/LoginPage.jsx'
import SignupPage from './routes/SignupPage.jsx'
import DashboardPage from './routes/DashboardPage.jsx'
import VerifyPage from './routes/VerifyPage.jsx'
import AdminPage from './routes/AdminPage.jsx'
import IssuerCertificatesPage from './routes/IssuerCertificatesPage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'verify', element: <VerifyPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'issuer-certificates', element: <IssuerCertificatesPage /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
