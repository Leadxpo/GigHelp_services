const { sequelize } = require('../db');
const subcategoryModel = require('../Models/SubCategories')(sequelize);
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




router.post("/create-subcategory", SystemUserAuth, upload.single('image'), async (req, res) => {
  try {
    const body = {
      ...req.body,
      subCategoryImage: req.file?.filename || null,
    };
    
    const subcategory = await subcategoryModel.create(body);
    return successResponse(res, "Subcategory created successfully", subcategory);
  } catch (error) {
    return errorResponse(res, "Error creating subcategory", error);
  }
});


router.put(
  "/update/:SubCategoryId",
  SystemUserAuth,
  upload.single("subCategoryImage"),
  async (req, res) => {
    try {
      const SubCategoryId = req.params.SubCategoryId;

      // Step 1: Fetch existing category
      const existingCategory = await subcategoryModel.findOne({ where: { SubCategoryId } });
      if (!existingCategory) {
        return errorResponse(res, "Category not found");
      }

     // Step 2: Delete old image if new one is provided
if (req.file && existingCategory.subCategoryImage) {
  const oldImagePath = path.join(__dirname, '..', 'storege', 'userdp', existingCategory.subCategoryImage);
  deleteImage(oldImagePath);
}

// Step 3: Prepare update data
const updateData = {
  SubCategoryName: req.body.SubCategoryName || existingCategory.SubCategoryName,
  description: req.body.description || existingCategory.description,
};

if (req.file) {
  updateData.subCategoryImage = req.file.filename;
}

      // Step 4: Update the record
      await subcategoryModel.update(updateData, { where: { SubCategoryId } });

      return successResponse(res, "Category updated successfully", updateData);
    } catch (error) {
      return errorResponse(res, "Error updating category", error);
    }
  }
);

router.delete("/delete/:subCategoryId", SystemUserAuth, async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    if (!subCategoryId || isNaN(subCategoryId)) {
      return errorResponse(res, "Valid subCategoryId is required");
    }

    const result = await subcategoryModel.destroy({
      where: { subCategoryId: parseInt(subCategoryId) }
    });

    if (result === 0) {
      return errorResponse(res, "No subcategory found to delete");
    }

    return successResponse(res, "Category deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting category", error);
  }
});


// Get Subcategory By ID
router.get("/get/:id", SystemUserAuth, async (req, res) => {
  try {
    const subcategory = await subcategoryModel.findOne({ where: { id: req.params.id } });
    return successResponse(res, "Subcategory fetched successfully", subcategory);
  } catch (error) {
    return errorResponse(res, "Error fetching subcategory", error);
  }
});


// Get Subcategories by Category ID
router.get("/get-all-categoryId", SystemUserAuth, async (req, res) => {
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
router.get("/get-all", SystemUserAuth, async (req, res) => {
  try {
    const subcategories = await subcategoryModel.findAll();
    return successResponse(res, "All subcategories fetched successfully", subcategories);
  } catch (error) {
    return errorResponse(res, "Error fetching subcategories", error);
  }
});

// Search Subcategory By Name
router.get("/search", SystemUserAuth, async (req, res) => {
  try {
    const { name } = req.query;
    const subcategories = await subcategoryModel.findAll({ where: { name: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Subcategories fetched successfully", subcategories);
  } catch (error) {
    return errorResponse(res, "Error searching subcategories", error);
  }
});

// Count Subcategories
router.get("/count", SystemUserAuth, async (req, res) => {
  try {
    const count = await subcategoryModel.count();
    return successResponse(res, "Subcategory count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting subcategories", error);
  }
});

module.exports = router;