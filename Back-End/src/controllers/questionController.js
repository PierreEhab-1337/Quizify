import db from "../config/db.js"
import { QUESTION_TYPES } from "../constants.js";

export const getAllQuestions = async (req, res) => {
    const { category, question_type, search } = req.query;

    const values = [];
    const conditions = [];

    if (category !== undefined) {
        values.push(category);
        conditions.push(`
            EXISTS (
                SELECT 1 FROM question_category QC
                JOIN category CAT ON CAT.category_id = QC.category_id
                WHERE QC.question_id = Q.question_id
                AND CAT.category_type = $${values.length}
            )
        `);
    }

    if (question_type !== undefined) {
        values.push(question_type);
        conditions.push(`Q.question_type = $${values.length}`);
    }

    if (search !== undefined && search.trim() !== '') {
        values.push(`%${search.trim()}%`);
        conditions.push(`Q.description ILIKE $${values.length}`);
    }

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await db.query(
        `SELECT Q.question_id, Q.description, Q.question_type, U.username,

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
        LEFT JOIN users AS U ON Q.user_id = U.user_id
        ${whereClause};`,
        values
    );

    res.status(200).json({
        success: true,
        message: "All questions have been retrieved successfully!",
        data: result.rows
    });
};

export const getQuestion = async (req,res) => {
    const {id} = req.params;

    const result = await db.query(
        `SELECT Q.question_id, Q.description, Q.question_type, U.username,

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
        LEFT JOIN users AS U ON Q.user_id = U.user_id
        WHERE Q.question_id = $1;`,
        [id]
    );

    if(result.rowCount === 0)
        return res.status(404).json({
            success : false,
            message : "Question Not Found!"
        });

    res.status(200).json({
        success : true,
        message : "Question found successfully!",
        data : result.rows[0]
    });
}

export const createQuestion = async (req, res, next) => {
    const {description, question_type, tags, choices} = req.body;
    const user_id = req.user.userId;
    if(description === undefined || question_type === undefined || !description.trim() || choices === undefined)
        return res.status(400).json({
            success : false,
            message: "Fill missing fields!"
        });

    if(!QUESTION_TYPES.includes(question_type))
        return res.status(400).json({
            success : false,
            message: "No such Question Type"
        });
    
    if((question_type === "singleChoice" || question_type === "multiChoice") && choices.length < 2)
        return res.status(400).json({
            success : false,
            message: "There should be at least 2 choices"
        });
    
    if(question_type === "openEnded" && choices.length > 0)
        return res.status(400).json({
            success : false,
            message: "Open ended questions must have no choices"
        });

    let correctChoicesCount = 0;
    if(question_type !== "openEnded"){
        choices.forEach(choice => {
            if(choice.status)
                correctChoicesCount++;
        });
        if(!correctChoicesCount)
            return res.status(400).json({
            success : false,
            message: "There must be at least one correct choice"
        });
        if(question_type === "singleChoice" && correctChoicesCount > 1)
            return res.status(400).json({
            success : false,
            message: "Single choice questions must have one right choice only"
        });
    }



    const FINALDATA = await db.withTransaction(async (client) =>{
        const insertQuestionQuery = await client.query(
        `INSERT INTO question(user_id, description, question_type) VALUES ($1, $2, $3) RETURNING question_id`,
        [user_id, description, question_type]
        )

        const {question_id} = insertQuestionQuery.rows[0];

        if(tags !== undefined){
            for(var x = 0; x < tags.length; x++){

                const categoryData = await client.query(
                    'SELECT category_id FROM category WHERE category_type = $1', [tags[x]]
                )

                if (categoryData.rowCount === 0) {
                    const err = new Error("Category Not Found!");
                    err.statusCode = 404;
                    err.type = "CATEGORY";
                    throw err;
                }

                const category_question_query = await client.query(
                    `INSERT INTO question_category(question_id, category_id) VALUES ($1, $2)`,
                    [question_id, categoryData.rows[0].category_id]
                )
            }
        }

        if(question_type !== "openEnded"){
            let x = 0;
            for (const choice of choices){
                x++;
                await client.query(
                    `INSERT INTO choice(question_id, choice_number, status, description) VALUES ($1, $2, $3, $4)`,
                    [question_id, x, choice.status, choice.description]
                )
            }
        }

        const finalResult = await client.query(
            `SELECT Q.question_id, Q.description, Q.question_type, U.username,

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
            LEFT JOIN users AS U ON Q.user_id = U.user_id
            WHERE Q.question_id = $1;`,
            [question_id]
        );

        return finalResult;
    })

    res.status(201).json({
        success : true,
        message: "Question Created Successfully",
        data : FINALDATA.rows[0]
    });
}

export const deleteQuestion = async (req,res) => {
    const {id} = req.params;

    const result = await db.query(
        `DELETE FROM question WHERE question_id = $1 RETURNING *`,
        [id]
    );

    if(!result.rowCount)
        return res.status(404).json({
            success : false,
            message: "Question Not Found!"
        });

    res.status(200).json({
        success : true,
        message: "Question removed Successfully",
        data : result.rows[0]
    });
}

export const updateQuestion = async (req,res) => {
    const {description, question_type, tags, choices} = req.body;
    const {id} = req.params;

    const updates = [];
    const values = [];


    if(description === undefined && question_type === undefined && tags === undefined && choices === undefined)
        return res.status(400).json({
                success:false,
                message: "Fill missing fields"
        })

    if(description !== undefined){
        if(!description.trim())
            return res.status(400).json({
                success:false,
                message: "Can't accept empty input"
        })
        values.push(description);
        updates.push(`description = $${values.length}`);
    }
    if(question_type !== undefined){
        if(!question_type.trim())
            return res.status(400).json({
                success:false,
                message: "Can't accept empty input"
        })
        if(!QUESTION_TYPES.includes(question_type))
            return res.status(400).json({
            success : false,
            message: "No such Question Type"
        });
        values.push(question_type);
        updates.push(`question_type = $${values.length}`);
    }


    if(question_type !== undefined && choices !== undefined){

        if(!Array.isArray(choices) || choices.length === 0)
            return res.status(400).json({
            success: false,
            message: "Can't accept empty input"
        })

        if((question_type === "singleChoice" || question_type === "multiChoice") && choices.length < 2)
            return res.status(400).json({
                success : false,
                message: "There should be at least 2 choices"
            });
        
        if(question_type === "openEnded" && choices.length > 0)
            return res.status(400).json({
                success : false,
                message: "Open ended questions must have no choices"
            });

        let correctChoicesCount = 0;
        if(question_type !== "openEnded"){
            choices.forEach(choice => {
                if(choice.status)
                    correctChoicesCount++;
            });
            if(!correctChoicesCount)
                return res.status(400).json({
                success : false,
                message: "There must be at least one correct choice"
            });
            if(question_type === "singleChoice" && correctChoicesCount > 1)
                return res.status(400).json({
                success : false,
                message: "Single choice questions must have one right choice only"
            });
        }
    }

    if(tags !== undefined){
        if(!Array.isArray(tags) || tags.length === 0)
                return res.status(400).json({
                    success:false,
                    message: "Can't accept empty input"
        })
    }

    const transactionResult = await db.withTransaction(async (client) => {
        if(description!== undefined || question_type !== undefined){
            values.push(id);

            const result = await client.query(
                `UPDATE question SET ${updates.join(', ')} WHERE question_id = $${values.length} RETURNING *`,
                values
            )
        }

        if(tags !== undefined){
            const result = await client.query(
                `DELETE FROM question_category WHERE question_id = $1`,
                [id]
            );
            
            for(var i = 0;i < tags.length;i++){

                const categoryData = await client.query(
                    'SELECT category_id FROM category WHERE category_type = $1', [tags[i]]
                )

                if (categoryData.rowCount === 0) {
                    const err = new Error("Category Not Found!");
                    err.statusCode = 404;
                    err.type = "CATEGORY";
                    throw err;
                }

                const category_question_query = await client.query(
                    `INSERT INTO question_category(question_id, category_id) VALUES ($1, $2)`,
                    [id, categoryData.rows[0].category_id]
                )
            }
        }

        if(choices !== undefined){
            await client.query(`DELETE FROM choice WHERE question_id = $1`, [id]);

            if(question_type !== "openEnded"){
                let x = 0;
                for (const choice of choices){
                    x++;
                    await client.query(
                        `INSERT INTO choice(question_id, choice_number, status, description) VALUES ($1, $2, $3, $4)`,
                        [id, x, choice.status, choice.description]
                    )
                }
            }
        }

        const finalResult = await client.query(
            `SELECT Q.question_id, Q.description, Q.question_type, U.username,

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
            LEFT JOIN users AS U ON Q.user_id = U.user_id
            WHERE Q.question_id = $1;`,
            [id]
        );

        return finalResult
    })

    
    res.status(200).json({
        success : true,
        message: "Question Updated Successfully",
        data : transactionResult.rows[0]
    });
}