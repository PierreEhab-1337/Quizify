import express from "express"
import userRoute from "./routes/userRoute.js"
import errorHandler from "./middleware/errorHandler.js"
const app = express();

app.use(express.json())
app.use("/users",userRoute);


app.use(errorHandler);
app.get("/", (req, res) => {
  res.send("Backend running");
});

export default app;