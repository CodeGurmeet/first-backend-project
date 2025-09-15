import dotenv from "dotenv";
dotenv.config( {path : "./.env"} );
import { app } from "./app.js";
import  connectDB  from "./db/index.js"

connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log("Error :", error);
        throw error;
    })
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`Server is listening on port ${process.env.PORT || 4000}`);
    })
})
.catch((err)=>{
    console.log("Database connection FAILED !!", err);
    throw err
})

// An appraoch to connect the DB 
/*
import express from "express"
const app =  express()

;( async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`/`${DB_NAME}`); 
        app.on("error", (error)=>{
            console.log("error", error)
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("Error : ", error);
        throw error;
    }
} )()  // IIFE
*/