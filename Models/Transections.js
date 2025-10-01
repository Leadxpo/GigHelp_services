// const { DataTypes } = require('sequelize');

// module.exports = (sequelize) => {
//   const Transaction = sequelize.define('Transaction', {
//     transactionId: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//       allowNull: false,
//     },

//     userId: {  // who paid
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     bidId: {  // who paid
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     taskId: {  // related task
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },

//     amount: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: false,
//     },

//     typeOfPayment: { // credit, debit, refund
//       type: DataTypes.STRING,
//       allowNull: false,
//     },

//     paymentMethod: { // UPI, CARD, BANK, WALLET
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     transactionRef: { // Payment Gateway ID
//       type: DataTypes.STRING,
//       allowNull: true,
//       unique: true,
//     },

//     dateOfPayment: {
//       type: DataTypes.DATE,
//       defaultValue: DataTypes.NOW,
//     },

//     status: {
//       type: DataTypes.ENUM("pending", "approved", "completed", "failed", "refunded"),
//       defaultValue: "pending",
//     },

//   }, {
//     timestamps: true,
//     tableName: "Transactions"
//   });

//   return Transaction;
// };

const { request } = require("express");
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SubCategory = sequelize.define(
    "Transections",
    {
      transactionId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      userId: {
        // who initiated the payment
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      bidId: {
        // related bid (null if Task Owner → Admin)
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      taskId: {
        // related task
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      typeOfPayment: {
        // credit, debit, refund
        type: DataTypes.STRING,
        allowNull: false,
      },

      paymentMethod: {
        // UPI, CARD, BANK, WALLET
        type: DataTypes.STRING,
        allowNull: true,
      },

      transactionRef: {
        // Payment Gateway ID
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },

      dateOfPayment: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",
          "approved",
          "completed",
          "failed",
          "refunded"
        ),
        defaultValue: "pending",
      },

      // New field to track who paid
      payerRole: {
        type: DataTypes.ENUM("taskOwner", "admin"),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "Transactions",
    }
  );

  return SubCategory;
};
