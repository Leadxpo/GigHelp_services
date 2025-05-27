const { sequelize } = require('../db');
const subcategoryModel = require('../Models/SubCategories')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// Create Subcategory
router.post("/create", async (req, res) => {
  try {
    const subcategory = await subcategoryModel.create(req.body);
    return successResponse(res, "Subcategory created successfully", subcategory);
  } catch (error) {
    return errorResponse(res, "Error creating subcategory", error);
  }
});

// Update Subcategory
router.patch("/update/:id", async (req, res) => {
  try {
    const subcategory = await subcategoryModel.update(req.body, { where: { id: req.params.id } });
    return successResponse(res, "Subcategory updated successfully", subcategory);
  } catch (error) {
    return errorResponse(res, "Error updating subcategory", error);
  }
});

// Delete Subcategory
router.delete("/delete/:id", async (req, res) => {
  try {
    await subcategoryModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Subcategory deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting subcategory", error);
  }
});

// Get Subcategory By ID
router.get("/get/:id", async (req, res) => {
  try {
    const subcategory = await subcategoryModel.findOne({ where: { id: req.params.id } });
    return successResponse(res, "Subcategory fetched successfully", subcategory);
  } catch (error) {
    return errorResponse(res, "Error fetching subcategory", error);
  }
});


// Get Subcategories by Category ID
router.get("/get-all-categoryId", async (req, res) => {
  try {
    const { categoryId } = req.query; // 
    if (!categoryId) {
      return errorResponse(res, "Category ID is required");
    }

    const subcategories = await subcategoryModel.findAll({
      where: { categoryId: parseInt(categoryId) },
    });

    return successResponse(res, "Subcategories fetched successfully", subcategories);
  } catch (error) {
    return errorResponse(res, "Error fetching subcategories", error);
  }
});



// Get All Subcategories
router.get("/get-all", async (req, res) => {
  try {
    const subcategories = await subcategoryModel.findAll();
    return successResponse(res, "All subcategories fetched successfully", subcategories);
  } catch (error) {
    return errorResponse(res, "Error fetching subcategories", error);
  }
});

// Search Subcategory By Name
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    const subcategories = await subcategoryModel.findAll({ where: { name: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Subcategories fetched successfully", subcategories);
  } catch (error) {
    return errorResponse(res, "Error searching subcategories", error);
  }
});

// Count Subcategories
router.get("/count", async (req, res) => {
  try {
    const count = await subcategoryModel.count();
    return successResponse(res, "Subcategory count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting subcategories", error);
  }
});

module.exports = router;