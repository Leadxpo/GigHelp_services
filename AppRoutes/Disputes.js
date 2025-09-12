const express = require("express");
const router = express.Router();
const { sequelize } = require("../db");
const Disputes = require("../Models/Disputes")(sequelize);
const TaskModel = require("../Models/Task")(sequelize);
const Bids = require("../Models/Bids")(sequelize);
const Users = require("../Models/Users")(sequelize);
const { successResponse, errorResponse } = require("../Midileware/response");
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

// -------------------- CREATE --------------------
router.post("/create", upload.array("files", 10), async (req, res) => {
  try {
    console.log("Received dispute Body:", req.body);
    console.log("Received dispute Files:", req.files);
    const { taskId, bidId, raisedBy, raisedByType, reason, adminAssignedId } =
      req.body;
    const uploadedFiles = req.files;

    if (!raisedBy || !raisedByType) {
      return errorResponse(res, "raisedBy and raisedByType are required");
    }

    let filesData = null;
    if (uploadedFiles && uploadedFiles.length > 0) {
      filesData = uploadedFiles.map((file) => ({
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
    });

    return successResponse(res, "Dispute created successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to create dispute", error.message);
  }
});

// -------------------- READ ALL --------------------
router.get("/get-all", async (req, res) => {
  try {
    const disputes = await Disputes.findAll();
    return successResponse(res, "All disputes fetched successfully", disputes);
  } catch (error) {
    return errorResponse(res, "Failed to fetch disputes", error.message);
  }
});

// -------------------- READ BY ID --------------------
router.get("/dispute/:id", async (req, res) => {
  try {
    const dispute = await Disputes.findByPk(req.params.id);
    if (!dispute) return errorResponse(res, "Dispute not found");

    return successResponse(res, "Dispute fetched successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to fetch dispute", error.message);
  }
});

// -------------------- UPDATE --------------------
router.patch("/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const dispute = await Disputes.findByPk(req.params.id);

    if (!dispute) return errorResponse(res, "Dispute not found");

    dispute.status = status || dispute.status;
    await dispute.save();

    return successResponse(res, "Dispute status updated successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to update dispute", error.message);
  }
});

// Optional: Full update of dispute details
router.put("/update/:disputeId", upload.array("files", 10), async (req, res) => {
  try {
    console.log("Update Dispute Body:", req.body);
    console.log("Update Dispute Files:", req.files);
    const { disputeId } = req.params;
    const { taskId, bidId, reason, adminAssignedId, status } = req.body;
    const uploadedFiles = req.files;

    const dispute = await Disputes.findByPk(disputeId);
    if (!dispute) return errorResponse(res, "Dispute not found");

    // handle file uploads
    if (uploadedFiles && uploadedFiles.length > 0) {
      dispute.files = uploadedFiles.map((file) => ({
        fileUrl: file.filename,
        fileType: file.mimetype,
      }));
    }

    // update only provided fields
    if (taskId) dispute.taskId = taskId;
    if (bidId) dispute.bidId = bidId;
    if (reason) dispute.reason = reason;
    if (adminAssignedId) dispute.adminAssignedId = adminAssignedId;
    if (status) dispute.status = status;

    dispute.updatedAt = new Date();

    await dispute.save();
    return successResponse(res, "Dispute updated successfully", dispute);
  } catch (error) {
    return errorResponse(res, "Failed to update dispute", error.message);
  }
});


// -------------------- DELETE --------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const dispute = await Disputes.findByPk(req.params.id);
    if (!dispute) return errorResponse(res, "Dispute not found");

    await dispute.destroy();
    return successResponse(res, "Dispute deleted successfully");
  } catch (error) {
    return errorResponse(res, "Failed to delete dispute", error.message);
  }
});

router.get("/task/:taskId", async (req, res) => {
  try {
    // Fetch the dispute
    const dispute = await Disputes.findOne({
      where: { taskId: req.params.taskId },
    });
    if (!dispute) return errorResponse(res, "Dispute not found");

    // Fetch the task details using taskId from dispute
    const task = await TaskModel.findOne({ where: { taskId: dispute.taskId } });

    // Fetch the bidder details using bidId from dispute
    let bidder = null;
    let bid = null;

    if (dispute.bidId) {
      bid = await Bids.findOne({ where: { bidId: dispute.bidId } });
      if (bid) {
        bidder = await Users.findOne({ where: { userId: bid.userId } });
        if (bidder) bidder.bidDetails = bid; // attach bid details to bidder
      }
    }

    // Combine all data
    const response = {
      ...dispute.dataValues,
      task: task ? task.dataValues : null,
      bid: bid ? bid.dataValues : null,
      bidder: bidder ? bidder.dataValues : null,
    };

    return successResponse(res, "Dispute fetched successfully", response);
  } catch (error) {
    return errorResponse(res, "Failed to fetch dispute", error.message);
  }
});


module.exports = router;
