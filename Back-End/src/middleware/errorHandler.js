export default function (err,req,res,next){
    console.error(err);

    if (err.code === "23505") {
        return res.status(409).json({ 
            success : false,
            message: "Already exists." });
    }

    if (err.code === "23503") {
        return res.status(400).json({ 
            success : false,
            message: "Foreign key constraint failed." });
    }

    if(err.statusCode === 404 && err.type === "CATEGORY")
        return res.status(404).json({ 
            success : false,
            message: "Category Not Found!" });

    
    res.status(500).json({
        success : false,
        message:"Internal Server Error"});
}