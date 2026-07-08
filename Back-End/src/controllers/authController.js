import validator from "validator"
import bcrypt, { hash } from "bcrypt"
import JWT from "jsonwebtoken"
import { SAFE_USER_FIELDS } from "../constants.js"
import db from "../config/db.js"

export const registerUser = async (req,res) => {
    const {username, email, password} = req.body; 

    if(username === undefined || email === undefined || password === undefined)
        return res.status(400).json({
            success : false,
            message: "Fill missing fields!"
        });

    if(typeof username !== "string" || typeof email !== "string" || typeof password !== "string" || !username.trim() || !email.trim() || !password.trim())
        return res.status(400).json({
            success : false,
            message: "Must be non-empty string"
        });

    if(!validator.isEmail(email))
        return res.status(400).json({
            success : false,
            message:"Enter a valid email!"
        });

    if(password.length < 8)
        return res.status(400).json({
            success : false,
            message: "Password must be at least 8 characters"
        });

    // const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
        `INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING ${SAFE_USER_FIELDS} `,
        [username, email, password]
    )

    res.status(201).json({
        success : true,
        message : "Registered Successfully",
        data : result.rows[0]
    });
}

export const loginUser = async (req,res) => {
    const {email, password} = req.body; 

    if(email === undefined || password === undefined)
        return res.status(400).json({
            success : false,
            message: "Fill missing fields!"
        });

    if(typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim())
        return res.status(400).json({
            success : false,
            message: "Must be non-empty string"
        });

    if(!validator.isEmail(email))
        return res.status(400).json({
            success : false,
            message:"Enter a valid email!"
        });

    if(password.length < 8)
        return res.status(400).json({
            success : false,
            message: "Password must be at least 8 characters"
        });

    const result = await db.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );

    if(result.rowCount === 0)
        return res.status(401).json({
            success : false,
            message:"Wrong Email or Password"
        });

    const user = result.rows[0]
    // const isCorrectPassword = await bcrypt.compare(password, user.password_hash);

    if(!(user.password_hash === password))
        return res.status(401).json({
            success : false,
            message:"Wrong Email or Password"
        });

    const token = JWT.sign(
        {
            userId: user.user_id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    res.status(200).json({
        success : true,
        message: "Logged in succefully!",
        token : token,
        data : {
            user_id : user.user_id,
            username : user.username,
            email : user.email,
            role: user.role
        }
    })
}