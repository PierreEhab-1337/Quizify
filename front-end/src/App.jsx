import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import "./App.css";

// الصفحات
import HomePage from "./pages/HomePage.jsx"; // ملاحظة: ده placeholder حالياً، لسه هيتربط بمحتوى حقيقي لاحقاً
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx"; // محتواه الفعلي: لوحة المسابقات (Drafts/Saved/Completed)
import QuestionsPage from "./pages/QuestionsPage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import ImportExportPage from "./pages/ImportExportPage.jsx";
import ManualSelectionPage from "./pages/ManualSelectionPage.jsx";
import PlaybackGridPage from "./pages/PlaybackGridPage.jsx";
import QuestionPlayPage from "./pages/QuestionPlayPage.jsx";
import EndPage from "./pages/EndPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import AdminStatsPage from "./pages/admin stat.jsx"; // محتواه الفعلي: إحصائيات الأدمن الحقيقية (Dashboard)

const NAV_ITEMS = [
  { to: "/", label: "الرئيسية" },
  { to: "/manual-selection", label: "اختيار الأسئلة" },
  { to: "/playback", label: "شبكة العرض" },
  { to: "/end", label: "نهاية المسابقة" },
];

const ADMIN_NAV_ITEMS = [
  { to: "/admin/dashboard", label: "الإحصائيات" },
  { to: "/admin/questions", label: "الأسئلة" },
  { to: "/admin/categories", label: "التصنيفات" },
  { to: "/admin/users", label: "المستخدمين" },
  { to: "/admin/import-export", label: "استيراد/تصدير" },
];

function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdminOrMod = user.role === "admin" || user.role === "moderator";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="app-nav">
      {NAV_ITEMS.map((item) => (
        <a key={item.to} href={item.to} className="nav-btn"
           onClick={(e) => { e.preventDefault(); navigate(item.to); }}>
          {item.label}
        </a>
      ))}
      {isAdminOrMod &&
        ADMIN_NAV_ITEMS.map((item) => (
          <a key={item.to} href={item.to} className="nav-btn"
             onClick={(e) => { e.preventDefault(); navigate(item.to); }}>
            {item.label}
          </a>
        ))}
      <button className="nav-btn" onClick={handleLogout}>
        خروج ({user.username})
      </button>
    </nav>
  );
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function AppShell() {
  return (
    <div className="App">
      <AppNav />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/manual-selection" element={
            <ProtectedRoute><ManualSelectionPage /></ProtectedRoute>
          } />
          <Route path="/playback/:contestId" element={
            <ProtectedRoute><PlaybackGridPage /></ProtectedRoute>
          } />
          <Route path="/playback" element={
            <ProtectedRoute><PlaybackGridPage /></ProtectedRoute>
          } />
          <Route path="/question-play/:contestId/:questionId" element={
            <ProtectedRoute><QuestionPlayPage /></ProtectedRoute>
          } />
          <Route path="/end" element={
            <ProtectedRoute><EndPage /></ProtectedRoute>
          } />

          {/* صفحات أدمن/موديريتور فقط */}
          <Route path="/admin/questions" element={
            <ProtectedRoute allowedRoles={["admin", "moderator"]}><QuestionsPage /></ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={["admin", "moderator"]}><CategoriesPage /></ProtectedRoute>
          } />

          {/* صفحات أدمن فقط */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}><AdminStatsPage /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["admin"]}><UsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/import-export" element={
            <ProtectedRoute allowedRoles={["admin"]}><ImportExportPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
