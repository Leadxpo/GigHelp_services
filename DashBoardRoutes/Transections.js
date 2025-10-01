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

// router.post("/create", async (req, res) => {
//   try {
//     console.log("Received transaction data:", req.body); // ✅ Debug line
//     const transaction = await transactionModel.create(req.body);
//     return successResponse(res, "Transaction created successfully", transaction);
//   } catch (error) {
//     console.error("Transaction creation error:", error); // ✅ Log error
//     return errorResponse(res, "Error creating transaction", error);
//   }
// });

// Update Transaction

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
    const updatedPaid = (request.paidAmount || 0) + amount;
    const updatedBalance = (request.amount || 0) - updatedPaid;

    await request.update({
      paidAmount: updatedPaid,
      balanceAmount: updatedBalance,
      status: "paid",
    });

    const task = await taskModel.findByPk(taskId);
    const bid = await bidModel.findByPk(bidId);
    console.log("Task status:", task.status);
    console.log("Bid status:", bid.status);

    if (
      task.status === "paymentRequested" &&
      bid.status === "paymentRequested"
    ) {
      console.log("Updating task and bid status to completed");
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
// router.get("/get-all", async (req, res) => {
//   try {
//     const transactions = await transactionModel.findAll();
//     return successResponse(res, "All transactions fetched successfully", transactions);
//   } catch (error) {
//     return errorResponse(res, "Error fetching transactions", error);
//   }
// });

router.get("/get-all", async (req, res) => {
  try {
    const transactions = await transactionModel.findAll();

    // Map each transaction to include related info using IDs
    const detailedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        // Fetch task
        const task = await taskModel.findOne({ where: { taskId: tx.taskId } });

        // Fetch task user
        let taskUser = null;
        if (task?.userId) {
          taskUser = await uModel.findOne({ where: { userId: task.userId } });
        }

        // Fetch bid (if exists)
        let bid = null;
        let bidderUser = null;
        if (tx.bidId) {
          bid = await bidModel.findOne({ where: { bidId: tx.bidId } });
          if (bid?.userId) {
            bidderUser = await uModel.findOne({
              where: { userId: bid.userId },
            });
          }
        }

        return {
          ...tx.dataValues, // transaction fields
          taskDetails: task ? task.dataValues : null,
          taskOwnerDetails: taskUser ? taskUser.dataValues : null,
          bidDetails: bid ? bid.dataValues : null,
          bidderDetails: bidderUser ? bidderUser.dataValues : null,
        };
      })
    );

    return res.json({
      success: true,
      message: "All transactions fetched successfully",
      data: detailedTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
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
