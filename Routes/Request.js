const { sequelize } = require('../db');
const requestModel = require('../Models/Requests')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");
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



router.post("/create", userAuth, upload.none(), async (req, res) => {
  try {
    console.log("Parsed request body:", req.body); // Debug

    const request = await requestModel.create({
      requestName: req.body.requestName,
      requestBy: req.body.requestBy,
      description: req.body.description,
      taskId: req.body.taskId,
      bidId: req.body.bidId,
      requestAmount: req.body.requestAmount,
      dateOfRequest: new Date().toISOString(), // or moment().format("YYYY-MM-DD")
    });

    return successResponse(res, "Request created successfully", request);
  } catch (error) {
    console.error("Create Request Error:", error);
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
