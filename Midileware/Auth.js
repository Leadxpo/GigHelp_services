const jwt = require("jsonwebtoken");
const { sequelize } = require('../db');
const systemUserModel = require('../Models/SystemUser')(sequelize);
const UserModel = require('../Models/Users')(sequelize);
const { Op } = require("sequelize");

const SystemUserAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer"
    const verifyToken = jwt.verify(token, "vamsi@1998");

    const { userId } = verifyToken;

    // Fetch user by ID
    const user = await systemUserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }

    if (user.role !== "Super Admin" && user.role !== "Admin") {
      return res.status(403).json({ error: "Invalid user role" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization token missing or invalid" });
    }

    const token = authHeader.split(' ')[1]; // Extract token after "Bearer"
    const verifyToken = jwt.verify(token, "vamsi@1998");

    const { userId } = verifyToken;

    // Fetch user by ID
    const user = await UserModel.findOne({ where: { userId } });

    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const appUserAuth = async (req, res, next) => {
  try {
    // Check if session has user data
    if (!req.session.user || !req.session.user.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Fetch user from database to confirm validity
    const user = await UserModel.findOne({ where: { userId: req.session.user.userId } });

    if (!user) {
      return res.status(401).json({ error: "User does not exist" });
    }

    req.user = user; // Store user data in req.user
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = { SystemUserAuth, userAuth,appUserAuth };
