const { request } = require("express");
const { DataTypes } = require("sequelize");
const moment = require("moment");

module.exports = (sequelize) => {
  const SubCategory = sequelize.define(
    "bids",
    {
      BidId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      bidOfAmount: { type: DataTypes.STRING },

      // dateOfBids: { type: DataTypes.STRING },

      Categories: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      SubCategory: {
        type: DataTypes.STRING,
      },
      targetedPostIn: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.STRING,
      },

      bidUserId: { type: DataTypes.STRING },

      taskUserId: {
        type: DataTypes.STRING,
      },

      userId: { type: DataTypes.STRING },

      taskId: { type: DataTypes.STRING },

      description: {
        type: DataTypes.TEXT,
      },

      taskDescription: {
        type: DataTypes.TEXT,
      },

      biderDocument: {
        type: DataTypes.JSON,
      },

      taskDocument: {
        type: DataTypes.JSON,
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "approval", "completed", "rejected", "running"]],
        },
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

      daysLeft: {
        type: DataTypes.VIRTUAL,
        get() {
          const endDate = moment(this.getDataValue("dateOfBids"));
          const today = moment();

          if (!endDate.isValid()) return "Invalid End Date";

          const daysLeft = endDate.diff(today, "days");
          return daysLeft >= 0 ? `${daysLeft} Days Left` : "Expired";
        },
      },
    },
    {
      timestamps: true,
      tableName: "bids",
    }
  );

  return SubCategory;
};
