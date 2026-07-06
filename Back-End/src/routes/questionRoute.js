import express from "express"
import {getAllQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion} from "../controllers/questionController.js"
import asyncHandler from "../utils/asyncHandler.js"
import authMiddleware from "../middleware/authMiddleware.js";
import role from "../middleware/authorizeRole.js"

const router = express.Router();

const allowed_roles = ["admin", "moderator"]

router.get('/', authMiddleware, asyncHandler(getAllQuestions));
router.get('/:id', authMiddleware, asyncHandler(getQuestion));
router.post('/',authMiddleware, role(...allowed_roles), asyncHandler(createQuestion));
router.patch('/:id', authMiddleware, role(...allowed_roles), asyncHandler(updateQuestion));
router.delete('/:id', authMiddleware, role(...allowed_roles), asyncHandler(deleteQuestion))
export default router;