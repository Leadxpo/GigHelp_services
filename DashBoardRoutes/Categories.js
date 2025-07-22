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
const fs = require("fs");
const Papa = require("papaparse");

const uploadDir = path.join(__dirname, "../storage/category");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
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
    const imageFile = req.file ? req.file.filename : null;
    const category = await categoryModel.create({
      categoryName: req.body.categoryName,
      // categoryImage: req.body.categoryImage,
      categoryImage:imageFile,
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
        const oldImagePath = `./storage/category/${existingCategory.categoryImage}`;
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
    const { categoryId } = req.params;
    const category = await categoryModel.findOne({ where: { categoryId } });

    if (!category) {
      return errorResponse(res, 'Category not found');
    }

    if (category.categoryImage) {
      const imagePath = path.join(uploadDir, category.categoryImage);
      deleteImage(imagePath);
    }
    await category.destroy();
    return successResponse(res, 'Category deleted successfully');
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


const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, `category_upload_${Date.now()}${path.extname(file.originalname)}`)
});

const csvUpload = multer({ storage: csvStorage });

router.post("/upload-csv", SystemUserAuth, csvUpload.single("csv_file"), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "CSV file is required");
    }

    const filePath = req.file.path;
    const csvFile = fs.readFileSync(filePath, "utf8");

    // Parse CSV content
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;

        let processed = [];
        for (const row of data) {
          const { categoryId, categoryName, description, categoryImage } = row;

          // Skip rows without required fields
          if (!categoryName) continue;

          let categoryRecord;
          if (categoryId) {
            categoryRecord = await categoryModel.findOne({ where: { categoryId } });
          }

          if (categoryRecord) {
            await categoryModel.update(
              {
                categoryName: categoryName || categoryRecord.categoryName,
                description: description || categoryRecord.description,
                categoryImage: categoryImage || categoryRecord.categoryImage,
              },
              { where: { categoryId } }
            );
            processed.push({ categoryId, status: "updated" });
          } else {
            const newCategory = await categoryModel.create({
              categoryName,
              description,
              categoryImage,
            });
            processed.push({ categoryId: newCategory.categoryId, status: "created" });
          }
        }

        // Remove uploaded file after processing
        fs.unlinkSync(filePath);

        return successResponse(res, "CSV processed successfully", processed);
      },
      error: (err) => {
        fs.unlinkSync(filePath);
        return errorResponse(res, "CSV parsing error", err);
      },
    });
  } catch (error) {
    return errorResponse(res, "CSV upload failed", error);
  }
});





module.exports = router;
