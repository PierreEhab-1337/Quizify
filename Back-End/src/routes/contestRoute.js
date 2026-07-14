import express from 'express';
import {getAllContests, getAllContestsForAdmin,
        getContest, updateContest, 
        createContest, removeContest, getQuestionsOfContest,
        addQuestionToContest, updateQuestionOrder, removeQuestionFromContest,
        startContest, answerQuestion, endContest, addQuestionsToContestRandomly, getSingleQuestionOfContest} from '../controllers/contestController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import authorizeRole from '../middleware/authorizeRole.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/admin', authMiddleware, authorizeRole("admin"), asyncHandler(getAllContestsForAdmin));

router.get('/mycontests', authMiddleware, asyncHandler(getAllContests));
router.post('/mycontests', authMiddleware, asyncHandler(createContest));
router.get('/mycontests/:id', authMiddleware, asyncHandler(getContest));
router.patch('/mycontests/:id', authMiddleware, asyncHandler(updateContest));
router.delete('/mycontests/:id', authMiddleware, asyncHandler(removeContest));

router.get('/mycontests/:id/questions', authMiddleware, asyncHandler(getQuestionsOfContest));
router.get('/mycontests/:contest_id/questions/:question_id', authMiddleware, asyncHandler(getSingleQuestionOfContest));

router.post('/mycontests/:id/questions/random', authMiddleware, asyncHandler(addQuestionsToContestRandomly));
router.post('/mycontests/:contest_id/questions/:question_id', authMiddleware, asyncHandler(addQuestionToContest));
router.patch('/mycontests/:contest_id/questions/:question_id', authMiddleware, asyncHandler(updateQuestionOrder));
router.delete('/mycontests/:contest_id/questions/:question_id', authMiddleware, asyncHandler(removeQuestionFromContest));

router.patch('/mycontests/:id/start', authMiddleware, asyncHandler(startContest));
router.patch('/mycontests/:contest_id/questions/:question_id/answer', authMiddleware, asyncHandler(answerQuestion));
router.patch('/mycontests/:id/finish', authMiddleware, asyncHandler(endContest));




export default router;