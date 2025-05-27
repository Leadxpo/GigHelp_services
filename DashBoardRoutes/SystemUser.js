const { sequelize } = require('../db');
const systemUserModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require("jsonwebtoken");
const path = require('path');
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../Midileware/response");
const { deleteImage } = require("../Midileware/deleteimages");
const { SystemUserAuth } = require("../Midileware/Auth");

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

// Register
router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.file) {
      req.body.profilePic = req.file.filename;
    }


    const user = await systemUserModel.create(req.body); // ✅ FIXED

    return successResponse(res, "User added successfully", user);
  } catch (error) {
    return errorResponse(res, "Error saving user", error);
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await systemUserModel.findOne({ where: { email } }); // ✅ FIXED

    if (!user) {
      return errorResponse(res, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); // ✅ This works now

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid password");
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, userName: user.userName },
      "vamsi@1998", // Replace with env var
      { expiresIn: "2h" }
    );

    return successResponse(res, "Login successful", {
      token,
      user: {
        userId: user.userId,
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(res, "Login failed", error);
  }
});


// Profile Route
router.get("/get-user", SystemUserAuth, async (req, res) => {
  try {
    const { userId } = req.user; // Extract userId from req.user

    const user = systemUserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return successResponse(res, "User profile fetched successfully", user);
  } catch (error) {
    return errorResponse(res, "Failed to fetch profile", error);
  }
});


// Get All Profiles
router.get("/get-all", SystemUserAuth, async (req, res) => {
  try {
    const users =  await systemUserModel.findAll();
    return successResponse(res, "All users fetched successfully", users);
  } catch (error) {
    return errorResponse(res, "Failed to fetch users", error);
  }
});

router.put("/user-update/:userId", SystemUserAuth, upload.single("profilePic"), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await systemUserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle Profile Picture Update
    if (req.file) {
      if (user.profilePic) {
        await deleteImage(user.profilePic);
      }
      req.body.profilePic = req.file.filename;
    }

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

router.delete("/delete/:userId", SystemUserAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await systemUserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
    const user = systemUserModel.findOne({ where: { email } });

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
router.post("/reset-password", SystemUserAuth, async (req, res) => {
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
