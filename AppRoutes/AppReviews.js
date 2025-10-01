const { sequelize } = require('../db');
const ratingModel = require('../Models/Reviews')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// ✅ Create Rating
router.post("/create", async (req, res) => {
  try {
    const rating = await ratingModel.create(req.body);
    return successResponse(res, "Rating created successfully", rating);
  } catch (error) {
    return errorResponse(res, "Error creating rating", error);
  }
});

// ✅ Update Rating
router.patch("/update/:ratingId", async (req, res) => {
  try {
    const { ratingId } = req.params;
    const [updated] = await ratingModel.update(req.body, { where: { ratingId } });

    if (!updated) {
      return errorResponse(res, "Rating not found");
    }

    const updatedRating = await ratingModel.findByPk(ratingId);
    return successResponse(res, "Rating updated successfully", updatedRating);
  } catch (error) {
    return errorResponse(res, "Error updating rating", error);
  }
});

// ✅ Delete Rating
router.delete("/delete/:ratingId", async (req, res) => {
  try {
    const { ratingId } = req.params;
    const deleted = await ratingModel.destroy({ where: { ratingId } });

    if (!deleted) {
      return errorResponse(res, "Rating not found");
    }

    return successResponse(res, "Rating deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting rating", error);
  }
});

// ✅ Get Rating by ID
router.get("/getbyId/:ratingId", async (req, res) => {
  try {
    const { ratingId } = req.params;
    const rating = await ratingModel.findOne({
      where: { ratingId },
      include: [{ model: userModel }]
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
router.get("/getall", async (req, res) => {
  try {
    const ratings = await ratingModel.findAll({
      include: [{ model: userModel }]
    });
    return successResponse(res, "All ratings fetched successfully", ratings);
  } catch (error) {
    return errorResponse(res, "Error fetching ratings", error);
  }
});

// ✅ Search Ratings by User Name
router.get("/searchbyname", async (req, res) => {
  try {
    const { name } = req.query;
    const ratings = await ratingModel.findAll({
      include: {
        model: userModel,
        where: { firstName: { [Op.like]: `%${name}%` } }
      }
    });
    return successResponse(res, "Ratings found", ratings);
  } catch (error) {
    return errorResponse(res, "Error searching ratings", error);
  }
});

// ✅ Search Rating by taskId, reviewerId, revieweeId
router.get("/search", async (req, res) => {
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
router.get("/count", async (req, res) => {
  try {
    const count = await ratingModel.count();
    return successResponse(res, "Rating count fetched successfully", { count });
  } catch (error) {
    return errorResponse(res, "Error counting ratings", error);
  }
});

module.exports = router;
