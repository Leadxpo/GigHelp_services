const express = require('express');
const router = express.Router();
const { sequelize } = require('../db');
const notificationModel = require('../Models/Notifications')(sequelize);
const { successResponse, errorResponse } = require("../Midileware/response");
const { Op } = require("sequelize");

// Create Notification
router.post("/create", async (req, res) => {
  try {
    const { userId, message,title } = req.body;
    const newNotification = await notificationModel.create({ userId, message,title });
    return successResponse(res, "Notification created successfully", newNotification);
  } catch (error) {
    return errorResponse(res, "Failed to create notification", error);
  }
});

// Get Notifications by User ID
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await notificationModel.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return successResponse(res, "Notifications fetched successfully", notifications);
  } catch (error) {
    return errorResponse(res, "Failed to fetch notifications", error);
  }
});


router.put("/mark-as-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await notificationModel.update(
      { isRead: true },
      { where: { userId } }
    );

    return successResponse(res, "Marked all as read");
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Error updating notifications");
  }
});


// Get All Notifications
router.get("/get-all", async (req, res) => {
 try {
    const allNotifications = await notificationModel.findAll({ order: [["createdAt", "DESC"]] });
    res.json({ data: allNotifications });
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
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

module.exports = router;
