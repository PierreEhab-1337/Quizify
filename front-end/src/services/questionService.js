import api from "./api";

// يرجّع الأسئلة، مع فلاتر اختيارية: category, question_type, search
export async function getQuestions(filters = {}) {
  try {
    const { data } = await api.get("/question", { params: filters });
    return data.data; // array of { question_id, description, question_type, tags, images, choices }
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}

// يرجّع كل الأسئلة (متاح لأي مستخدم مسجّل دخول)
export async function getAllQuestions() {
  return getQuestions();
}

// يرجّع سؤال واحد بالتفصيل
export async function getQuestionById(id) {
  const { data } = await api.get(`/question/${id}`);
  return data.data;
}

export async function createQuestion(payload) {
  const { data } = await api.post("/question", payload);
  return data.data;
}

// ملحوظة: إرسال tags بيستبدل كل تصنيفات السؤال الحالية بالكامل
export async function updateQuestion(id, payload) {
  const { data } = await api.patch(`/question/${id}`, payload);
  return data.data;
}

export async function deleteQuestion(id) {
  const { data } = await api.delete(`/question/${id}`);
  return data.data;
}

