import axios from "axios";

// ════════════════════════════════════════════════════════════
// عنوان الباك اند — عدّل ملف .env (شوف .env.example) بدل ما تغيّر هنا
// ════════════════════════════════════════════════════════════
const BASE_URL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = "quizify_token";
const USER_KEY = "quizify_user";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// إرفاق الـ JWT Token تلقائياً مع كل طلب لو موجود
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// لو الـ Token بقى غير صالح أو منتهي، امسحه من التخزين المحلي
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    return Promise.reject(error);
  }
);

export { TOKEN_KEY, USER_KEY };
export default api;
