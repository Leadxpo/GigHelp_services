const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Rating = sequelize.define(
    "ratings",
    {
      ratingId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      reviewerId: {
        type: DataTypes.INTEGER, // user who gives the rating
        allowNull: false,
      },

      revieweeId: {
        type: DataTypes.INTEGER, // user (e.g. bidder/admin) who receives the rating
        allowNull: false,
      },

      rating: {
        type: DataTypes.FLOAT, // 1 to 5
        allowNull: false,
      },

      comment: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: "ratings",
    }
  );

  return Rating;
};
