const { sequelize } = require("../db");
const transactionModel = require("../Models/Transections")(sequelize);
const taskModel = require("../Models/Task")(sequelize);
const requestModel = require("../Models/Requests")(sequelize);
const bidModel = require("../Models/Bids")(sequelize);
const uModel = require("../Models/Users")(sequelize);
const userModel = require("../Models/SystemUser")(sequelize);
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// Create Transaction
router.post("/create", async (req, res) => {
  try {
    const {
      userId,
      taskId,
      bidId,
      amount,
      typeOfPayment,
      paymentMethod,
      payerRole,
    } = req.body;

    console.log("Received transaction data:", req.body); // ✅ Debug line

    // const payerRole = bidId ? "admin" : "taskOwner";

    const transaction = await transactionModel.create({
      userId,
      taskId,
      bidId: bidId || null,
      amount,
      typeOfPayment,
      paymentMethod: paymentMethod || null,
      status: "pending",
      payerRole,
    });
    const request = await requestModel.findOne({ where: { taskId } });
    if (request) {
      const updatedPaid = (request.paidAmount || 0) + amount;
      const updatedBalance = (request.amount || 0) - updatedPaid;

      await request.update({
        paidAmount: updatedPaid,
        balanceAmount: updatedBalance,
        status: "paid",
      });
    }

    const task = await taskModel.findByPk(taskId);
    const bid = await bidModel.findByPk(bidId);

    if (
      task.status === "paymentRequested" &&
      bid.status === "paymentRequested"
    ) {
      await task.update({ status: "completed" });
      await bid.update({ status: "completed" });
    }

    return successResponse(res, "Payment completed successfully", {
      transaction,
      request,
      task,
      bid,
    });
  } catch (error) {
    console.error("Transaction creation error:", error);
    return errorResponse(res, "Error creating transaction", error.message);
  }
});

// Update Transaction
router.patch("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await transactionModel.update(req.body, {
      where: { id },
    });
    return successResponse(
      res,
      "Transaction updated successfully",
      updatedTransaction
    );
  } catch (error) {
    return errorResponse(res, "Error updating transaction", error);
  }
});

// Delete Transaction
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await transactionModel.destroy({ where: { id } });
    return successResponse(res, "Transaction deleted successfully");
  } catch (error) {
    return errorResponse(res, "Error deleting transaction", error);
  }
});

// Get Transaction by ID
router.get("/getbyId/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionModel.findOne({
      where: { id },
      include: userModel,
    });
    return successResponse(
      res,
      "Transaction fetched successfully",
      transaction
    );
  } catch (error) {
    return errorResponse(res, "Error fetching transaction", error);
  }
});

// Get All Transactions
router.get("/getall", async (req, res) => {
  try {
    const transactions = await transactionModel.findAll({ include: userModel });
    return successResponse(
      res,
      "All transactions fetched successfully",
      transactions
    );
  } catch (error) {
    return errorResponse(res, "Error fetching transactions", error);
  }
});

// Search Transaction by User Name
router.get("/searchbyname", async (req, res) => {
  try {
    const { name } = req.query;
    const transactions = await transactionModel.findAll({
      include: {
        model: userModel,
        where: { firstName: { [Op.like]: `%${name}%` } },
      },
    });
    return successResponse(res, "Transactions found", transactions);
  } catch (error) {
    return errorResponse(res, "Error searching transactions", error);
  }
});

// Count Transactions
router.get("/count", async (req, res) => {
  try {
    const count = await transactionModel.count();
    return successResponse(res, "Transaction count fetched successfully", {
      count,
    });
  } catch (error) {
    return errorResponse(res, "Error counting transactions", error);
  }
});

module.exports = router;
