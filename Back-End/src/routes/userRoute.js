import express from "express"
import {getUser,createUser,removeUser,getAllUsers,updateUser} from "../controllers/userController.js"
import asyncHandler from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js"
const router = express.Router();

router.get('/:id', authMiddleware, asyncHandler(getUser) );
router.get('/', authMiddleware, authorizeRole("admin"), asyncHandler(getAllUsers))
router.post('/login', asyncHandler(createUser));
router.delete('/:id', authMiddleware, authorizeRole("admin"), asyncHandler(removeUser) )
router.patch('/:id', authMiddleware, asyncHandler(updateUser))

export default router;
