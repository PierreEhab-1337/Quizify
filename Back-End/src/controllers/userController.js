import db from "../config/db.js"
import validator from "validator"
import { SAFE_USER_FIELDS } from "../constants.js"; 

export const getAllUsers = async (req,res) => {
    const result = await db.query(
        `SELECT ${SAFE_USER_FIELDS} from users;`
    );
    res.status(200).json({
        success : true,
        message : "Users Retrieved Successfully",
        data : result.rows
    });
};

export const getUser = async (req,res) => {
    const user_id = req.user.userId;

    const result = await db.query(
        `SELECT ${SAFE_USER_FIELDS}  FROM users WHERE user_id = $1`,
        [user_id]
    );
    if(result.rowCount == 0)
        return res.status(404).json({
            success : false,
            message: "User Not Found"
        })

    res.status(200).json({
        success : true,
        message : "User Retrieved Successfully",
        data : result.rows[0]
    });
}

export const updateUser = async (req,res) =>{
    let id;
    
    if(req.params.id)
        id = req.params.id;
    else
        id = req.user.userId;

    const {username, email} = req.body;

    const updates = [];
    const values = [];

    if(username === undefined && email === undefined ) // Executes when all inputs are empty only
        return res.status(400).json({
            success : false,
            message: "Fill missing fields!"
        });

    if (username !== undefined) {
        if (typeof username !== "string" || !username.trim()) {
            return res.status(400).json({
            success : false,
            message: "Username must be a non-empty string"
        });
        }
        values.push(username);
        updates.push(`username = $${values.length} `);
    }

    if(email !== undefined){
        if(typeof email !== "string" || !email.trim())
             return res.status(400).json({
            success : false,
            message: "Email must be a non-empty string"
        });
        if(!validator.isEmail(email))
            return res.status(400).json({
                success : false,
                message: "Invalid Email!"
            });
        values.push(email);
        updates.push(`email = $${values.length}`);
    }

    values.push(id);

    if(req.user.userId !== id && req.user.role !== "admin")
        return res.status(403).json({
            success : false,
            message: "You can only update your account"
        });
    
    const result = await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${values.length} RETURNING user_id,username,email,role`,
        values
    );

    if(result.rowCount === 0)
        return res.status(404).json({
            success : false,
            message: "User Not Found"
        });

    res.status(200).json({
        success : true,
        message : "User Updated Successfully",
        data : result.rows[0]
    });

}

export const removeUser = async (req,res) => {
    const {id} = req.params;

    const result = await db.query(
        `DELETE FROM users WHERE user_id = $1 RETURNING ${SAFE_USER_FIELDS}`,
        [id]
    )

    if(result.rowCount == 0)
        return res.status(404).json({
            success : false,
            message: "User Not Found"});

    res.status(200).json({
        success : true,
        message : "User Removed Successfully",
        data : result.rows[0]
    });
}