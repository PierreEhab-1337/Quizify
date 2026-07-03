import express from "express"
import userRoute from "./routes/userRoute.js"
import authRoute from "./routes/authRoute.js"
import errorHandler from "./middleware/errorHandler.js"
const app = express();

app.use(express.json());
app.use("/users",userRoute);
app.use("/auth", authRoute);

app.use(errorHandler);
app.get("/", (req, res) => {
  res.send("Backend running");
});

export default app;