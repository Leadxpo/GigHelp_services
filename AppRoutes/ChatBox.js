const express = require('express');
const router = express.Router();
const { sequelize } = require('../db');
const ChatModel = require('../Models/ChatBox')(sequelize);
const UserModel = require('../Models/Users')(sequelize);
const { userAuth } = require("../Midileware/Auth");
const { successResponse, errorResponse } = require("../Midileware/response");
const { Op } = require('sequelize');
const multer = require('multer'); 
const path = require('path');
const { deleteImage } = require("../Midileware/deleteimages");
const moment = require('moment'); 



// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./storage/chat");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 }
});

router.post('/send', upload.single("file"), async (req, res) => {
  try {
    const { senderId, receiverId, taskId, message } = req.body;
    const file = req.file;

    if (!receiverId || (!message && !file)) {
      return errorResponse(res, "receiverId and either message or file is required");
    }

    // Instead of storing full URL, store just the file name and mimetype
    const fileName = file ? file.filename : null;
    const fileType = file ? file.mimetype : null;

    const chat = await ChatModel.create({
      senderId,
      receiverId,
      taskId,
      message,
      fileUrl: fileName, // Store only filename
      fileType,
    });

    return successResponse(res, "Message sent", chat);
  } catch (error) {
    return errorResponse(res, "Failed to send message", error);
  }
});






// Get conversation between two users

router.get('/conversation/:receiverId', async (req, res) => {
    console.log("aaaa",req.query);
    console.log("aaaaa u",req.query.userId);
    console.log("task id",req.query.taskId);
    console.log("rrrrr",req.params.receiverId);
  try {
    const senderId = req.query.userId;
    const taskId = req.query.taskId;
    const receiverId = parseInt(req.params.receiverId);
    console.log("llllllll>",receiverId)

     if (!senderId || !receiverId || !taskId) {
      return errorResponse(res, "senderId, receiverId and taskId are required");
    }

    const messages = await ChatModel.findAll({
        where: {
          taskId: taskId,
          [Op.or]: [
            { senderId: senderId, receiverId: receiverId },
            { senderId: receiverId, receiverId: senderId }
          ]
        },
        order: [['timestamp', 'ASC']]
      });
      
    console.log("massage",messages)

    return successResponse(res, "Conversation fetched", messages);
  } catch (error) {
    return errorResponse(res, "Failed to fetch messages", error);
  }
});


module.exports = router;
