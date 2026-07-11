import express from "express"
import cors from "cors"
import userRoute from "./routes/userRoute.js"
import authRoute from "./routes/authRoute.js"
import questionRoute from "./routes/questionRoute.js"
import categoryRoute from "./routes/categoryRoute.js"
import contestRouter from './routes/contestRoute.js'
import errorHandler from "./middleware/errorHandler.js"
const app = express();

app.use(cors());
app.use(express.json());
app.use("/users",userRoute);
app.use("/auth", authRoute);
app.use("/question", questionRoute);
app.use("/category", categoryRoute)
app.use("/contest", contestRouter);

app.use(errorHandler);
app.get("/", (req, res) => {
  res.send("Backend running");
});

export default app;