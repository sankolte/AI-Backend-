import express from "express";
import "dotenv/config"
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import ExpressError from "./utils/expressError.js";

import userRoute from "./routes/userRoute.js";
import webhookRoute from "./routes/webhookRoute.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
const port = process.env.port || 3000


// CORS - allow frontend to call our API
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
}));

// Clerk webhook route MUST come before express.json() 
// because webhooks need the raw body for signature verification
app.use("/api/webhook", webhookRoute);

// parse JSON bodies for all other routes
app.use(express.json());

// Clerk middleware - attaches auth info to every request
app.use(clerkMiddleware());


// health check
app.get("/api/health", (req, res) => {
    res.json({ status: 200, msg: "sab thik he ab tak" })
})


// user routes
app.use("/api/user", userRoute)

// chat and message routes
app.use("/api/v1/chats", chatRoutes)





//page not fouund wala error ke liye ek middleqware  > exception 

app.use((req, res, next) => {
    next(new ExpressError(404, "page not found"));
    //throw new ExpressError(404, "Not Found");  u can also use throw instead of next() 
})

// gloabal error handler > sab idahr ayaege kuch bhi bacckchodi ho >>
app.use((err, req, res, next) => {
    console.error("Unhandled Backend Error:", err);
    let { statusCode, message } = err;
    if (!statusCode) {
        statusCode = 500;
        message = err.message || "internal server error";
    }

    res.status(statusCode).json({ message, statusCode });
});


app.listen(port, () => {
    console.log("server is running on port no 3000");
})