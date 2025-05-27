const express = require('express');
const { sequelize } = require('../db');
const TermsModel = require('../Models/t & c ')(sequelize);
const { Op } = require("sequelize");
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");

const router = express.Router();



// Create Terms and Conditions
router.post("/create", userAuth, async (req, res) => {
  try {
    const terms = await TermsModel.create({
      userId: req.user.id,
      content: req.body.content
    });
    return successResponse(res, "Terms and Conditions created successfully", terms);
  } catch (error) {
    return errorResponse(res, "Error creating Terms and Conditions", error);
  }
});

// Update Terms and Conditions
router.put("/update/:id", userAuth, async (req, res) => {
  try {
    const terms = await TermsModel.findByPk(req.params.id);
    if (!terms) return errorResponse(res, "Terms not found");

    await terms.update({ content: req.body.content });
    return successResponse(res, "Terms updated successfully", terms);
  } catch (error) {
    return errorResponse(res, "Error updating Terms", error);
  }
});

// Delete Terms and Conditions
router.delete("/delete/:id", userAuth, async (req, res) => {
  try {
    const terms = await TermsModel.findByPk(req.params.id);
    if (!terms) return errorResponse(res, "Terms not found");

    await terms.destroy();
    return successResponse(res, "Terms deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting Terms", error);
  }
});

// Get Terms and Conditions by ID
router.get("/get/:id", userAuth, async (req, res) => {
  try {
    const terms = await TermsModel.findByPk(req.params.id);
    if (!terms) return errorResponse(res, "Terms not found");

    return successResponse(res, "Terms fetched successfully", terms);
  } catch (error) {
    return errorResponse(res, "Error fetching Terms", error);
  }
});

// routes/terms.js or wherever your routes are defined
router.get('/get-latest', async (req, res) => {
  try {
    const latestTerm = await TermsModel.findOne({
      order: [['createdAt', 'DESC']],
    });

    if (!latestTerm) {
      return res.status(404).json({
        success: false,
        message: "No terms found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Latest terms fetched successfully",
      data: latestTerm,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch latest terms',
      error: error.message || error,
    });
  }
});



module.exports = router;