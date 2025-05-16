const { sequelize } = require('../db');
const requestModel = require('../Models/Requests')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");

// Create Request
router.post("/create", userAuth, async (req, res) => {
  try {
    const request = await requestModel.create({ ...req.body, userId: req.user.id });
    return successResponse(res, "Request created successfully", request);
  } catch (error) {
    return errorResponse(res, "Error creating request", error);
  }
});

// Update Request
router.patch("/update/:id", userAuth, async (req, res) => {
  try {
    const request = await requestModel.update(req.body, { where: { id: req.params.id } });
    return successResponse(res, "Request updated successfully", request);
  } catch (error) {
    return errorResponse(res, "Error updating request", error);
  }
});

// Delete Request
router.delete("/delete/:id", userAuth, async (req, res) => {
  try {
    await requestModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Request deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting request", error);
  }
});

// Get Request By ID
router.get("/get/:id", userAuth, async (req, res) => {
  try {
    const request = await requestModel.findOne({ where: { id: req.params.id }, include: userModel });
    return successResponse(res, "Request fetched successfully", request);
  } catch (error) {
    return errorResponse(res, "Error fetching request", error);
  }
});

// Get All Requests
router.get("/all", userAuth, async (req, res) => {
  try {
    const requests = await requestModel.findAll({ include: userModel });
    return successResponse(res, "All requests fetched successfully", requests);
  } catch (error) {
    return errorResponse(res, "Error fetching requests", error);
  }
});

// Search Request By Name
router.get("/search", userAuth, async (req, res) => {
  try {
    const { name } = req.query;
    const requests = await requestModel.findAll({ where: { requestName: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Requests fetched successfully", requests);
  } catch (error) {
    return errorResponse(res, "Error searching requests", error);
  }
});

// Count Requests
router.get("/count", userAuth, async (req, res) => {
  try {
    const count = await requestModel.count();
    return successResponse(res, "Request count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting requests", error);
  }
});

module.exports = router;
