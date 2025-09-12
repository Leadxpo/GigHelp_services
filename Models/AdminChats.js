const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AdminChats = sequelize.define(
    "AdminChats",
    {
      chatId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bidId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      disputeId: {
        type: DataTypes.INTEGER,
        allowNull: true, // null if not a dispute
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      senderType: {
        type: DataTypes.ENUM("admin", "owner", "bidder"),
        allowNull: false,
      },
      receiverType: {
        type: DataTypes.ENUM("admin", "owner", "bidder"),
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fileType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "AdminChats",
      timestamps: false,
    }
  );

  return AdminChats;
};
