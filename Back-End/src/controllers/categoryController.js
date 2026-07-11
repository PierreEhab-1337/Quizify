import db from "../config/db.js"

export const getCategories = async (req, res) => {
    const result = await db.query(`SELECT C.category_id, C.category_type, C.user_id, C.created_at,
        COUNT(QC.question_id) AS question_count
        FROM category C
        LEFT JOIN question_category AS QC on C.category_id = QC.category_id 
        GROUP BY C.category_id
        `);
    res.status(200).json({
        success : true,
        message : "Categories Retrieved Successfully",
        data : result.rows
    });
}

export const getCategory = async (req, res) => {
    const {id} = req.params;
    const result = await db.query(`SELECT C.category_id, C.category_type, C.user_id, C.created_at,
        COUNT(QC.question_id) AS question_count
        FROM category C
        LEFT JOIN question_category AS QC on C.category_id = QC.category_id 
        WHERE C.category_id = $1
        GROUP BY C.category_id
        `, [id]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Category Not Found!"
        });
    
    res.status(200).json({
        success : true,
        message : "Category Retrieved Successfully",
        data : result.rows[0]
    });
}

export const createCategory = async (req, res) => {
    const {category_type} = req.body;
    const {userId} = req.user;

    if(category_type === undefined)
        return res.status(400).json({
            success:false,
            message: "Fill missing field"
        })

    const result = await db.query(`
        INSERT INTO category (category_type, user_id) VALUES ($1, $2) RETURNING *`,
    [category_type, userId]);

    res.status(201).json({
        success : true,
        message : "Category created Successfully",
        data : result.rows[0]
    });

}

export const removeCategory = async (req, res) => {
    const {id} = req.params;
    const result = await db.query(`
        DELETE FROM category WHERE category_id = $1 RETURNING *`, [id]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Category Not Found!"
        });
    
    res.status(200).json({
        success : true,
        message : "Category removed Successfully",
        data : result.rows[0]
    });
}

export const updateCategory = async (req, res) => {
    const {id} = req.params;
    const {category_type} = req.body;

    if(category_type === undefined)
        return res.status(400).json({
            success:false,
            message: "Fill missing field"
        })

    const result = await db.query(`
        UPDATE category SET category_type = $1 WHERE category_id = $2 RETURNING *`, [category_type, id]);

    if(result.rowCount === 0)
        return res.status(404).json({
            success: false,
            message: "Category Not Found!"
        });
    
    res.status(200).json({
        success : true,
        message : "Category updated Successfully",
        data : result.rows[0]
    });
}