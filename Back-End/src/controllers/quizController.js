import db from "../config/db.js";

export const testDatabase = async (req, res) => {

    try {

        const result = await db.query("SELECT NOW();");

        res.json(result.rows);

    } catch (err) {

        console.log(err);
        res.status(500).json({ message: "Database error", error: err.message });
    }

};