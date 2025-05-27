const { sequelize } = require('../db');
const categoryModel = require('../Models/Categories')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { SystemUserAuth } = require("../Midileware/Auth");
const multer = require('multer'); 
const path = require('path');
const { deleteImage } = require("../Midileware/deleteimages");
const moment = require('moment'); 



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




router.post("/create", SystemUserAuth, upload.single('categoryImage'), async (req, res) => {
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


router.put(
  "/update/:categoryId",
  SystemUserAuth,
  upload.single("categoryImage"),
  async (req, res) => {
    try {
      const categoryId = req.params.categoryId;

      // Step 1: Fetch existing category
      const existingCategory = await categoryModel.findOne({ where: { categoryId } });
      if (!existingCategory) {
        return errorResponse(res, "Category not found");
      }

      // Step 2: Delete old image if new one is provided
      if (req.file && existingCategory.categoryImage) {
        const oldImagePath = `./storege/userdp/${existingCategory.categoryImage}`;
        deleteImage(oldImagePath); // deleteImage should remove file from filesystem
      }

      // Step 3: Prepare update data
      const updateData = {
        categoryName: req.body.categoryName || existingCategory.categoryName,
        description: req.body.description || existingCategory.description,
      };

      if (req.file) {
        updateData.categoryImage = req.file.filename; // New uploaded image
      }

      // Step 4: Update the record
      await categoryModel.update(updateData, { where: { categoryId } });

      return successResponse(res, "Category updated successfully", updateData);
    } catch (error) {
      return errorResponse(res, "Error updating category", error);
    }
  }
);

// Delete Category
router.delete("/delete/:categoryId", SystemUserAuth, async (req, res) => {
  try {
    await categoryModel.destroy({ where: { categoryId: req.params.categoryId } });
    return successResponse(res, "Category deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting category", error);
  }
});

// Get Category By ID
router.get("/get/:id", SystemUserAuth, async (req, res) => {
  try {
    const category = await categoryModel.findOne({ where: { id: req.params.id } });
    return successResponse(res, "Category fetched successfully", category);
  } catch (error) {
    return errorResponse(res, "Error fetching category", error);
  }
});

// Get All Categories
router.get("/get-all", SystemUserAuth, async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    return successResponse(res, "All categories fetched successfully", categories);
  } catch (error) {
    return errorResponse(res, "Error fetching categories", error);
  }
});

// Search Category By Name
router.get("/search", SystemUserAuth, async (req, res) => {
  try {
    const { name } = req.query;
    const categories = await categoryModel.findAll({ where: { categoryName: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Categories fetched successfully", categories);
  } catch (error) {
    return errorResponse(res, "Error searching categories", error);
  }
});

// Count Categories
router.get("/count", SystemUserAuth, async (req, res) => {
  try {
    const count = await categoryModel.count();
    return successResponse(res, "Category count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting categories", error);
  }
});

module.exports = router;
