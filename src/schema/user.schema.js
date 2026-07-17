import {z} from "zod";

const userSchema = z.object({
    name : z.string().min(3).max(25),
    email : z.string().email(),
    password : z.string().min(6).max(25)
})



export default userSchema
