import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Billing from "./pages/Billing";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/" element={<Login />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
