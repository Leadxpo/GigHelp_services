const { sequelize } = require('../db');
const promotionModel = require('../Models/Promotion')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// Create Promotion
router.post("/create", async (req, res) => {
  try {
    const promotion = await promotionModel.create(req.body);
    return successResponse(res, "Promotion created successfully", promotion);
  } catch (error) {
    return errorResponse(res, "Error creating promotion", error);
  }
});

// Get Promotion by ID
router.get("/get/:promotionId", async (req, res) => {
  try {
    const promotion = await promotionModel.findByPk(req.params.promotionId);
    return successResponse(res, "Promotion fetched successfully", promotion);
  } catch (error) {
    return errorResponse(res, "Error fetching promotion", error);
  }
});

// Get All Promotions
router.get("/get-all", async (req, res) => {
  try {
    const promotions = await promotionModel.findAll();
    return successResponse(res, "All promotions fetched successfully", promotions);
  } catch (error) {
    return errorResponse(res, "Error fetching promotions", error);
  }
});

// Search Promotion by Name
router.get("/search", async (req, res) => {
  try {
    const promotions = await promotionModel.findAll({
      where: { name: { [Op.like]: `%${req.query.name}%` } }
    });
    return successResponse(res, "Promotions found", promotions);
  } catch (error) {
    return errorResponse(res, "Error searching promotions", error);
  }
});

// Update Promotion
router.patch("/update/:promotionId", async (req, res) => {
  try {
    await promotionModel.update(req.body, { where: { id: req.params.promotionId } });
    return successResponse(res, "Promotion updated successfully");
  } catch (error) {
    return errorResponse(res, "Error updating promotion", error);
  }
});

// Delete Promotion
router.delete("/delete/:promotionId", async (req, res) => {
  try {
    await promotionModel.destroy({ where: { id: req.params.promotionId } });
    return successResponse(res, "Promotion deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting promotion", error);
  }
});

// Count Promotions
router.get("/count", async (req, res) => {
  try {
    const count = await promotionModel.count();
    return successResponse(res, "Total promotions count", count);
  } catch (error) {
    return errorResponse(res, "Error counting promotions", error);
  }
});

// Promotion Page with User Reference
router.get("/promotion-page", async (req, res) => {
  try {
    const promotions = await promotionModel.findAll({
      include: [{ model: userModel, as: 'user' }]
    });
    return successResponse(res, "Promotions with user reference", promotions);
  } catch (error) {
    return errorResponse(res, "Error fetching promotions with user", error);
  }
});

module.exports = router;
