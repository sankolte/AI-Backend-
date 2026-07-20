import { createUserSchema, updateUserSchema } from "../schema/user.schema.js";
import ExpressError from "../utils/expressError.js";

// validate data for creating a new user
function validateCreateUser(req, res, next) {
    const result = createUserSchema.safeParse(req.body);

    if (result.error) {
        throw new ExpressError(400, result.error.message);
    }

    next();
}

// validate data for updating user profile
function validateUpdateUser(req, res, next) {
    const result = updateUserSchema.safeParse(req.body);

    if (result.error) {
        throw new ExpressError(400, result.error.message);
    }

    next();
}

export { validateCreateUser, validateUpdateUser };
