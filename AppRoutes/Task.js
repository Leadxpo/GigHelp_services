const express = require("express");
const { sequelize } = require("../db");
const TaskModel = require("../Models/Task")(sequelize);
const SystemUserModel = require("../Models/SystemUser")(sequelize);
const UserModel = require("../Models/Users")(sequelize);
const { Op } = require("sequelize");
const { successResponse, errorResponse } = require("../Midileware/response");
const { deleteImage } = require("../Midileware/deleteimages");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Image configuration
const imageconfig = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./storage/task");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: imageconfig,
  limits: { fileSize: 1000000000 },
});

// Set up multer for handling form data

router.post("/create", upload.array("document"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    // build full file URLs
    const filePaths = req.files.map(
      // (file) => `http://localhost:3001/storage/task/${file.filename}`
      (file) => `${file.filename}`
    );

    // create task with full URLs in 'document'
    const taskData = await TaskModel.create({
      ...req.body,
      document: filePaths,
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

// Update Task

// router.patch("/update-task", upload.array("documents"), async (req, res) => {
//   try {
//     console.log("Received Body:", req.body);
//     console.log("Received Files:", req.files);

//     const { taskId, existingDocuments } = req.body;

//     if (!taskId) {
//       return res.status(400).json({
//         success: false,
//         message: "taskId is required",
//       });
//     }

//     // Build new file paths from uploaded files
//     const newFilePaths = req.files.map((file) => `${file.filename}`);

//     // If there are existing documents, keep them
//     let allDocuments = [];
//     if (existingDocuments) {
//       // Handle both string and array cases
//       allDocuments = Array.isArray(existingDocuments)
//         ? existingDocuments
//         : [existingDocuments];
//     }

//     // Merge old + new documents
//     allDocuments = [...allDocuments, ...newFilePaths];

//     // Update task
//     const [rowsUpdated] = await TaskModel.update(
//       {
//         ...req.body,
//         document: allDocuments,
//       },
//       { where: { taskId } }
//     );

//     if (rowsUpdated === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Task updated successfully",
//     });
//   } catch (error) {
//     console.error("Error updating task:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error updating task",
//       error: error.message,
//     });
//   }
// });

router.patch("/update-task", upload.array("documents"), async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    const { taskId, ...restBody } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "taskId is required",
      });
    }

    const existingTask = await TaskModel.findOne({ where: { taskId } });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // const existingDocuments = existingTask.document || [];
    const existingDocuments = req.body.existingDocuments || [];
    console.log(existingDocuments,"eeeee")

    const newFilePaths = req.files?.map((file) => file.filename) || [];

    const allDocuments = [...existingDocuments, ...newFilePaths];

    const [rowsUpdated] = await TaskModel.update(
      {
        ...restBody, // other fields
        document: allDocuments,
      },
      { where: { taskId } }
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not updated",
      });
    }

    // 6️⃣ Fetch updated task
    const updatedTask = await TaskModel.findOne({ where: { taskId } });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
});

// router.patch("/update-task", upload.array("documents"), async (req, res) => {
//   try {
//     console.log("Received Body:", req.body);
//     console.log("Received Files:", req.files);

//     const { taskId, existingDocuments, ...restBody } = req.body;

//     if (!taskId) {
//       return res.status(400).json({
//         success: false,
//         message: "taskId is required",
//       });
//     }

//     // Handle new uploads
//     const newFilePaths = req.files?.map((file) => file.filename) || [];

//     // Handle old documents
//     let allDocuments = [];
//     if (existingDocuments) {
//       allDocuments = Array.isArray(existingDocuments)
//         ? existingDocuments
//         : [existingDocuments];
//     }

//     // Merge old + new docs
//     allDocuments = [...allDocuments, ...newFilePaths];

//     // Update task
//     const [rowsUpdated] = await TaskModel.update(
//       {
//         ...restBody, // only other fields (not taskId, not existingDocuments)
//         document: allDocuments, // store merged documents
//       },
//       { where: { taskId } }
//     );

//     if (rowsUpdated === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     // Fetch updated task
//     const updatedTask = await TaskModel.findOne({ where: { taskId } });

//     return res.status(200).json({
//       success: true,
//       message: "Task updated successfully",
//       task: updatedTask,
//     });
//   } catch (error) {
//     console.error("Error updating task:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error updating task",
//       error: error.message,
//     });
//   }
// });

// Delete Task
router.delete("/delete-task", async (req, res) => {
  try {
    console.log(req.query, "kjnsdf");
    const { taskId } = req.query;
    await TaskModel.destroy({ where: { taskId } });
    return successResponse(res, "Task deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting task", error);
  }
});

// router.get("/get-task", async (req, res) => {
//   try {
//     console.log(req.query,"bbbbbb")
//     const { taskId } = req.query;

//     if (!taskId) {
//       return res.status(400).json({
//         success: false,
//         message: "taskId is required",
//       });
//     }

//     const task = await TaskModel.findOne({
//       where: { taskId: parseInt(taskId) },
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     console.log(task,"taskkkkkkkjsnsdnsdh")

//     return successResponse(res, "Task fetched successfully", task);
//   } catch (error) {
//     console.error("Error fetching task:", error);
//     return errorResponse(res, "Error fetching task", error);
//   }
// });

router.get("/get-task", async (req, res) => {
  try {
    console.log(req.query, "bbbbbb");
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "taskId is required",
      });
    }

    // Step 1: Find task
    const task = await TaskModel.findOne({
      where: { taskId: parseInt(taskId) },
      raw: true, // makes it a plain JS object
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Step 2: Find user using task.userId
    const user = await UserModel.findOne({
      where: { userId: task.userId },
      attributes: [
        "userId",
        "name",
        "userName",
        "phoneNumber",
        "email",
        "profilePic",
      ],
      raw: true,
    });

    // Step 3: Merge user inside task
    const taskWithUser = {
      ...task,
      user, // user will now be a property inside task
    };

    return successResponse(res, "Task fetched successfully", taskWithUser);
  } catch (error) {
    console.error("Error fetching task:", error);
    return errorResponse(res, "Error fetching task", error);
  }
});

router.post("/get-task-by-user", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const task = await TaskModel.findAll({
      where: { userId: parseInt(userId) },
    });

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
router.get("/get-all", async (req, res) => {
  try {
    const tasks = await TaskModel.findAll({
      where: { status: "verified" },
    });
    return successResponse(res, "All tasks fetched successfully", tasks);
  } catch (error) {
    return errorResponse(res, "Error fetching tasks", error);
  }
});

// Search Task by Name
router.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    const tasks = await TaskModel.findAll({
      where: { name: { [Op.like]: `%${name}%` } },
    });
    return successResponse(res, "Tasks found successfully", tasks);
  } catch (error) {
    return errorResponse(res, "Error searching tasks", error);
  }
});

// Count Tasks
router.get("/count", async (req, res) => {
  try {
    const count = await TaskModel.count();
    return successResponse(res, "Task count fetched successfully", { count });
  } catch (error) {
    return errorResponse(res, "Error counting tasks", error);
  }
});

// Count Tasks by specific UserId
router.get("/count-by-userId", async (req, res) => {
  console.log(req.query); // Log the incoming query parameters
  const { userId } = req.body;

  if (!userId) {
    return errorResponse(res, "UserId is required");
  }

  try {
    const count = await TaskModel.count({
      where: { UserId: userId }, // Fix is here
    });

    return successResponse(res, "Task count for UserId fetched successfully", {
      userId,
      taskCount: count,
    });
  } catch (error) {
    return errorResponse(res, "Error counting tasks by UserId", error);
  }
});

// Task Page with User Reference
router.get("/task-with-user", async (req, res) => {
  try {
    const tasks = await TaskModel.findAll({
      include: [
        { model: UserModel, attributes: ["userId", "email", "firstName"] },
      ],
    });
    return successResponse(
      res,
      "Tasks with user reference fetched successfully",
      tasks
    );
  } catch (error) {
    return errorResponse(
      res,
      "Error fetching tasks with user reference",
      error
    );
  }
});

// GET: /task-summary-by-user?userId=123
router.get("/task-summary-by-user", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, "userId is required");
    }

    const [totalTasks, disputeTasks, completedTasks] = await Promise.all([
      TaskModel.count({ where: { userId } }),
      TaskModel.count({ where: { userId, status: "dispute" } }),
      TaskModel.count({ where: { userId, status: "completed" } }),
    ]);

    return successResponse(res, "Task summary fetched successfully", {
      userId,
      totalTasks,
      disputeTasks,
      completedTasks,
    });
  } catch (error) {
    return errorResponse(res, "Error fetching task summary", error);
  }
});

module.exports = router;
