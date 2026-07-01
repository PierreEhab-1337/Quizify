import express from "express"
import userRoute from "./routes/userRoute.js"
const app = express();

app.use(express.json())
app.use("/test",userRoute);

app.get("/", (req, res) => {
  res.send("Backend running");
});

export default app;