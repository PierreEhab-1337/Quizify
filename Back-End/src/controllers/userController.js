import db from "../config/db.js"
import validator from "validator"
import { SAFE_USER_FIELDS } from "../constants.js"; 

export const getAllUsers = async (req,res) => {
    const result = await db.query(
        `SELECT ${SAFE_USER_FIELDS} from users;`
    );
    res.status(200).json(result.rows)
};

export const getUser = async (req,res) => {
    const user_id = req.params.id

    if(req.user.userId !== user_id && req.user.role !== "admin")
        return res.status(403).json({message: "You can only retrieve your account"});

    const result = await db.query(
        `SELECT ${SAFE_USER_FIELDS}  FROM users WHERE user_id = $1`,
        [user_id]
    );
    if(result.rowCount == 0)
        res.status(404).json({message: "User Not Found"})
    res.status(200).json(result.rows[0])
}

export const createUser = async(req,res)=>{
    const {username, email, password_hash} = req.body;

    if(!username || !email || !password_hash)
        return res.status(400).json({message: "Fill missing fields!"});

    if(!validator.isEmail(email))
        return res.status(400).json({message: "Invalid Email!"});

    const result = await db.query(
        `INSERT INTO users (username,email,password_hash) VALUES($1,$2,$3) RETURNING user_id, username, email, role`,
        [username,email,password_hash]
    )

    res.status(201).json(result.rows[0])
}

export const updateUser = async (req,res) =>{
    const {id} = req.params;
    const {username, email} = req.body;

    const updates = [];
    const values = [];

    if(username === undefined && email === undefined )
        return res.status(400).json({message : "Fill missing fields!"});

    if (username !== undefined) {
        if (typeof username !== "string" || username.trim().length === 0) {
            return res.status(400).json({ message: "username must be a non-empty string" });
        }
        values.push(username);
        updates.push(`username = $${values.length} `);
    }

    if(email !== undefined){
        if(typeof email !== "string" || email.trim().length === 0)
            return res.status(400).json({ message: "email must be non-empty string" });
        if(!validator.isEmail(email))
            return res.status(400).json({message: "Invalid Email!"});
        values.push(email);
        updates.push(`email = $${values.length}`);
    }

    values.push(id);

    if(req.user.userId !== id && req.user.role !== "admin")
        return res.status(403).json({message: "You can only update your account"});
    
    const result = await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE user_id = $${values.length} RETURNING user_id,username,email,role`,
        values
    );

    if(result.rowCount === 0)
        return res.status(404).json({message: "User Not Found"});

    res.status(200).json(result.rows[0])

}

export const removeUser = async (req,res) => {
    const {id} = req.params;

    const result = await db.query(
        `DELETE FROM users WHERE user_id = $1 RETURNING ${SAFE_USER_FIELDS}`,
        [id]
    )

    if(result.rowCount == 0)
        return res.status(404).json({message: "User Not Found"});
    res.status(200).json(result.rows[0])
}