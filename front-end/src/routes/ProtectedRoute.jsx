import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// allowedRoles=undefined → أي مستخدم مسجّل دخول (بغض النظر عن الـ role)
// allowedRoles=["admin"] أو ["admin","moderator"] → لازم الـ role يبقى ضمن القايمة
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // مسجّل دخول بس مش عنده صلاحية للصفحة دي
    return <Navigate to="/" replace />;
  }

  return children;
}
