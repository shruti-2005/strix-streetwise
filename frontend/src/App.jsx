import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthorityRoute from "./components/AuthorityRoute";
import Home from "./pages/Home";
import ReportIssue from "./pages/ReportIssue";
import MyReports from "./pages/MyReports";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import Login from "./pages/Login";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route
            path="/authority"
            element={
              <AuthorityRoute>
                <AuthorityDashboard />
              </AuthorityRoute>
            }
          />
          <Route path="/login" element={<Login />} />
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
