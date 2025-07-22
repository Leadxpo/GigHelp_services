const express = require('express');
const { sequelize } = require('../db');
const TaskModel = require('../Models/Task')(sequelize);
const UserModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");
const { deleteImage } = require("../Midileware/deleteimages");
const multer = require('multer');
const path = require('path');
const fs = require("fs");

const router = express.Router();
const uploadDir = path.join(__dirname, "../storage/task");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 }
});



// Set up multer for handling form data

router.post("/create", userAuth, upload.array("document"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    // Get just the file names instead of full paths
    const fileNames = req.files.map((file) => file.filename);

    // Create task with filenames in 'document'
    const taskData = await TaskModel.create({
      ...req.body,
      document: fileNames, // Store only the file names here
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: taskData,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
});



router.put("/update/:taskId", userAuth, async (req, res) => {
  try {
    const { taskId } = req.params; // ← Get from params, not body
    const updatedTask = await TaskModel.update(req.body, { where: { taskId } });
    return successResponse(res, "Task updated successfully", updatedTask);
  } catch (error) {
    return errorResponse(res, "Error updating task", error);
  }
});


router.put("/update-status", userAuth, async (req, res) => {
  try {
    const { taskId } = req.body; // ← Get from params, not body
    const updatedTask = await TaskModel.update(req.body, { where: { taskId } });
    return successResponse(res, "Task updated successfully", updatedTask);
  } catch (error) {
    return errorResponse(res, "Error updating task", error);
  }
});

// Delete Task
router.delete("/delete/:taskId", userAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    await TaskModel.destroy({ where: { taskId } });
    return successResponse(res, "Task deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting task", error);
  }
});

router.get("/get-task/:taskId", userAuth, async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "taskId is required",
      });
    }

    const task = await TaskModel.findOne({ where: { taskId: parseInt(taskId) } });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return successResponse(res, "Task fetched successfully", task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return errorResponse(res, "Error fetching task", error);
  }
});


router.post("/get-task-by-user", userAuth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const task = await TaskModel.findAll({ where: { userId: parseInt(userId) } });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return successResponse(res, "Task fetched successfully", task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return errorResponse(res, "Error fetching task", error);
  }
});


// Get All Tasks
router.get("/get-all", userAuth, async (req, res) => {
  try {
    const tasks = await TaskModel.findAll();
    return successResponse(res, "All tasks fetched successfully", tasks);
  } catch (error) {
    return errorResponse(res, "Error fetching tasks", error);
  }
});

// Search Task by Name
router.get("/search", userAuth, async (req, res) => {
  try {
    const { name } = req.query;
    const tasks = await TaskModel.findAll({ where: { name: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Tasks found successfully", tasks);
  } catch (error) {
    return errorResponse(res, "Error searching tasks", error);
  }
});

// Count Tasks
router.get("/count", userAuth, async (req, res) => {
  try {
    const count = await TaskModel.count();
    return successResponse(res, "Task count fetched successfully", { count });
  } catch (error) {
    return errorResponse(res, "Error counting tasks", error);
  }
});


// Count Tasks by specific UserId
router.get("/count-by-userId", userAuth, async (req, res) => {
  console.log(req.query);  // Log the incoming query parameters
  const { userId } = req.body;

  if (!userId) {
    return errorResponse(res, "UserId is required");
  }

  try {
    const count = await TaskModel.count({
      where: { UserId: userId }  // Fix is here
    });

    return successResponse(res, "Task count for UserId fetched successfully", { userId, taskCount: count });
  } catch (error) {
    return errorResponse(res, "Error counting tasks by UserId", error);
  }
});

// Task Page with User Reference
router.get("/task-with-user", userAuth, async (req, res) => {
  try {
    const tasks = await TaskModel.findAll({
      include: [{ model: UserModel, attributes: ['userId', 'email', 'firstName'] }]
    });
    return successResponse(res, "Tasks with user reference fetched successfully", tasks);
  } catch (error) {
    return errorResponse(res, "Error fetching tasks with user reference", error);
  }
});


// GET: /task-summary-by-user?userId=123
router.get("/task-summary-by-user", userAuth, async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required");
    }

    const [totalTasks, disputeTasks, completedTasks] = await Promise.all([
      TaskModel.count({ where: { userId } }),
      TaskModel.count({ where: { userId, status: 'dispute' } }),
      TaskModel.count({ where: { userId, status: 'completed' } }),
    ]);

    return successResponse(res, "Task summary fetched successfully", {
      userId,
      totalTasks,
      disputeTasks,
      completedTasks
    });
  } catch (error) {
    return errorResponse(res, "Error fetching task summary", error);
  }
});




module.exports = router;
