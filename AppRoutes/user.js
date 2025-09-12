const { sequelize } = require("../db");
const userModel = require("../Models/Users")(sequelize);
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcrypt");
const { successResponse, errorResponse } = require("../Midileware/response");
const { deleteImage } = require("../Midileware/deleteimages");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../storage/userdp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 },
});

router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    const { email, userName, phoneNumber, password } = req.body;

    // 1️⃣ Validate required fields
    if (!email || !userName || !phoneNumber || !password) {
      return errorResponse(res, "Please fill all required fields");
    }

    // 3️⃣ Check for duplicate entries in MongoDB
    const existingUser = await userModel.findOne({
      where: {
        [Op.or]: [{ email }, { userName }, { phoneNumber }],
      },
    });
    console.log(existingUser, "existing user");

    if (existingUser) {
      let errors = {};

      if (existingUser.email === email) {
        errors.email = "Email already exists";
      }
      if (existingUser.userName === userName) {
        errors.userName = "User Name already exists";
      }
      if (existingUser.phoneNumber === phoneNumber) {
        errors.phoneNumber = "Phone number already exists";
      }

      return res.status(400).json({
        success: false,
        message: "Duplicate fields found",
        errors, // structured errors for frontend
      });
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Handle file upload
    let profilePic = null;
    if (req.file) {
      profilePic = req.file.filename;
    }

    // 6️⃣ Create new user
    const newUser = new userModel({
      ...req.body,
      password: hashedPassword,
      profilePic,
    });

    await newUser.save();

    return successResponse(res, "User registered successfully", newUser);
  } catch (error) {
    console.error("Error Saving User:", error);
    return errorResponse(res, "Error saving user", error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await userModel.findOne({ where: { userName } });

    if (!user) {
      return errorResponse(res, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return errorResponse(res, "Invalid password");
    }

    // req.session.user = user;

    const safeUser = {
      userId: user.userId,
      userName: user.userName,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    // console.log("Sending user:", safeUser);

    return successResponse(res, "Login successful", { user: safeUser });
  } catch (error) {
    console.error("Catch error:", error);
    return errorResponse(res, "Login failed", error);
  }
});

// Profile Route
router.get("/get-user", async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await userModel.findOne({ where: { userId } });

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
    console.log(users, "users");
    return successResponse(res, "All users fetched successfully", users);
  } catch (error) {
    return errorResponse(res, "Failed to fetch users", error);
  }
});

//working API

// router.patch(
//   "/user-update",
//   upload.fields([
//     { name: "profilePic", maxCount: 1 },
//     { name: "identityProof", maxCount: 10 },
//   ]),
//   async (req, res) => {
//     try {
//       const { userId, proofTypes, status, remarks } = req.body;

//       console.log(req.body, req.files, "frontend data");

//       const user = await userModel.findOne({ where: { userId } });
//       if (!user) return res.status(404).json({ message: "User not found" });

//       // Use the array directly, since it's stored as JSON
//       const prevIdentityProofs = Array.isArray(user.identityProof)
//         ? user.identityProof
//         : [];

//       // Step 2: Parse existing proofs from request body
//       let existingProofsRaw = req.body["existingIdentityProofs"];

//       let existingIdentityProofs = [];

//       if (Array.isArray(existingProofsRaw)) {
//         existingIdentityProofs = existingProofsRaw.map((p) => JSON.parse(p));
//       } else if (typeof existingProofsRaw === "string") {
//         existingIdentityProofs = [JSON.parse(existingProofsRaw)];
//       }

//       const newFiles = req.files?.identityProof || [];

//       const proofTypeArray = Array.isArray(proofTypes)
//         ? proofTypes
//         : typeof proofTypes === "string"
//         ? [proofTypes]
//         : [];

//       const newIdentityProofs = newFiles.map((file, index) => ({
//         type: proofTypeArray[index] || "Unknown",
//         file: file.filename,
//         status: "Pending",
//         description: "Verification under process",
//       }));

//       // Step 4: Combine existing + new proofs
//       const updatedIdentityProofs = [
//         ...existingIdentityProofs,
//         ...newIdentityProofs,
//       ];

//       // const newProofTypes = Array.isArray(proofTypes)
//       //   ? proofTypes
//       //   : typeof proofTypes === "string"
//       //   ? [proofTypes]
//       //   : [];

//       // const newFiles = req.files?.identityProof || [];

//       // // Create new proof objects
//       // const newIdentityProofs = newFiles.map((file, index) => ({
//       //   type: newProofTypes[index] || "Unknown",
//       //   file: file.filename,
//       //   status: "Pending",
//       //   description: "Verification under process",
//       // }));

//       // // Combine previous and new
//       // const updatedIdentityProofs = [
//       //   ...prevIdentityProofs,
//       //   ...newIdentityProofs,
//       // ];

//       console.log("start of identity proofs");
//       console.log(req.body, "frontend data");
//       console.log(newIdentityProofs, "new proofs");
//       console.log(prevIdentityProofs, "previous proofs from backend");
//       console.log(existingProofsRaw, "existing proofs from frontend");
//       console.log(updatedIdentityProofs, "updated proofs");

//       // Update user
//       await userModel.update(
//         {
//           identityProof: updatedIdentityProofs,
//           status,
//           remarks,
//           updatedAt: new Date(),
//         },
//         {
//           where: { userId },
//         }
//       );

//       res.status(200).json({ message: "Identity Proofs updated successfully" });
//     } catch (err) {
//       console.error("Update error:", err);
//       res.status(500).json({ message: "Server error", error: err.message });
//     }
//   }
// );

router.patch(
  "/user-update",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "identityProof", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const { userId, proofTypes } = req.body;

      console.log(req.body, req.files, "frontend data");

      // Ensure userId is provided
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }

      const user = await userModel.findOne({ where: { userId } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData = {
        updatedAt: new Date(),
      };

      // ================== Profile Pic ===================
      if (req.files?.profilePic?.length > 0) {
        updateData.profilePic = req.files.profilePic[0].filename;
      }

      // ================== Identity Proofs ===================
      const hasNewProofs = req.files?.identityProof?.length > 0;
      const hasExistingProofs = req.body.existingIdentityProofs;

      if (hasNewProofs || hasExistingProofs) {
        const prevIdentityProofs = Array.isArray(user.identityProof)
          ? user.identityProof
          : [];

        let existingProofsRaw = req.body["existingIdentityProofs"];
        let existingIdentityProofs = [];

        if (Array.isArray(existingProofsRaw)) {
          existingIdentityProofs = existingProofsRaw.map((p) => JSON.parse(p));
        } else if (typeof existingProofsRaw === "string") {
          existingIdentityProofs = [JSON.parse(existingProofsRaw)];
        }

        const newFiles = req.files?.identityProof || [];
        const proofTypeArray = Array.isArray(proofTypes)
          ? proofTypes
          : typeof proofTypes === "string"
          ? [proofTypes]
          : [];

        const newIdentityProofs = newFiles.map((file, index) => ({
          type: proofTypeArray[index] || "Unknown",
          file: file.filename,
          status: "Pending",
          description: "Verification under process",
        }));

        updateData.identityProof = [
          ...existingIdentityProofs,
          ...newIdentityProofs,
        ];
      }

      // ================== Skills ===================
      if (req.body.skills) {
        try {
          updateData.skills = JSON.parse(req.body.skills);
        } catch (parseError) {
          return res
            .status(400)
            .json({ message: "Invalid skills format. Must be JSON." });
        }
      }

      // ================== Status ===================
      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }

      // ================== Remarks ===================
      if (req.body.remarks !== undefined) {
        updateData.remarks = req.body.remarks;
      }

      // ================== Contact Info ===================
      const contactFields = ["userName", "email", "phoneNumber", "address"];
      contactFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // ================== Bank Details ===================
      const bankFields = [
        "accountHolder",
        "bankName",
        "accountNumber",
        "ifscCode",
      ];
      bankFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // ================== Final Update ===================
      await userModel.update(updateData, {
        where: { userId },
      });

      res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

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
