import db from '../config/db.js'
import {QUESTION_STATUS} from '../constants.js'

export const getAllContestsForAdmin = async (req, res) => {
    const result = await db.query(
        `SELECT C.*, COUNT(QC.question_id) AS totalQuestions FROM contest C
        LEFT JOIN question_contest QC ON C.contest_id = QC.contest_id
        GROUP BY C.contest_id
        `);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "No contests created yet!"
        });
    
    res.status(200).json({
        success : true,
        message : "All Contests Retrieved Successfully",
        data : result.rows
    });
}

export const getAllContests = async (req, res) => {
    const {userId} = req.user;

    const result = await db.query(`
        SELECT C.*, COUNT(QC.question_id) AS totalQuestions FROM contest C
        LEFT JOIN question_contest QC ON C.contest_id = QC.contest_id
        WHERE user_id = $1
        GROUP BY C.contest_id
    `, [userId]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "No contests created yet!"
        });
    
    res.status(200).json({
        success : true,
        message : "All Contests Retrieved Successfully",
        data : result.rows
    });
}

export const getContest = async (req, res) => {
    const {id} = req.params;
    const { userId, role } = req.user;
    const isAdmin = role === 'admin';

    const result = await db.query(`
        SELECT C.*, COUNT(QC.question_id) AS totalQuestions FROM contest C
        LEFT JOIN question_contest QC ON C.contest_id = QC.contest_id
        WHERE C.user_id = $1 AND (C.contest_id = $2 OR $3 = true)
        GROUP BY C.contest_id
    `, [userId, id, isAdmin]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Contest Not Found!"
        });
    
    res.status(200).json({
        success : true,
        message : "Contest Retrieved Successfully",
        data : result.rows[0]
    });
}

export const createContest = async (req, res) => {
    const {userId} = req.user;
    const {contest_name} = req.body;

    if(contest_name === undefined)
        return res.status(400).json({
            success : false,
            message: "Fill missing field!"
        });
    if(!contest_name.trim())
        return res.status(400).json({
            success : false,
            message: "Must be non-empty string"
        });
    
    const result = await db.query(
        `INSERT INTO contest(contest_name, status, user_id) VALUES($1, $2, $3) RETURNING *` ,
    [contest_name, "saved", userId]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Failed to Create Contest"
        });
    
    res.status(201).json({
        success : true,
        message : "Contest Created Successfully",
        data : result.rows[0]
    });
}

//I didn't check if the user updating the contest is updating his own contest only
//because the GET function only shows user's own contests 
export const updateContest = async (req, res) => {
    const {id} = req.params;
    const {contest_name} = req.body;

    if(contest_name === undefined)
        return res.status(400).json({
            success : false,
            message: "Fill missing field!"
        });
    if(!contest_name.trim())
        return res.status(400).json({
            success : false,
            message: "Must be non-empty string"
        });
    
    const result = await db.query(
        `UPDATE contest SET contest_name = $1 WHERE contest_id = $2 RETURNING *` ,
    [contest_name, id]);
    
    res.status(200).json({
        success : true,
        message : "Contest Updated Successfully",
        data : result.rows[0]
    });
}

export const removeContest = async (req, res) => {
    const {id} = req.params;

    const result = await db.query(`
        DELETE FROM contest WHERE contest_id = $1 RETURNING *`, [id]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Contest Not Found!"
        });
    
    res.status(200).json({
        success : true,
        message : "Contest Removed Successfully",
        data : result.rows[0]
    });
}

export const addQuestionToContest = async (req, res) => {
    const {contest_id, question_id} = req.params;
    const {question_order} = req.body;

    const result = await db.query(`
        INSERT INTO question_contest(contest_id, question_id, status, question_order) VALUES ($1, $2, $3, $4)`,
    [contest_id, question_id, "pending", question_order]);

    res.status(200).json({
        success : true,
        message : "Question Added to Contest Successfully",
        data: []
    });
}

export const removeQuestionFromContest = async (req, res) => {
    const {contest_id, question_id} = req.params;
    const result = await db.query(`
        DELETE FROM question_contest WHERE contest_id = $1 AND question_id = $2`,
    [contest_id, question_id]);

    if(result.rowCount === 0)
        return res.status(404).json({ success: false, message: "Contest or Question Not Found" });

    res.status(200).json({
        success : true,
        message : "Question Removed from Contest Successfully",
        data: []
    });
}

export const updateQuestionOrder = async (req, res) => {
    const {contest_id, question_id} = req.params;
    const {question_order} = req.body;

    if(!Number.isInteger(question_order))
        return res.status(400).json({
            success: false,
            message : "Question Order must be an Integer"
        });

    const result = await db.query(
        `UPDATE question_contest SET question_order = $1 WHERE question_id = $2 AND contest_id = $3 RETURNING *`,
        [question_order, question_id, contest_id]
    );

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Question or Category Not Found!"
        });

    res.status(200).json({
        success : true,
        message : "Question Updated Successfully",
        data: result.rows[0]
    });
}

export const getQuestionsOfContest = async (req, res) => {
    const {id} = req.params;
    const result = await db.query(
        `SELECT Q.question_id, Q.description, Q.question_type, U.question_order, U.status,

        (SELECT json_agg(
            json_build_object(
                'category_id', C2.category_id,
                'category_type', C2.category_type
            )
        )
        FROM question_category QC
        JOIN category C2 ON C2.category_id = QC.category_id
        WHERE QC.question_id = Q.question_id) AS tags,

        (SELECT json_agg(I.image_path)
        FROM question_image I
        WHERE I.question_id = Q.question_id) AS images,

        (SELECT json_agg(
        json_build_object(
            'choice_number', C.choice_number,
            'status', C.status,
            'description', C.description,
            'image_path', C.image_path
        ) ORDER BY C.choice_number)
        FROM choice C WHERE C.question_id = Q.question_id) AS choices

        FROM question AS Q
        LEFT JOIN question_contest AS U ON Q.question_id = U.question_id
        WHERE U.contest_id = $1
        ORDER BY U.question_order
        ;`, [id])

    if(result.rowCount === 0)
        return res.status(404).json({
            success : false,
            message : "No Questions Added Yet!",
        });

    res.status(200).json({
        success : true,
        message : "Questions Retrieved from Contest Successfully",
        data: result.rows
    });
}

export const getSingleQuestionOfContest = async (req, res) => {
    const { contest_id, question_id } = req.params;

    const result = await db.query(
        `SELECT Q.question_id, Q.description, Q.question_type, U.question_order, U.status,

        (SELECT json_agg(
            json_build_object(
                'category_id', C2.category_id,
                'category_type', C2.category_type
            )
        )
        FROM question_category QC
        JOIN category C2 ON C2.category_id = QC.category_id
        WHERE QC.question_id = Q.question_id) AS tags,

        (SELECT json_agg(I.image_path)
        FROM question_image I
        WHERE I.question_id = Q.question_id) AS images,

        (SELECT json_agg(
        json_build_object(
            'choice_number', C.choice_number,
            'status', C.status,
            'description', C.description,
            'image_path', C.image_path
        ) ORDER BY C.choice_number)
        FROM choice C WHERE C.question_id = Q.question_id) AS choices

        FROM question AS Q
        JOIN question_contest AS U ON Q.question_id = U.question_id
        WHERE U.contest_id = $1 AND U.question_id = $2;`,
        [contest_id, question_id]
    );

    if (!result.rowCount)
        return res.status(404).json({
            success: false,
            message: "Question Not Found in this Contest!"
        });

    res.status(200).json({
        success: true,
        message: "Question Retrieved Successfully",
        data: result.rows[0]
    });
};

export const startContest = async (req, res) => {
    const {id} = req.params;

    const contestCheck = await db.query(`SELECT status FROM contest WHERE contest_id = $1`, [id]);
    if (!contestCheck.rowCount)
        return res.status(404).json({ success: false, message: "Contest Not Found!" });

    const currentStatus = contestCheck.rows[0].status;

    //Checking that the contest is not in progress
    if (currentStatus === "inProgress")
        return res.status(400).json({
            success: false,
            message: `Cannot start a contest with status '${currentStatus}'`
        });

    const result = await db.query(
        `UPDATE contest SET status = $1 WHERE contest_id = $2 RETURNING * `,
        ["inProgress", id]
    )

    res.status(200).json({
        success : true,
        message : "Contest has started",
        data: result.rows[0]
    });
}

export const answerQuestion = async (req, res) => {
    const {contest_id, question_id} = req.params;
    const {status} = req.body;

    if(!QUESTION_STATUS.includes(status))
        return res.status(400).json({
            success : false,
            message: "No such Question Status"
        });

    const statusCode = await db.query(
        `SELECT status FROM contest WHERE contest_id = $1`,
        [contest_id]
    )

    if(statusCode.rows[0]?.status !== "inProgress")
        return res.status(400).json({
            success : false,
            message : "You must start the contest to answer"
        });

    const updateResult = await db.query(
        `UPDATE question_contest SET status = $1 WHERE question_id = $2 AND contest_id = $3 RETURNING *`,
        [status, question_id, contest_id]
    );

    if (!updateResult.rowCount)
        return res.status(404).json({ success: false, message: "Question not found in this contest" });

    const correctQuestions = await db.query(
        `SELECT COUNT(*) AS totalscore  FROM question_contest WHERE contest_id = $1 AND status = $2 `,
        [contest_id, "correct"]
    )

    res.status(200).json({
        success : true,
        message : "Question Status Updated",
        data: correctQuestions.rows[0]
    });
}

export const endContest = async (req, res) => {
    const {id} = req.params;

    const contestCheck = await db.query(`SELECT status FROM contest WHERE contest_id = $1`, [id]);
    if (!contestCheck.rowCount)
        return res.status(404).json({ success: false, message: "Contest Not Found!" });

    //End a contest only if it is in progress
    if (contestCheck.rows[0].status !== "inProgress")
        return res.status(400).json({
            success: false,
            message: `Cannot finish a contest with status '${contestCheck.rows[0].status}'`
        });

    const result = await db.query(
        `UPDATE contest SET status = $1 WHERE contest_id = $2 RETURNING * `,
        ["completed", id]
    )

    const score = await db.query(
        `SELECT COUNT(*) AS correctAnswer  FROM question_contest WHERE contest_id = $1 AND status = $2 `,
        [id, "correct"]
    )

    const totalResult = await db.query(
        `SELECT COUNT(*) AS totalQuestions FROM question_contest WHERE contest_id = $1`,
        [id]
    );

    const updateResult = await db.query(
        `UPDATE question_contest SET status = $1 WHERE contest_id = $2 RETURNING *`,
        ["pending", id]
    );

    res.status(200).json({
        success : true,
        message : "Contest has ended",
         
        data :
        {
            data : result.rows[0],
            score: score.rows[0]?.correctanswer,
            totalQuestions: totalResult.rows[0]?.totalquestions
        }
    });
}

// export const getLeastFrequentlyUsedQuestions = async (req, res) => {

// }

export const addQuestionsToContestRandomly = async (req, res) => {
    const {Question_Count} = req.body;
    const {id} = req.params;

    if(!Number.isInteger(Question_Count))
        return res.status(400).json({
            success: false,
            message : "Question Count must be an Integer"
        });

    const select = await db.query(
        'SELECT question_id FROM question ORDER BY RANDOM() LIMIT $1', [Question_Count]
    )

    if (select.rows.length < Question_Count)
    return res.status(400).json({
        success: false,
        message: "Not enough questions available."
    });
    
    await db.withTransaction(async (client) => {
        await client.query('DELETE FROM question_contest WHERE contest_id = $1', [id]);
        for (let x = 0; x < Question_Count; x++) {
            await client.query(
                `INSERT INTO question_contest(contest_id, question_id, status, question_order) VALUES ($1, $2, $3, $4)`,
                [id, select.rows[x].question_id, "pending", x + 1]
            );
        }
    });

    res.status(200).json({
        success : true,
        message : "Question Added to Contest Successfully",
        data: []
    });
    
}