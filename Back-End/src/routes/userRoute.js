import express from "express"
import {testDatabase} from "../controllers/quizController.js"
const router = express.Router();

router.get('/',testDatabase );

export default router;
