const { sequelize } = require("../db");
const bidModel = require("../Models/Bids")(sequelize);
const userModel = require("../Models/SystemUser")(sequelize);
const { Op } = require("sequelize");
const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const { deleteImage } = require("../Midileware/deleteimages");
const { successResponse, errorResponse } = require("../Midileware/response");
const moment = require("moment");

// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./storege/userdp");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 },
});

router.post("/create", upload.single("file"), async (req, res) => {
  try {
    const {
      amount,
      description,
      Categories,
      SubCategory,
      targetedPostIn,
      daysLeft,
      userId,
      taskId,
      taskDescription,
      bidOfAmount,
    } = req.body;

    if (!Categories) {
      return errorResponse(res, "Categories is required");
    }

    // Extract number of days from "3 Days Left"
    let dateOfBids = null;
    if (typeof daysLeft === "string") {
      const match = daysLeft.match(/(\d+)\s*Days\s*Left/i);
      if (match) {
        const days = parseInt(match[1]);
        dateOfBids = moment().subtract(days, "days").format("YYYY-MM-DD");
      }
    }

    // Create a new bid
    const bid = await bidModel.create({
      amount,
      description,
      Categories,
      SubCategory,
      targetedPostIn,
      userId,
      taskId,
      taskDescription,
      bidOfAmount,
      dateOfBids,
      status: "pending",
    });

    return successResponse(res, "Bid created successfully", bid);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Error creating bid", error);
  }
});

// Update Bid
router.patch("/update/:id", async (req, res) => {
  try {
    const bid = await bidModel.update(req.body, {
      where: { id: req.params.id },
    });
    return successResponse(res, "Bid updated successfully", bid);
  } catch (error) {
    return errorResponse(res, "Error updating bid", error);
  }
});

// Delete Bid
router.delete("/delete/:id", async (req, res) => {
  try {
    await bidModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Bid deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting bid", error);
  }
});

// Get Bid by User ID
router.get("/user/:userId", async (req, res) => {
  try {
    const bids = await bidModel.findAll({
      where: { userId: req.params.userId },
    });
    return successResponse(res, "Bids fetched successfully", bids);
  } catch (error) {
    return errorResponse(res, "Error fetching bids", error);
  }
});

// Backend: use params instead of query
router.get("/get-by-bidid/:bidId", async (req, res) => {
  try {
    const { bidId } = req.params;

    if (!bidId) {
      return res.status(400).json({ success: false, message: "Missing bidId" });
    }

    const bid = await bidModel.findOne({ where: { BidId: bidId } });

    if (!bid) {
      return res.status(404).json({ success: false, message: "Bid not found" });
    }

    return successResponse(res, "Bid fetched successfully", bid);
  } catch (error) {
    console.error("Fetch bid error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching bid",
      error: error.message || error,
    });
  }
});

// Get All Bids
router.get("/get-all-bids", async (req, res) => {
  try {
    const bids = await bidModel.findAll();
    return successResponse(res, "All bids fetched successfully", bids);
  } catch (error) {
    return errorResponse(res, "Error fetching all bids", error);
  }
});

router.get("/get-all-bids-by-user", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required");
    }

    const bids = await bidModel.findAll({
      where: { userId },
    });

    return successResponse(res, "Bids fetched successfully", bids);
  } catch (error) {
    return errorResponse(res, "Error fetching bids", error);
  }
});

router.get("/get-all-bids-by-task", async (req, res) => {
  try {
    console.log("Query paramsdddddd:", req.query);
    const { taskId } = req.query.params;

    if (!taskId) {
      return errorResponse(res, "taskId is required");
    }

    const bids = await bidModel.findAll({
      where: { taskId },
    });

    return successResponse(res, "Bids fetched successfully", bids);
  } catch (error) {
    console.error("Error fetching bids by task:", error);
    return errorResponse(res, "Error fetching bids", error.message || error);
  }
});

// Search by Bid Name
router.get("/search", async (req, res) => {
  try {
    const bids = await bidModel.findAll({
      where: { bidName: { [Op.like]: `%${req.query.name}%` } },
    });
    return successResponse(res, "Search results", bids);
  } catch (error) {
    return errorResponse(res, "Error searching bids", error);
  }
});

// Count Bids
router.get("/count", async (req, res) => {
  try {
    const count = await bidModel.count();
    return successResponse(res, "Bid count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error fetching bid count", error);
  }
});

module.exports = router;
