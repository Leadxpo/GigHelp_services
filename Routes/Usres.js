const { sequelize } = require('../db');
const UserModel = require('../Models/Users')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const jwt = require("jsonwebtoken");
const path = require('path');
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../Midileware/response");
const { deleteImage } = require("../Midileware/deleteimages");
const { userAuth } = require("../Midileware/Auth");

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

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.file) {
      req.body.profilePic = req.file.filename;
    }

    // Parse JSON fields if coming as strings
    if (typeof req.body.skills === "string") {
      req.body.skills = JSON.parse(req.body.skills);
    }
    if (typeof req.body.experience === "string") {
      req.body.experience = JSON.parse(req.body.experience);
    }

    const user = await UserModel.create(req.body);
    return successResponse(res, "User added successfully", user);
  } catch (error) {
    console.error("Error Saving User:", error);
    return errorResponse(res, "Error saving user", error);
  }
});


// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ where: { email } });

    if (!user) {
      return errorResponse(res, "User not found");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid password");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, userName: user.userName },
      "vamsi@1998",
      { expiresIn: "2h" } // Token expires in 2 hours
    );

    // Send token in the response header (Authorization)
    res.setHeader('Authorization', `Bearer ${token}`);

    // Success Response
    return successResponse(res, "Login successful", {
      token,
      user: {
        userId: user.userId,
        userName: user.userName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        profilePic: user.profilePic,
        identityProof: user.identityProof,
        identityNumber: user.identityNumber,
        skills: user.skills,
        experiance: user.experiance,
        status: user.status,
        accountHolder: user.accountHolder,
        accountNumber: user.accountNumber,
        bankName: user.bankName,
        ifscCode: user.ifscCode,
        remarks: user.remarks,




        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return errorResponse(res, "Login failed", error.message);
  }
});


// Get Login User Details
router.get("/login-user-details", userAuth, async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await UserModel.findOne({
      where: { userId },
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    if (!user) {
      return errorResponse(res, "User not found");
    }

    return successResponse(res, "Login user details fetched successfully", user);
  } catch (error) {
    console.error("Error fetching login user details:", error);
    return errorResponse(res, "Failed to fetch login user details", error);
  }
});




// Profile Route
router.get("/get-user", userAuth, async (req, res) => {
  try {
    const { userId } = req.user; // Extract userId from req.user

    const user = UserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return successResponse(res, "User profile fetched successfully", user);
  } catch (error) {
    return errorResponse(res, "Failed to fetch profile", error);
  }
});


// controllers/user.js or wherever your route handler is
router.get("/all-user", userAuth, async (req, res) => {
  try {
    const users = await UserModel.findAll(); // ✅ Ensure await is used

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
      error: null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      data: null,
      error: error.message,
    });
  }
});


router.put(
  "/user-update/:userId",
  userAuth,
  upload.fields([
    { name: "profilePic", maxCount: 10 },
    { name: "identityProof", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await UserModel.findOne({ where: { userId } });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (req.files?.profilePic?.[0]) {
        if (user.profilePic) await deleteImage(user.profilePic);
        req.body.profilePic = req.files.profilePic[0].filename;
      }

    if (req.files?.identityProof?.length > 0) {
  // Delete old identity proofs if needed
  if (user.identityProof) {
    const oldProofs = Array.isArray(user.identityProof) ? user.identityProof : [user.identityProof];
    for (const proof of oldProofs) {
      await deleteImage(proof);
    }
  }

  // Save multiple filenames as an array
  req.body.identityProof = req.files.identityProof.map((file) => file.filename);
}


      const fieldsToUpdate = {
        userName: req.body.userName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        profilePic: req.body.profilePic,
        identityProof: req.body.identityProof,
        accountHolder: req.body.accountHolder,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName,
        ifscCode: req.body.ifscCode,
      };

      await user.update(fieldsToUpdate);

      return successResponse(res, "User profile updated successfully", user);
    } catch (error) {
      console.error("Profile Update Error:", error);
      return errorResponse(res, "Failed to update user profile", error);
    }
  }
);

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  return successResponse(res, "Logged out successfully");
});

// Delete User by userId
router.delete("/delete-user", userAuth, async (req, res) => {
  try {
    const { userId } = req.user;

    // Await the database query to fetch the user
    const user = await UserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete the user
    await user.destroy();

    return successResponse(res, "User deleted successfully");
  } catch (error) {
    console.error("User Deletion Error:", error); // Log the error for debugging
    return errorResponse(res, "User deletion failed", error);
  }
});


// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = UserModel.findOne({ where: { email } });

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
router.post("/reset-password", userAuth, async (req, res) => {
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
