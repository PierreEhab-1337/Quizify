import express from "express"
import {getUser,createUser} from "../controllers/userController.js"
import asyncHandler from "../utils/asyncHandler.js";
const router = express.Router();

router.get('/:id', asyncHandler(getUser) );
router.post('/login',asyncHandler(createUser));

export default router;
