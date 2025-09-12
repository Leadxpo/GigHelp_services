const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Disputes = sequelize.define(
    "Disputes",
    {
      disputeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      taskId: { type: DataTypes.INTEGER, allowNull: true },
      bidId: { type: DataTypes.INTEGER, allowNull: true },
      raisedBy: { type: DataTypes.INTEGER, allowNull: false },
      raisedByType: {
        type: DataTypes.ENUM("taskOwner", "bidder"),
        allowNull: false,
      },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("open", "resolved", "closed"),
        defaultValue: "open",
      },
      adminAssignedId: { type: DataTypes.INTEGER, allowNull: true },
      files: { type: DataTypes.JSON, allowNull: true }, // store multiple files [{fileUrl, fileType}]
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "Disputes", timestamps: false }
  );

  return Disputes;
};
