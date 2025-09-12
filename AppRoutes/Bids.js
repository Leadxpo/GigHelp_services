const { sequelize } = require("../db");
const bidModel = require("../Models/Bids")(sequelize);
const userModel = require("../Models/Users")(sequelize);
const TaskModel = require("../Models/Task")(sequelize);
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
    callback(null, "./storage/bids");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 },
});

// router.post("/create", upload.array("biderDocument"), async (req, res) => {
//   try {
//     console.log("Received Body:", req.body);
//     console.log("Received Files:", req.files);

//     const {
//       amount,
//       description,
//       Categories,
//       SubCategory,
//       targetedPostIn,
//       daysLeft,
//       userId,
//       taskId,
//       taskDescription,
//       bidOfAmount,
//       taskUserId,
//       bidUserId,
//     } = req.body;

//     if (!Categories) {
//       return errorResponse(res, "Categories is required");
//     }

//     // Extract number of days from "3 Days Left"
//     let dateOfBids = null;
//     if (typeof daysLeft === "string") {
//       const match = daysLeft.match(/(\d+)\s*Days\s*Left/i);
//       if (match) {
//         const days = parseInt(match[1]);
//         dateOfBids = moment().subtract(days, "days").format("YYYY-MM-DD");
//       }
//     }

//     // Create a new bid
//     const bid = await bidModel.create({
//       amount,
//       description,
//       Categories,
//       SubCategory,
//       targetedPostIn,
//       userId,
//       taskId,
//       taskDescription,
//       bidOfAmount,
//       dateOfBids,
//       taskUserId,
//       bidUserId,
//       status: "pending",
//     });

//     return successResponse(res, "Bid created successfully", bid);
//   } catch (error) {
//     console.error(error);
//     return errorResponse(res, "Error creating bid", error);
//   }
// });

// Update Bid

router.post("/create", upload.array("biderDocument"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    // build file paths (like in Add Task)
    const filePaths = req.files.map((file) => `${file.filename}`);

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
      taskUserId,
      bidUserId,
    } = req.body;

    if (!Categories || !bidOfAmount || !description) {
      return res.status(400).json({
        success: false,
        message: "Categories, bidOfAmount and description are required",
      });
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

    // create bid with document array
    const bidData = await bidModel.create({
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
      taskUserId,
      bidUserId,
      biderDocument: filePaths, // ✅ like Task "document"
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Bid created successfully",
      data: bidData,
    });
  } catch (error) {
    console.error("Error creating bid:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating bid",
      error: error.message,
    });
  }
});

router.patch("/update/:BidId", upload.array("biderDocument"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    const { bidOfAmount, description, existingDocuments,status } = req.body;

    // if (!bidOfAmount || !description) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "bidOfAmount and description are required",
    //   });
    // }

    // Build new file paths from uploaded files
    const newFilePaths = req.files ? req.files.map((file) => file.filename) : [];

    // Handle existing documents (string or array)
    let allDocuments = [];
    if (existingDocuments) {
      allDocuments = Array.isArray(existingDocuments) ? existingDocuments : [existingDocuments];
    }

    // Merge old + new documents
    allDocuments = [...allDocuments, ...newFilePaths];

    // Update bid in database
    const [rowsUpdated] = await bidModel.update(
      {
        bidOfAmount,
        description,
        biderDocument: allDocuments,
        status,
      },
      { where: { BidId: req.params.BidId } }
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bid updated successfully",
    });
  } catch (error) {
    console.error("Error updating bid:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating bid",
      error: error.message,
    });
  }
});

// router.patch("/update/:BidId", async (req, res) => {
//   try {
//     console.log(req.body,"abcd")
//     const bid = await bidModel.update(req.body, {
//       where: { BidId: req.params.BidId },
//     });
//     return successResponse(res, "Bid updated successfully", bid);
//   } catch (error) {
//     return errorResponse(res, "Error updating bid", error);
//   }
// });

// Delete Bid
router.delete("/delete/:BidId", async (req, res) => {
  try {
    await bidModel.destroy({ where: { BidId: req.params.BidId } });
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

    const enrichedBids = await Promise.all(
      bids.map(async (bid) => {
        const [bidUser, taskUser,taskDetails] = await Promise.all([
          userModel.findOne({ where: { userId: bid.bidUserId } }),
          userModel.findOne({ where: { userId: bid.taskUserId } }),
          TaskModel.findOne({ where: { taskId: Number(bid.taskId) } }),
        ]);

        return {
          ...bid.toJSON(),
          bidUser,
          taskUser,
          taskDetails,
        };
      })
    );

    return successResponse(
      res,
      "Bids with user details fetched successfully",
      enrichedBids
    );
  } catch (error) {
    return errorResponse(res, "Error fetching bids with user details", error);
  }
});

router.get("/get-by-bidid", async (req, res) => {
  try {
    const { bidId } = req.query;

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

router.get("/count/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Count total bids by userId
    const totalBids = await bidModel.count({
      where: { userId: userId },
    });

    // Count completed bids by userId (assuming status: 'completed')
    const completedBids = await bidModel.count({
      where: { userId: userId, status: "completed" },
    });

    const result = {
      totalBids,
      completedBids,
    };

    return successResponse(res, "Bid counts fetched successfully", result);
  } catch (error) {
    return errorResponse(res, "Error fetching bid counts", error);
  }
});

router.get("/users-by-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Step 1: Find all bids with the given taskId
    const bids = await bidModel.findAll({
      where: { taskId },
      attributes: ["userId"],
    });

    // Step 2: Extract unique userIds from bids
    const userIds = [...new Set(bids.map((bid) => parseInt(bid.userId)))];

    if (userIds.length === 0) {
      return successResponse(res, "No users found for the given taskId", []);
    }

    // ✅ Step 3: Find user details using correct primary key field `userId`
    const users = await userModel.findAll({
      where: {
        userId: {
          [Op.in]: userIds,
        },
      },
    });

    return successResponse(
      res,
      "Users fetched successfully based on taskId",
      users
    );
  } catch (error) {
    console.error("Error fetching users by taskId:", error);
    return errorResponse(res, "Error fetching users by taskId", error);
  }
});

module.exports = router;
