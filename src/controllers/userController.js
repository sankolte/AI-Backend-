// sara user ka logic here
import prisma from "../../DB/db.config";
import wrapAsync from "../utils/wrapAsync.js";



export const regesterUser = wrapAsync(async (req,res)=>{
    let {name , email , password} = req.body;
    const user = await prisma.user.create({
        data : {
            name,
            email,
            password
        }
    })
    res.status(201).json({message:"user regestered successfully"})
})


export const perticularUser = wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const oneUser = await prisma.user.findUnique({
        where:{
            id:id
        }})
    res.send(oneUser);
})


export const updateUser = wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let {name,email} = req.body;
    const updatedUser = await prisma.user.update({
        where:{
            id:id
        },
        data:{
            name:name,
            email:email
        }
    })
    res.send(updatedUser);
})



export const deleteUser = wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const deletedUser = await prisma.user.delete({
        where:{
            id:id
        }
    })
    console.log(`user deleted : ${deleteUser}`);
    res.send("user is deleted ");
})
