import api from "./api";

// الباك اند حالياً بيقبل الدخول بالـ email بس (مش username) — شوف authController.js
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { success, message, token, data: { user_id, username, email, role } }
}

export async function register(username, email, password) {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
  });
  return data;
}
