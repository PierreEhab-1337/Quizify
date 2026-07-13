import api from "./api";

// ════════════════════════════════════════════════════════════
// هذا الملف يحل محل النسختين القديمتين contestService.js و
// contestService (2).js — امسح أي نسخة تانية غير دي من المشروع.
// ════════════════════════════════════════════════════════════

// كل مسابقات المستخدم الحالي
export async function getMyContests() {
  const { data } = await api.get("/contest/mycontests");
  return data.data;
}

export async function getContestById(id) {
  const { data } = await api.get(`/contest/mycontests/${id}`);
  return data.data;
}

// إنشاء مسابقة جديدة (الباك اند بياخد الاسم بس — بتتعمل status: saved مباشرة)
export async function createContest(contestName) {
  const { data } = await api.post("/contest/mycontests", {
    contest_name: contestName,
  });
  return data.data;
}

export async function renameContest(id, contestName) {
  const { data } = await api.patch(`/contest/mycontests/${id}`, {
    contest_name: contestName,
  });
  return data.data;
}

export async function deleteContest(id) {
  const { data } = await api.delete(`/contest/mycontests/${id}`);
  return data.data;
}

// draft/saved/completed → inProgress (بيسمح كمان بإعادة تشغيل completed)
export async function startContest(id) {
  const { data } = await api.patch(`/contest/mycontests/${id}/start`);
  return data.data;
}

// inProgress → completed
export async function finishContest(id) {
  const { data } = await api.patch(`/contest/mycontests/${id}/finish`);
  return data.data; // { data: contest, score, totalQuestions }
}

// ── أسئلة المسابقة ──────────────────────────────────────────

export async function getContestQuestions(id) {
  const { data } = await api.get(`/contest/mycontests/${id}/questions`);
  return data.data; // مرتبة بـ question_order، كل سؤال معاه status: pending/correct/wrong
}

export async function getContestQuestion(contestId, questionId) {
  const { data } = await api.get(`/contest/mycontests/${contestId}/questions/${questionId}`);
  return data.data;
}

// اختيار عشوائي — بيستبدل قائمة أسئلة المسابقة بالكامل بعدد Question_Count سؤال عشوائي
export async function randomFillContest(contestId, questionCount) {
  const { data } = await api.post(`/contest/mycontests/${contestId}/questions/random`, {
    Question_Count: questionCount,
  });
  return data.data;
}

// إضافة سؤال واحد يدوياً للمسابقة فى ترتيب معين
export async function addQuestionToContest(contestId, questionId, questionOrder) {
  const { data } = await api.post(
    `/contest/mycontests/${contestId}/questions/${questionId}`,
    { question_order: questionOrder }
  );
  return data.data;
}

// تعديل ترتيب سؤال داخل المسابقة
export async function updateQuestionOrder(contestId, questionId, questionOrder) {
  const { data } = await api.patch(
    `/contest/mycontests/${contestId}/questions/${questionId}`,
    { question_order: questionOrder }
  );
  return data.data;
}

// حذف سؤال من المسابقة
export async function removeQuestionFromContest(contestId, questionId) {
  const { data } = await api.delete(`/contest/mycontests/${contestId}/questions/${questionId}`);
  return data.data;
}

// تسجيل إجابة سؤال أثناء مسابقة inProgress
export async function answerContestQuestion(contestId, questionId, status) {
  const { data } = await api.patch(
    `/contest/mycontests/${contestId}/questions/${questionId}/answer`,
    { status }
  );
  return data.data;
}

// ── أدمن فقط ─────────────────────────────────────────────────

// كل المسابقات من كل المستخدمين — أدمن بس
// ملحوظة: الباك اند بيرجّع 404 لو مفيش مسابقات خالص، فده بيتعامل معاه هنا
// كـ قائمة فاضية بدل ما يترمي كـ error.
export async function getAllContestsAdmin() {
  try {
    const { data } = await api.get("/contest/admin");
    return data.data;
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
}
