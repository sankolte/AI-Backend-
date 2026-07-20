// User routes - all user CRUD operations
import express from "express";
import requireAuth from "../middlewares/authMiddleware.js";
import { validateCreateUser, validateUpdateUser } from "../middlewares/validateMiddleware.js";
import {
    getCurrentUser,
    createUser,
    perticularUser,
    updateUser,
    deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// POST /api/user - create user in our DB after Clerk signup
router.post("/", validateCreateUser, createUser);

// GET /api/user/me - get current logged-in user's profile (protected)
router.get("/me", requireAuth, getCurrentUser);

// GET /api/user/:id - get a specific user by id (protected)
router.get("/:id", requireAuth, perticularUser);

// PUT /api/user/:id - update user profile (protected)
router.put("/:id", requireAuth, validateUpdateUser, updateUser);

// DELETE /api/user/:id - delete user (protected)
router.delete("/:id", requireAuth, deleteUser);

export default router;
