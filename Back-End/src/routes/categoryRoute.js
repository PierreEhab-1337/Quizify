import express from "express"
import {getCategory, getCategories, createCategory, removeCategory, updateCategory} from "../controllers/categoryController.js"
import asyncHandler from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js";

const router = express.Router();

const allowed_roles = ["admin", "moderator"]

router.get('/', authMiddleware, asyncHandler(getCategories));
router.get('/:id', authMiddleware, asyncHandler(getCategory));
router.post('/', authMiddleware, authorizeRole(...allowed_roles), asyncHandler(createCategory));
router.patch('/:id', authMiddleware, authorizeRole(...allowed_roles), asyncHandler(updateCategory));
router.delete('/:id', authMiddleware, authorizeRole("admin"), asyncHandler(removeCategory));

export default router;