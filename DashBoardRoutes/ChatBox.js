const express = require("express");
const router = express.Router();
const { sequelize } = require("../db");
const ChatModel = require("../Models/ChatBox")(sequelize);
const UserModel = require("../Models/Users")(sequelize);
const { SystemUserAuth } = require("../Midileware/Auth");
// const { userAuth } = require("../Midileware/Auth");
const { successResponse, errorResponse } = require("../Midileware/response");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const { deleteImage } = require("../Midileware/deleteimages");
const moment = require("moment");
const { getTaskAndBidder } = require("../utils/chatHelpers");

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

// router.post('/send', SystemUserAuth, upload.single("file"), async (req, res) => {
//   try {
//     const { senderId, receiverId, taskId, message } = req.body;
//     const file = req.file;

//     if (!receiverId || (!message && !file)) {
//       return errorResponse(res, "receiverId and either message or file is required");
//     }

//     const fileUrl = file ? `http://localhost:3001/storege/userdp/${file.filename}` : null;
//     const fileType = file ? file.mimetype : null;

//     const chat = await ChatModel.create({
//       senderId,
//       receiverId,
//       taskId,
//       message,
//       fileUrl,
//       fileType,
//     });

//     return successResponse(res, "Message sent", chat);
//   } catch (error) {
//     return errorResponse(res, "Failed to send message", error);
//   }
// });

// Get conversation between two users

// router.get('/conversation', SystemUserAuth, async (req, res) => {
//     // console.log("kkkk",req.query.params);
//     // console.log("kkkk u",req.user);
//   try {
//     const senderId = req.query.params.senderId;
//     const receiverId = parseInt(req.query.params.receiverId);
//     // console.log("llllllll>",receiverId)

//     const messages = await ChatModel.findAll({
//         where: {
//           [Op.or]: [
//             { senderId: senderId, receiverId: receiverId },
//             { senderId: receiverId, receiverId: senderId }
//           ]
//         },
//         order: [['timestamp', 'ASC']]
//       });

//     console.log("massage",messages)

//     return successResponse(res, "Conversation fetched", messages);
//   } catch (error) {
//     return errorResponse(res, "Failed to fetch messages", error);
//   }
// });

router.post(
  "/send",
  SystemUserAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        senderId,
        senderType,
        receiverId,
        receiverType,
        taskId,
        message,
        isGroup,
      } = req.body;
      const file = req.file;

      console.log(req.body, "jnjsnsh");

      if (!senderId || !senderType || (!message && !file)) {
        return errorResponse(
          res,
          "senderId, senderType and message/file are required"
        );
      }

      const fileUrl = file
        ? `http://localhost:3001/storege/userdp/${file.filename}`
        : null;
      const fileType = file ? file.mimetype : null;

      // If group message, send to task owner + particular bidder
      if (isGroup === "true") {
        console.log("1234");
        const taskInfo = await getTaskAndBidder(taskId);
        // taskInfo should return { ownerId, ownerType, bidderId, bidderType }
        console.log("execute");

        const chatEntries = [
          {
            senderId,
            senderType,
            receiverId: taskInfo.ownerId,
            receiverType: taskInfo.ownerType,
            taskId,
            message,
            fileUrl,
            fileType,
          },
          {
            senderId,
            senderType,
            receiverId: taskInfo.bidderId,
            receiverType: taskInfo.bidderType,
            taskId,
            message,
            fileUrl,
            fileType,
          },
        ];

        console.log("s 1");
        await ChatModel.bulkCreate(chatEntries);
        console.log("s 2");
        return successResponse(
          res,
          "Group message sent to task owner and bidder",
          chatEntries
        );
      } else {
        // Individual message
        const chat = await ChatModel.create({
          senderId,
          senderType,
          receiverId,
          receiverType,
          taskId,
          message,
          fileUrl,
          fileType,
        });
        return successResponse(res, "Message sent", chat);
      }
    } catch (error) {
      return errorResponse(res, "Failed to send message", error);
    }
  }
);

router.get("/conversation", SystemUserAuth, async (req, res) => {
  console.log("Query params:", req.query);

  try {
    const { senderId, receiverId, senderType, receiverType, taskId } = req.query;

    if (!senderId || !receiverId || !senderType || !receiverType || !taskId) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    const messages = await ChatModel.findAll({
      where: {
        taskId,
        [Op.or]: [
          { senderId, senderType, receiverId, receiverType },
          {
            senderId: receiverId,
            senderType: receiverType,
            receiverId: senderId,
            receiverType: senderType,
          },
        ],
      },
      order: [["timestamp", "ASC"]],
    });

    return successResponse(res, "Conversation fetched", messages);
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return errorResponse(res, "Failed to fetch messages", error);
  }
});



module.exports = router;
