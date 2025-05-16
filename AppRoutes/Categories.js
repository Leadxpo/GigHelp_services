const { sequelize } = require('../db');
const categoryModel = require('../Models/Categories')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");



router.post("/create", userAuth, async (req, res) => {
  try {
    console.log("Request body:", req.body); // ✅ confirm structure
    const category = await categoryModel.create({
      categoryName: req.body.categoryName,
      categoryImage: req.body.categoryImage,
      description: req.body.description
    });
    return successResponse(res, "Category created successfully", category);
  } catch (error) {
    return errorResponse(res, "Error creating category", error);
  }
});


// Update Category
router.patch("/update/:id", userAuth, async (req, res) => {
  try {
    const category = await categoryModel.update(req.body, { where: { id: req.params.id } });
    return successResponse(res, "Category updated successfully", category);
  } catch (error) {
    return errorResponse(res, "Error updating category", error);
  }
});

// Delete Category
router.delete("/delete/:id", userAuth, async (req, res) => {
  try {
    await categoryModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Category deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting category", error);
  }
});

// Get Category By ID
router.get("/get/:id", userAuth, async (req, res) => {
  try {
    const category = await categoryModel.findOne({ where: { id: req.params.id } });
    return successResponse(res, "Category fetched successfully", category);
  } catch (error) {
    return errorResponse(res, "Error fetching category", error);
  }
});

// Get All Categories
router.get("/get-all", userAuth, async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    return successResponse(res, "All categories fetched successfully", categories);
  } catch (error) {
    return errorResponse(res, "Error fetching categories", error);
  }
});

// Search Category By Name
router.get("/search", userAuth, async (req, res) => {
  try {
    const { name } = req.query;
    const categories = await categoryModel.findAll({ where: { categoryName: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Categories fetched successfully", categories);
  } catch (error) {
    return errorResponse(res, "Error searching categories", error);
  }
});

// Count Categories
router.get("/count", userAuth, async (req, res) => {
  try {
    const count = await categoryModel.count();
    return successResponse(res, "Category count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting categories", error);
  }
});

module.exports = router;
