const { sequelize } = require('../db');
const notificationModel = require('../Models/Notifications')(sequelize); // Changed
const userModel = require('../Models/Users')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const path = require('path');
const { deleteImage } = require("../Midileware/deleteimages");
const { successResponse, errorResponse } = require("../Midileware/response");
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

// Create Notification
router.post("/create", upload.array('biderDocument' ,10), async (req, res) => {
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

    let dateOfNotification = null;
    if (typeof daysLeft === 'string') {
      const match = daysLeft.match(/(\d+)\s*Days\s*Left/i);
      if (match) {
        const days = parseInt(match[1]);
        dateOfNotification = moment().subtract(days, 'days').format("YYYY-MM-DD");
      }
    }

    const notification = await notificationModel.create({
      amount,
      description,
      Categories,
      SubCategory,
      targetedPostIn,
      userId,
      taskId,
      taskDescription,
      bidOfAmount,
      dateOfNotification,
      status: 'pending',
      biderDocument: req.files ? req.files.map(file => file.filename) : [],
    });

    return successResponse(res, "Notification created successfully", notification);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Error creating notification", error);
  }
});

// Update Notification
router.patch("/update/:id", async (req, res) => {
  try {
    const notification = await notificationModel.update(req.body, { where: { id: req.params.id } });
    return successResponse(res, "Notification updated successfully", notification);
  } catch (error) {
    return errorResponse(res, "Error updating notification", error);
  }
});

// Delete Notification
router.delete("/delete/:id", async (req, res) => {
  try {
    await notificationModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Notification deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting notification", error);
  }
});

// Get Notifications by User ID
router.get("/user/:userId", async (req, res) => {
  try {
    const notifications = await notificationModel.findAll({ where: { userId: req.params.userId } });
    return successResponse(res, "Notifications fetched successfully", notifications);
  } catch (error) {
    return errorResponse(res, "Error fetching notifications", error);
  }
});

// Get Notification by Notification ID
router.get("/get-by-id", async (req, res) => {
  try {
    const { notificationId } = req.query;

    if (!notificationId) {
      return res.status(400).json({ success: false, message: "Missing notificationId" });
    }

    const notification = await notificationModel.findOne({ where: { notificationId } });

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return successResponse(res, "Notification fetched successfully", notification);
  } catch (error) {
    console.error("Fetch notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching notification",
      error: error.message || error,
    });
  }
});

// Get All Notifications
router.get("/get-all", async (req, res) => {
  try {
    const notifications = await notificationModel.findAll();
    return successResponse(res, "All notifications fetched successfully", notifications);
  } catch (error) {
    return errorResponse(res, "Error fetching all notifications", error);
  }
});

// Search by Notification Name
router.get("/search", async (req, res) => {
  try {
    const notifications = await notificationModel.findAll({
      where: { bidName: { [Op.like]: `%${req.query.name}%` } }
    });
    return successResponse(res, "Search results", notifications);
  } catch (error) {
    return errorResponse(res, "Error searching notifications", error);
  }
});

// Count Notifications
router.get("/count", async (req, res) => {
  try {
    const count = await notificationModel.count();
    return successResponse(res, "Notification count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error fetching notification count", error);
  }
});

router.get("/count/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const total = await notificationModel.count({ where: { userId } });
    const completed = await notificationModel.count({ where: { userId, status: 'completed' } });

    return successResponse(res, "Notification counts fetched successfully", {
      totalNotifications: total,
      completedNotifications: completed
    });
  } catch (error) {
    return errorResponse(res, "Error fetching notification counts", error);
  }
});

// Get all user details based on taskId
router.get("/users-by-task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const notifications = await notificationModel.findAll({
      where: { taskId },
      attributes: ['userId']
    });

    const userIds = [...new Set(notifications.map(notification => notification.userId))];

    if (userIds.length === 0) {
      return successResponse(res, "No users found for the given taskId", []);
    }

    const users = await userModel.findAll({
      where: {
        userId: {
          [Op.in]: userIds
        }
      }
    });

    return successResponse(res, "Users fetched successfully based on taskId", users);
  } catch (error) {
    console.error("Error fetching users by taskId:", error);
    return errorResponse(res, "Error fetching users by taskId", error);
  }
});

module.exports = router;
