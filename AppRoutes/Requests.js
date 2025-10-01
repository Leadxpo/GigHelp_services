const { sequelize } = require('../db');
const requestModel = require('../Models/Requests')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// Create Request
// router.post("/create",  async (req, res) => {
//   try {
//     const request = await requestModel.create({ ...req.body, userId: req.user.id });
//     return successResponse(res, "Request created successfully", request);
//   } catch (error) {
//     return errorResponse(res, "Error creating request", error);
//   }
// });

router.post("/create", async (req, res) => {
  try {
    const { amount, taskId, bidId, description, requestType, ownerId,bidOfAmount } = req.body;
    console.log("Incoming create request body:", req.body);
    console.log("User making the request:", req.body.ownerId);


    // Find total bid amount
    console.log("Check 1")
    // const bid = await bidModel.findByPk(bidId);
    console.log("Check 2")
    // if (!bid) return errorResponse(res, "Bid not found");
    
console.log("Check 2")
    // Find all previous requests for this bid
    const previousRequests = await requestModel.findAll({ where: { bidId } });
    console.log("previousRequests:", previousRequests);

    // Calculate total paid so far
    const totalPaid = previousRequests.reduce(
      (sum, r) => sum + (r.paidAmount || 0),
      0
    );

    const balance = bidOfAmount - totalPaid - Number(amount);
    console.log("Check 3")

    const newRequest = await requestModel.create({
      taskId,
      bidId,
      amount,
      description,
      requestType, // "advance" or "completion"
      userId: ownerId,
      paidAmount: 0, // Admin updates this later
      balanceAmount: balance >= 0 ? balance : 0,
    });
    console.log("Check 2")

    return successResponse(res, "Request created successfully", newRequest);
  } catch (error) {
    return errorResponse(res, "Error creating request", error);
  }
});


// Update Request
router.patch("/update/:id",  async (req, res) => {
  try {
    const request = await requestModel.update(req.body, { where: { id: req.params.id } });
    return successResponse(res, "Request updated successfully", request);
  } catch (error) {
    return errorResponse(res, "Error updating request", error);
  }
});

// Delete Request
router.delete("/delete/:id",  async (req, res) => {
  try {
    await requestModel.destroy({ where: { id: req.params.id } });
    return successResponse(res, "Request deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting request", error);
  }
});

// Get Request By ID
router.get("/get/:id",  async (req, res) => {
  try {
    const request = await requestModel.findOne({ where: { id: req.params.id }, include: userModel });
    return successResponse(res, "Request fetched successfully", request);
  } catch (error) {
    return errorResponse(res, "Error fetching request", error);
  }
});

// Get all requests by bidId
router.get("/by-bid/:bidId", async (req, res) => {

  try {
    const { bidId } = req.params;
    console.log("Fetching requests for bidId:", bidId);
    const requests = await requestModel.findAll({
      where: { bidId },
      // include: userModel,
      // order: [["createdAt", "DESC"]],
    });

    console.log("Fetched requests:", requests);

    return successResponse(res, "Requests for this bid fetched successfully", requests);
  } catch (error) {
    return errorResponse(res, "Error fetching requests by bid", error);
  }
});

// Get All Requests
router.get("/all",  async (req, res) => {
  try {
    const requests = await requestModel.findAll({ include: userModel });
    return successResponse(res, "All requests fetched successfully", requests);
  } catch (error) {
    return errorResponse(res, "Error fetching requests", error);
  }
});

// Search Request By Name
router.get("/search",  async (req, res) => {
  try {
    const { name } = req.query;
    const requests = await requestModel.findAll({ where: { requestName: { [Op.like]: `%${name}%` } } });
    return successResponse(res, "Requests fetched successfully", requests);
  } catch (error) {
    return errorResponse(res, "Error searching requests", error);
  }
});

// Count Requests
router.get("/count",  async (req, res) => {
  try {
    const count = await requestModel.count();
    return successResponse(res, "Request count fetched successfully", count);
  } catch (error) {
    return errorResponse(res, "Error counting requests", error);
  }
});

module.exports = router;
