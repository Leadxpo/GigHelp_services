// routes/adminChats.js
const express = require("express");
const router = express.Router();
const { sequelize } = require("../db");
const AdminChats = require("../Models/AdminChats")(sequelize);
const UserModel = require("../Models/Users")(sequelize);
const SystemUsers = require("../Models/SystemUser")(sequelize);
const { successResponse, errorResponse } = require("../Midileware/response");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const moment = require("moment");

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./storage/adminchats");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1000000000 }, // 1GB max
});

// ✅ Send Message
// router.post("/send", upload.single("file"), async (req, res) => {
//   try {
//     const {
//       taskId,
//       bidId,
//       disputeId,
//       senderId,
//       receiverId,
//       senderType,
//       receiverType,
//       message,
//     } = req.body;

//     const file = req.file;

//     if (!senderId || !receiverId || !senderType || !receiverType) {
//       return errorResponse(res, "senderId, receiverId, senderType and receiverType are required");
//     }

//     if (!message && !file) {
//       return errorResponse(res, "Message or file is required");
//     }

//     const fileUrl = file ? file.filename : null;
//     const fileType = file ? file.mimetype : null;

//     const chat = await AdminChats.create({
//       taskId,
//       bidId,
//       disputeId,
//       senderId,
//       receiverId,
//       senderType,
//       receiverType,
//       message,
//       fileUrl,
//       fileType,
//     });

//     return successResponse(res, "Message sent successfully", chat);
//   } catch (error) {
//     return errorResponse(res, "Failed to send message", error.message);
//   }
// });

// ✅ Send Message
router.post("/send", upload.single("file"), async (req, res) => {
  try {
    const {
      taskId,
      bidId,
      disputeId,
      senderId,
      message,
    } = req.body;

    if (!senderId) {
      return errorResponse(res, "senderId is required");
    }

    if (!message && !req.file) {
      return errorResponse(res, "Message or file is required");
    }

    // Auto-pick admin
    const admin = await SystemUsers.findOne({ where: { role: "admin" } });
    if (!admin) return errorResponse(res, "No admin found");

    const file = req.file;
    const fileUrl = file ? file.filename : null;
    const fileType = file ? file.mimetype : null;

    const chat = await AdminChats.create({
      taskId,
      bidId,
      disputeId,
      senderId,
      receiverId: admin.userId,
      senderType: "owner",
      receiverType: "admin",
      message,
      fileUrl,
      fileType,
    });

    return successResponse(res, "Message sent successfully", chat);
  } catch (error) {
    return errorResponse(res, "Failed to send message", error.message);
  }
});


// ✅ Get conversation (by disputeId, taskId, or bidId)
router.get("/conversation", async (req, res) => {
  try {
    const senderId = parseInt(req.query.params.userId); 
    const { taskId, bidId, disputeId } = req.query;

    if (!senderId) {
      return errorResponse(res, "senderId is required");
    }

    // Automatically pick the admin
    const admin = await SystemUsers.findOne({ where: { role: "admin" } });
    if (!admin) return errorResponse(res, "No admin found");

    const receiverId = admin.userId;

    const where = {
      [Op.or]: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    };

    if (taskId) where.taskId = taskId;
    if (bidId) where.bidId = bidId;
    if (disputeId) where.disputeId = disputeId;

    const messages = await AdminChats.findAll({
      where,
      order: [["timestamp", "ASC"]],
    });

    return successResponse(res, "Conversation fetched successfully", messages);
  } catch (error) {
    return errorResponse(res, "Failed to fetch messages", error.message);
  }
});


// ✅ Get single message by ID
router.get("/get/:id", async (req, res) => {
  try {
    const chat = await AdminChats.findByPk(req.params.id);

    if (!chat) return errorResponse(res, "Chat not found");

    return successResponse(res, "Chat fetched successfully", chat);
  } catch (error) {
    return errorResponse(res, "Failed to fetch chat", error.message);
  }
});

// ✅ Update message
router.put("/update/:id", async (req, res) => {
  try {
    const { message } = req.body;

    const chat = await AdminChats.findByPk(req.params.id);
    if (!chat) return errorResponse(res, "Chat not found");

    chat.message = message || chat.message;
    await chat.save();

    return successResponse(res, "Chat updated successfully", chat);
  } catch (error) {
    return errorResponse(res, "Failed to update chat", error.message);
  }
});

// ✅ Delete message
router.delete("/delete/:id", async (req, res) => {
  try {
    const chat = await AdminChats.findByPk(req.params.id);
    if (!chat) return errorResponse(res, "Chat not found");

    await chat.destroy();
    return successResponse(res, "Chat deleted successfully");
  } catch (error) {
    return errorResponse(res, "Failed to delete chat", error.message);
  }
});

module.exports = router;
