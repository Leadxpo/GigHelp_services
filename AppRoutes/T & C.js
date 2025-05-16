const express = require('express');
const { sequelize } = require('../db');
const userModel = require('../Models/t & c ')(sequelize);
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

// Get All Terms and Conditions
router.get("/all", userAuth, async (req, res) => {
  try {
    const terms = await TermsModel.findAll();
    return successResponse(res, "All Terms and Conditions fetched successfully", terms);
  } catch (error) {
    return errorResponse(res, "Error fetching Terms", error);
  }
});

module.exports = router;