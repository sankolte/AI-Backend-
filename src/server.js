import express from "express";
import "dotenv/config"

import ExpressError from "./utils/expressError.js";

import userRoute from "./routes/userRoute.js";
const app = express();
app.use(express.json());
const port = process.env.port || 3000



app.get("/api/health", (req, res) => {
    res.json({ status: 200, msg: "sab thik he ab tak" })
})


// user routes ka prefix
app.use("/api/user",userRoute)








//page not fouund wala error ke liye ek middleqware  > exception 

app.use((req,res,next)=>{
    next(new ExpressError(404,"page not found"));   
    //throw new ExpressError(404, "Not Found");  u can also use throw instead of next() 
})

// gloabal error handler > sab idahr ayaege kuch bhi bacckchodi ho >>
app.use((err,req,res,next)=>{
    let {statusCode,message} = err;
    if (!statusCode){
        statusCode = 500;
        message = "internal server error";
    }

    res.status(statusCode).json({message,statusCode})
})


app.listen(port, () => {
    console.log("server is running on port no 3000");
})