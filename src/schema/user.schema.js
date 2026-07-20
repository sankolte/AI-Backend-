import { z } from "zod";

// schema for creating user (from frontend after Clerk signup)
const createUserSchema = z.object({
    clerkId: z.string().min(1, "clerkId is required"),
    name: z.string().min(3).max(25),
    email: z.string().email(),
});

// schema for updating user profile (name/email only, no password)
const updateUserSchema = z.object({
    name: z.string().min(3).max(25).optional(),
    email: z.string().email().optional(),
});

export { createUserSchema, updateUserSchema };
