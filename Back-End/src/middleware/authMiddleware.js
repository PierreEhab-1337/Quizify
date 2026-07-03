import JWT from "jsonwebtoken"
export default (req,res,next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader)
        return res.status(401).json({message : "Unauthorized Access"});
    const hasBearer = authHeader.startsWith("Bearer ");
    if(!hasBearer)
        return res.status(401).json({message : "Unauthorized Access"});

    const token = authHeader.split(" ")[1];

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}