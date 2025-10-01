const { sequelize } = require("../db");
const ratingModel = require("../Models/Reviews")(sequelize);
const userModel = require("../Models/Users")(sequelize);
const taskModel = require("../Models/Task")(sequelize);
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");
const { userAuth } = require("../Midileware/Auth");

// ✅ Create Rating
router.post("/create", userAuth, async (req, res) => {
  try {
    const rating = await ratingModel.create({
      ...req.body,
      reviewerId: req.user.id, // ensure reviewer is logged-in user
    });
    return successResponse(res, "Rating created successfully", rating);
  } catch (error) {
    return errorResponse(res, "Error creating rating", error);
  }
});

// ✅ Update Rating
router.patch("/update/:id", userAuth, async (req, res) => {
  try {
    const [updated] = await ratingModel.update(req.body, {
      where: { ratingId: req.params.id, reviewerId: req.user.id }, // only reviewer can update
    });

    if (!updated) {
      return errorResponse(res, "Rating not found or unauthorized");
    }

    const updatedRating = await ratingModel.findByPk(req.params.id);
    return successResponse(res, "Rating updated successfully", updatedRating);
  } catch (error) {
    return errorResponse(res, "Error updating rating", error);
  }
});

// ✅ Delete Rating
router.delete("/delete/:id", userAuth, async (req, res) => {
  try {
    const deleted = await ratingModel.destroy({
      where: { ratingId: req.params.id, reviewerId: req.user.id },
    });

    if (!deleted) {
      return errorResponse(res, "Rating not found or unauthorized");
    }

    return successResponse(res, "Rating deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting rating", error);
  }
});

// ✅ Get Rating By ID
router.get("/get/:id", userAuth, async (req, res) => {
  try {
    const rating = await ratingModel.findByPk(req.params.id, {
      include: [
        {
          model: userModel,
          as: "reviewer",
          attributes: ["userId", "userName", "email"],
        },
        {
          model: userModel,
          as: "reviewee",
          attributes: ["userId", "userName", "email"],
        },
        { model: taskModel, as: "task" },
      ],
    });

    if (!rating) {
      return errorResponse(res, "Rating not found");
    }

    return successResponse(res, "Rating fetched successfully", rating);
  } catch (error) {
    return errorResponse(res, "Error fetching rating", error);
  }
});

// ✅ Get All Ratings
router.get("/all", userAuth, async (req, res) => {
  try {
    const ratings = await ratingModel.findAll({
      include: [
        {
          model: userModel,
          as: "reviewer",
          attributes: ["userId", "userName"],
        },
        {
          model: userModel,
          as: "reviewee",
          attributes: ["userId", "userName"],
        },
      ],
    });

    return successResponse(res, "All ratings fetched successfully", ratings);
  } catch (error) {
    return errorResponse(res, "Error fetching ratings", error);
  }
});

// ✅ Get All Ratings For A Specific User (with average)
router.get("/user/:userId", userAuth, async (req, res) => {
  try {
    const ratings = await ratingModel.findAll({
      where: { revieweeId: req.params.userId },
      include: [
        {
          model: userModel,
          as: "reviewer",
          attributes: ["userId", "userName"],
        },
      ],
    });

    if (!ratings.length) {
      return successResponse(res, "No ratings found for this user", {
        averageRating: 0,
        ratings: [],
      });
    }

    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    return successResponse(res, "User ratings fetched successfully", {
      averageRating: avgRating.toFixed(2),
      totalReviews: ratings.length,
      ratings,
    });
  } catch (error) {
    return errorResponse(res, "Error fetching user ratings", error);
  }
});

// ✅ Search Ratings by Comment
router.get("/search", userAuth, async (req, res) => {
  try {
    console.log("Received search request with query:", req.query);
    const { taskId, reviewerId, revieweeId } = req.query.params; // <-- use req.query directly

    const whereClause = {};
    if (taskId) whereClause.taskId = taskId;
    if (reviewerId) whereClause.reviewerId = reviewerId;
    if (revieweeId) whereClause.revieweeId = revieweeId;

    const rating = await ratingModel.findAll({
      where: whereClause,
    });

    return successResponse(res, "Rating search completed", rating);
  } catch (error) {
    return errorResponse(res, "Error searching rating", error);
  }
});

// ✅ Count Ratings
router.get("/count", userAuth, async (req, res) => {
  try {
    const count = await ratingModel.count();
    return successResponse(res, "Ratings count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting ratings", error);
  }
});

module.exports = router;
