export const SAFE_USER_FIELDS = "user_id, username, email, role, created_at";
export const UNSAFE_USER_FIELDS = "user_id, username, email, role, created_at, password_hash"
export const QUESTION_TYPES = ["singleChoice", "multiChoice", "openEnded"];
export const CONTEST_STATUS = ["completed", "draft", "saved", "inProgress"];
export const QUESTION_STATUS = ["correct", "wrong", "pending"];
export const ROLES = ["admin", "moderator", "user"]