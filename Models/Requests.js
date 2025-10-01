const { request } = require("express");
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SubCategory = sequelize.define(
    "requests",
    {
      requestId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      dateOfRequest: { type: DataTypes.STRING },

      requestName: { type: DataTypes.STRING },

      requestBy: { type: DataTypes.STRING },

      description: { type: DataTypes.STRING },

      amount: { type: DataTypes.FLOAT }, 
      paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      balanceAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      requestType: { type: DataTypes.STRING }, // "advance" | "completion"

      taskId: { type: DataTypes.STRING },

      bidId: { type: DataTypes.STRING },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "paid"),
        defaultValue: "pending",
        allowNull: false,
      },

      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      tableName: "requests",
    }
  );

  return SubCategory;
};
