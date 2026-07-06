import express from "express"
import {getUser,removeUser,getAllUsers,updateUser} from "../controllers/userController.js"
import asyncHandler from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js"
const router = express.Router();

router.get('/myprofile/me', authMiddleware, asyncHandler(getUser) );
router.patch('/myprofile/me', authMiddleware, asyncHandler(updateUser))
router.get('/', authMiddleware, authorizeRole("admin"), asyncHandler(getAllUsers))
router.patch('/:id', authMiddleware, authorizeRole("admin"), asyncHandler(updateUser))
router.delete('/:id', authMiddleware, authorizeRole("admin"), asyncHandler(removeUser) )
export default router;
