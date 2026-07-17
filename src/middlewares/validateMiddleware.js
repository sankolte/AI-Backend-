import userSchema from "../schema/user.schema.js";
import ExpressError from "../utils/expressError.js";

function validateUser(req,res,next){

    const result = userSchema.safeParse(req.body);   // bascially this will validate 

    if(result.error){
        throw new ExpressError(400,result.error.message);
    }

    next();
    
}

export default validateUser;

