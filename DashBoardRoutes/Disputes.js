const express = require("express");
const router = express.Router();
const { sequelize } = require("../db");
const Disputes = require("../Models/Disputes")(sequelize);
const TaskModel = require("../Models/Task")(sequelize);
const BidModel = require("../Models/Bids")(sequelize);
const UserModel = require("../Models/Users")(sequelize);
const { successResponse, errorResponse } = require("../Midileware/response");
const { SystemUserAuth } = require("../Midileware/Auth");
const multer = require("multer");
const path = require("path");

// -------------------- Multer Configuration --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./storage/disputes");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1000000000 }, // 1GB max
});

// -------------------- CREATE Dispute --------------------
router.post("/create", upload.array("files", 10), async (req, res) => {
  try {
    const { taskId, bidId, raisedBy, raisedByType, reason, adminAssignedId } =
      req.body;

    if (!raisedBy || !raisedByType) {
      return errorResponse(res, "raisedBy and raisedByType are required");
    }

    let filesData = null;
    if (req.files && req.files.length > 0) {
      filesData = req.files.map((file) => ({
        fileUrl: file.filename,
        fileType: file.mimetype,
      }));
    }

    const dispute = await Disputes.create({
      taskId: taskId || null,
      bidId: bidId || null,
      raisedBy,
      raisedByType,
      reason: reason || null,
      adminAssignedId: adminAssignedId || null,
      files: filesData,
      status: "open",
    });

    return successResponse(res, "Dispute created successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to create dispute", error.message);
  }
});

// -------------------- READ Dispute --------------------

// Get all disputes (protected)
router.get("/get-all", SystemUserAuth, async (req, res) => {
  console.log("Fetching all disputes");
  try {
    const disputes = await Disputes.findAll();
    return successResponse(res, "Disputes fetched successfully", disputes);
  } catch (error) {
    return errorResponse(res, "Failed to fetch disputes", error.message);
  }
});

// Get Dispute By Id (with task, bid, and users)
router.get("/get/:id", SystemUserAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the dispute record
    const dispute = await Disputes.findOne({
      where: { disputeId: id },
    });

    if (!dispute) return errorResponse(res, "Dispute not found");

    // Fetch related task and owner
    let task = null;
    let owner = null;
    if (dispute.taskId) {
      task = await TaskModel.findOne({ where: { taskId: dispute.taskId } });
      if (task && task.userId) {
        owner = await UserModel.findOne({ where: { userId: task.userId } });
      }
    }

    // Fetch related bid and bidder
    let bid = null;
    let bidder = null;
    if (dispute.bidId) {
      bid = await BidModel.findOne({ where: { bidId: dispute.bidId } });
      if (bid && bid.bidUserId) {
        bidder = await UserModel.findOne({ where: { userId: bid.bidUserId } });
      }
    }

    // Final structured response
    const result = {
      ...dispute.toJSON(),
      task: task ? { ...task.toJSON(), owner } : null,
      bid: bid ? { ...bid.toJSON(), bidder } : null,
    };

    return successResponse(res, "Dispute fetched successfully", result);
  } catch (error) {
    return errorResponse(res, "Failed to fetch dispute", error.message);
  }
});


// Get disputes by taskId (protected)
router.get("/task/:taskId", SystemUserAuth, async (req, res) => {
  try {
    const disputes = await Disputes.findAll({
      where: { taskId: req.params.taskId },
    });
    return successResponse(
      res,
      "Disputes for task fetched successfully",
      disputes
    );
  } catch (error) {
    return errorResponse(res, "Failed to fetch disputes", error.message);
  }
});

// Get dispute by disputeId (protected)
// router.get("/:disputeId", SystemUserAuth, async (req, res) => {
//   console.log("Fetching dispute with ID:");
//   try {
//     const dispute = await Disputes.findOne({
//       where: { disputeId: req.params.disputeId },
//     });
//     if (!dispute) return errorResponse(res, "Dispute not found");
//     return successResponse(res, "Dispute fetched successfully", dispute);
//   } catch (error) {
//     return errorResponse(res, "Failed to fetch dispute", error.message);
//   }
// });

// -------------------- UPDATE Dispute --------------------
router.put("/update/:disputeId", SystemUserAuth, async (req, res) => {
  try {
    const { adminAssignedId, status, adminNotes } = req.body;
    const dispute = await Disputes.findOne({
      where: { disputeId: req.params.disputeId },
    });
    if (!dispute) return errorResponse(res, "Dispute not found");

    dispute.adminAssignedId = adminAssignedId || dispute.adminAssignedId;
    dispute.status = status || dispute.status;
    dispute.adminNotes = adminNotes || dispute.adminNotes;

    await dispute.save();

    // Optionally update task status if dispute resolved
    if (status === "resolved" && dispute.taskId) {
      const task = await TaskModel.findOne({
        where: { taskId: dispute.taskId },
      });
      if (task) {
        task.status = "completed";
        await task.save();
      }
    }

    return successResponse(res, "Dispute updated successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to update dispute", error.message);
  }
});

// -------------------- DELETE Dispute --------------------
router.delete("/delete/:disputeId", SystemUserAuth, async (req, res) => {
  try {
    const dispute = await Disputes.findOne({
      where: { disputeId: req.params.disputeId },
    });
    if (!dispute) return errorResponse(res, "Dispute not found");

    await dispute.destroy();
    return successResponse(res, "Dispute deleted successfully");
  } catch (error) {
    return errorResponse(res, "Failed to delete dispute", error.message);
  }
});

module.exports = router;
