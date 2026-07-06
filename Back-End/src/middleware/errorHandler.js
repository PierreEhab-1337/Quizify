export default function (err,req,res,next){
    console.error(err);

    if (err.code === "23505") {
        return res.status(409).json({ 
            success : false,
            message: "Email already exists." });
    }

    if (err.code === "23503") {
        return res.status(400).json({ 
            success : false,
            message: "Foreign key constraint failed." });
    }
    
    res.status(500).json({
        success : false,
        message:"Internal Server Error"});
}