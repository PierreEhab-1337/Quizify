import api from "./api";

// كل التصنيفات مع عدد الأسئلة الحي لكل واحد (question_count)
export async function getCategories() {
  const { data } = await api.get("/category");
  return data.data; // array of { category_id, category_type, user_id, created_at, question_count }
}

export async function getCategoryById(id) {
  const { data } = await api.get(`/category/${id}`);
  return data.data;
}

export async function createCategory(categoryType) {
  const { data } = await api.post("/category", { category_type: categoryType });
  return data.data;
}

export async function renameCategory(id, categoryType) {
  const { data } = await api.patch(`/category/${id}`, { category_type: categoryType });
  return data.data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/category/${id}`);
  return data.data;
}
