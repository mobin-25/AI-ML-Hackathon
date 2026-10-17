import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { Home } from './pages/Home';
import { Features } from './pages/Features';
import { Pricing } from './pages/Pricing';
import { Industries } from './pages/Industries';
import { About } from './pages/About';
import { Compare } from './pages/Compare';
import { Blog } from './pages/Blog';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';

// Dashboard App Pages
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Forecasting } from './pages/Forecasting';
import { Alerts } from './pages/Alerts';
import { Import } from './pages/Import';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/about" element={<About />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Dedicated Full-Screen Authentication Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated / Application Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/forecasting" element={<Forecasting />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/import" element={<Import />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
