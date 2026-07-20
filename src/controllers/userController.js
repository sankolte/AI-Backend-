// sara user ka logic here - Clerk handles auth, we handle profile data
import prisma from "../../DB/db.config.js";
import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/expressError.js";


// get current logged-in user's profile (uses clerkId from JWT)
export const getCurrentUser = wrapAsync(async (req, res) => {
    const clerkId = req.clerkId; // set by authMiddleware

    const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { chats: true }, // also fetch their chats
    });

    if (!user) {
        throw new ExpressError(404, "User not found in database");
    }

    res.json(user);
});


// create a new user in db (called from frontend after Clerk signup)
export const createUser = wrapAsync(async (req, res) => {
    const { clerkId, name, email } = req.body;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { clerkId },
    });

    if (existingUser) {
        return res.status(200).json({ message: "User already exists", user: existingUser });
    }

    const user = await prisma.user.create({
        data: { clerkId, name, email },
    });

    res.status(201).json({ message: "User created successfully", user });
});


// find a particular user by id
export const perticularUser = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const oneUser = await prisma.user.findUnique({
        where: { id },
        include: { chats: true },
    });

    if (!oneUser) {
        throw new ExpressError(404, "User not found");
    }

    res.json(oneUser);
});


// update a user profile (name/email only - Clerk handles password)
export const updateUser = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, email },
    });

    res.json({ message: "User updated successfully", user: updatedUser });
});


// delete a user profile
export const deleteUser = wrapAsync(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await prisma.user.delete({
        where: { id },
    });

    console.log(`User deleted: ${deletedUser.email}`);
    res.json({ message: "User deleted successfully" });
});
