import api from "./api";

// يرجّع كل الأسئلة (متاح لأي مستخدم مسجّل دخول)
export async function getAllQuestions() {
  const { data } = await api.get("/question");
  return data.data; // array of { question_id, description, question_type, username, tags, images }
}

// يرجّع سؤال واحد بالتفصيل
export async function getQuestionById(id) {
  const { data } = await api.get(`/question/${id}`);
  return data.data;
}
