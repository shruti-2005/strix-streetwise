import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthorityRoute from "./components/AuthorityRoute";
import Home from "./pages/Home";
import ReportIssue from "./pages/ReportIssue";
import MyReports from "./pages/MyReports";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import AuthorityIssueDetail from "./pages/AuthorityIssueDetail";
import LiveMap from "./pages/LiveMap";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route
            path="/authority"
            element={
              <AuthorityRoute>
              <AuthorityDashboard />
              </AuthorityRoute>
            }
          />
          <Route path="/admin" element={<AuthorityRoute><AuthorityDashboard /></AuthorityRoute>} />
          <Route
            path="/authority/issues/:id"
            element={<AuthorityRoute><AuthorityIssueDetail /></AuthorityRoute>}
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 48 }}>
      <h1>Page not found</h1>
    </div>
  );
}
