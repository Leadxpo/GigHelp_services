const { sequelize } = require('../db');
const userModel = require('../Models/Users')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require("jsonwebtoken");
const path = require('path');
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../Midileware/response");
const { deleteImage } = require("../Midileware/deleteimages");

// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./storege/userdp");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 }
});

router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    console.log("Received Data:", req.body);

    // Hash password
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    // Handle file upload
    if (req.file) {
      req.body.profilePic = req.file.filename;
      console.log("Uploaded File:", req.file.filename);
    }

    // Generate UUID if `userId` is not provided
    if (!req.body.userId) {
      req.body.userId = require("uuid").v4();
    }

    // Create User
    const user = userModel.create(req.body);
    return successResponse(res, "User added successfully", user);
  } catch (error) {
    console.error("Error Saving User:", error);
    return errorResponse(res, "Error saving user", error);
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid password");
    }

    return successResponse(res, "Login successful", {
      user: req.session.user
    });

  } catch (error) {
    return errorResponse(res, "Login failed", error);
  }
});


// Profile Route
router.get("/get-user", async (req, res) => {
  try {
    const { userId } = req.user; // Extract userId from req.user

    const user = userModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return successResponse(res, "User profile fetched successfully", user);
  } catch (error) {
    return errorResponse(res, "Failed to fetch profile", error);
  }
});


// Get All Profiles
router.get("/all-user", async (req, res) => {
  try {
    const users = userModel.findAll();
    return successResponse(res, "All users fetched successfully", users);
  } catch (error) {
    return errorResponse(res, "Failed to fetch users", error);
  }
});

// Update User
router.patch("/user-update", upload.single("profilePic"), async (req, res) => {
  try {
    const { userId } = req.user; // Extract userId from authenticated user
    const user = userModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle Profile Picture Update
    if (req.file) {
      if (user.profilePic) {
        await deleteImage(user.profilePic); // Delete old image if exists
      }
      req.body.profilePic = req.file.filename; // Set new profile picture filename
    }

    // Update User Data
    await user.update(req.body);

    return successResponse(res, "Profile updated successfully", user);
  } catch (error) {
    return errorResponse(res, "Profile update failed", error);
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  return successResponse(res, "Logged out successfully");
});

// Delete User by userId
router.delete("/delete-user", async (req, res) => {
  try {
    const { userId } = req.user;

    // Find user by userId
    const user = userModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete the user
    await user.destroy();

    return successResponse(res, "User deleted successfully");
  } catch (error) {
    return errorResponse(res, "User deletion failed", error);
  }
});


// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = userModel.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, "User does not exist");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return successResponse(res, "Password updated successfully");
  } catch (error) {
    return errorResponse(res, "Error updating password", error);
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    const user = req.user;

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return errorResponse(res, "Invalid current password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return successResponse(res, "Password updated successfully");
  } catch (error) {
    return errorResponse(res, "Error resetting password", error);
  }
});

module.exports = router;
