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




module.exports = router;
