const { sequelize } = require('../db');
const transactionModel = require('../Models/Transections')(sequelize);
const userModel = require('../Models/SystemUser')(sequelize);
const { Op } = require("sequelize");
const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require("../Midileware/response");

// Create Transaction
router.post("/create", async (req, res) => {
  try {
    const transaction = await transactionModel.create(req.body);
    return successResponse(res, "Transaction created successfully", transaction);
  } catch (error) {
    return errorResponse(res, "Error creating transaction", error);
  }
});

// Update Transaction
router.patch("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await transactionModel.update(req.body, { where: { id } });
    return successResponse(res, "Transaction updated successfully", updatedTransaction);
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
    const transaction = await transactionModel.findOne({ where: { id }, include: userModel });
    return successResponse(res, "Transaction fetched successfully", transaction);
  } catch (error) {
    return errorResponse(res, "Error fetching transaction", error);
  }
});

// Get All Transactions
router.get("/getall", async (req, res) => {
  try {
    const transactions = await transactionModel.findAll({ include: userModel });
    return successResponse(res, "All transactions fetched successfully", transactions);
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
        where: { firstName: { [Op.like]: `%${name}%` } }
      }
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
    return successResponse(res, "Transaction count fetched successfully", { count });
  } catch (error) {
    return errorResponse(res, "Error counting transactions", error);
  }
});

module.exports = router;