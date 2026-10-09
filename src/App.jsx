import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Services from './pages/Services'
import Pricing from './pages/Pricing'
import PlaceOrder from './pages/PlaceOrder'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import RefundPolicy from './pages/RefundPolicy'
import { OrderSuccess, OrderCancelled } from './pages/OrderResult'

// Admin is a separate chunk: visitors never download it.
const Admin = lazy(() => import('./pages/admin/Admin'))

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/order/success" element={<OrderSuccess />} />
          <Route path="/order/cancelled" element={<OrderCancelled />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
        </Route>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="p-10 text-sm text-ink-dim">Loading…</div>}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
