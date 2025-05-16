const { sequelize } = require('../db');
const otpModel = require('../Models/Otp')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");

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
