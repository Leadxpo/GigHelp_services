const { sequelize } = require('../db');
const otpModel = require('../Models/Otp')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");


const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.trim().length < 10) {
      return errorResponse(res, "A valid phone number is required");
    }

    const otp = generateOtp();
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Save OTP to DB
    const newOtp = await otpModel.create({
      otp,
      phoneNumber,
      date: {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      time: now.toTimeString().split(" ")[0],
      expareDuretion: expiryTime.toISOString(),
    });

    console.log(`OTP for ${phoneNumber}: ${otp}`);

    // ✅ Respond with success and OTP
    return successResponse(res, "OTP sent successfully", {
      otp,
      phoneNumber,
      expiresAt: expiryTime.toISOString(),
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    // Customize error message for known Sequelize or DB issues
    if (error.name === 'SequelizeValidationError') {
      return errorResponse(res, "Invalid data format", error.errors);
    }

    return errorResponse(res, "An unexpected error occurred while sending OTP", error.message || error);
  }
});




// Verify OTP (Login with OTP style)
router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log(req.body,"request body")

    // Input validation
    if (!phoneNumber || !otp) {
      return errorResponse(res, "Phone number and OTP are required");
    }

    // Find user by phone number
    const user = await userModel.findOne({ where: { phoneNumber } });
    if (!user) {
      return errorResponse(res, "User not found");
    }

    // Find latest matching OTP for this number
    const latestOtp = await otpModel.findOne({
      where: { phoneNumber, otp },
      order: [["createdAt", "DESC"]],
    });

    if (!latestOtp) {
      return errorResponse(res, "Invalid OTP");
    }

    const now = new Date();
    const expireAt = new Date(latestOtp.expareDuretion);

    if (now > expireAt) {
      return errorResponse(res, "OTP has expired");
    }

    // Clean up the OTP
    await latestOtp.destroy();

    // Build safe user object (like login response)
    const safeUser = {
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    return successResponse(res, "OTP verified successfully", { user: safeUser });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return errorResponse(res, "Failed to verify OTP", error.message || error);
  }
});



// Create OTP
router.post("/create-otp", async (req, res) => {
  try {
    const { userId, otpCode, expiresIn } = req.body;

    const user = await userModel.findByPk(userId);

    if (!user) {
      return errorResponse(res, "User not found");
    }

    const otp = await otpModel.create({ userId, otpCode, expiresIn });

    return successResponse(res, "OTP created successfully", otp);

  } catch (error) {
    return errorResponse(res, "Error creating OTP", error);
  }
});

// Get OTP by ID
router.get("/get-otp/:otpId", async (req, res) => {
  try {
    const { otpId } = req.params;

    const otp = await otpModel.findByPk(otpId);

    if (!otp) {
      return errorResponse(res, "OTP not found");
    }

    return successResponse(res, "OTP fetched successfully", otp);

  } catch (error) {
    return errorResponse(res, "Error fetching OTP", error);
  }
});

// Update OTP
router.patch("/update-otp/:otpId", async (req, res) => {
  try {
    const { otpId } = req.params;
    const { otpCode, expiresIn } = req.body;

    const otp = await otpModel.findByPk(otpId);

    if (!otp) {
      return errorResponse(res, "OTP not found");
    }

    await otp.update({ otpCode, expiresIn });

    return successResponse(res, "OTP updated successfully", otp);

  } catch (error) {
    return errorResponse(res, "Error updating OTP", error);
  }
});

// Delete OTP
router.delete("/delete-otp/:otpId", async (req, res) => {
  try {
    const { otpId } = req.params;

    const otp = await otpModel.findByPk(otpId);

    if (!otp) {
      return errorResponse(res, "OTP not found");
    }

    await otp.destroy();

    return successResponse(res, "OTP deleted successfully");

  } catch (error) {
    return errorResponse(res, "Error deleting OTP", error);
  }
});

module.exports = router;
