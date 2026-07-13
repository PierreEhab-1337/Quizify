import api from "./api";

// كل المستخدمين — أدمن بس
export async function getAllUsers() {
  const { data } = await api.get("/users");
  return data.data; // array of safe user fields (بدون password)
}

// بروفايل المستخدم الحالي نفسه
export async function getMyProfile() {
  const { data } = await api.get("/users/myprofile/me");
  return data.data;
}

// تعديل بروفايل المستخدم الحالي (username/email بس)
export async function updateMyProfile(payload) {
  const { data } = await api.patch("/users/myprofile/me", payload);
  return data.data;
}

// تعديل username/email لأي مستخدم — أدمن بس
// ملحوظة: الباك اند حالياً مبيسمحش بتعديل الـ role من هنا
export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data;
}

// حذف مستخدم — أدمن بس
export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data.data;
}
