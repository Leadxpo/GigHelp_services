const { DataTypes } = require("sequelize");
const moment = require("moment");

module.exports = (sequelize) => {
  const TaskModel = sequelize.define(
    "Task",
    {
      taskId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      task: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      Categories: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      SubCategory: {
        type: DataTypes.STRING,
      },
      from: {
        type: DataTypes.STRING,
      },
      to: {
        type: DataTypes.STRING,
      },
      targetedPostIn: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.STRING,
      },
      taskUserId: {
        type: DataTypes.STRING,
      },

      userId: {
        type: DataTypes.STRING,
      },
      endData: {
        type: DataTypes.STRING, // (Optional) You can change this to DataTypes.DATE if you want cleaner handling
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      document: {
        type: DataTypes.JSON, // or TEXT, depending on your DB support
        allowNull: true,
      },

      description: { type: DataTypes.TEXT },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: [
            [
              "pending",
              "verified",
              "assigned",
              "disputed",
              "completed",
              "rejected",
              "paymentRequested",
            ],
          ],
        },
      },
      remarks: { type: DataTypes.TEXT },
      assignedBidderId: {
        type: DataTypes.STRING,
      },

      daysLeft: {
        type: DataTypes.VIRTUAL,
        get() {
          const endDate = moment(this.getDataValue("endData"));
          const today = moment();

          if (!endDate.isValid()) return "Invalid End Date";

          const daysLeft = endDate.diff(today, "days");
          return daysLeft >= 0 ? `${daysLeft} Days Left` : "Expired";
        },
      },
    },
    {
      timestamps: true,
      tableName: "Task",
    }
  );

  return TaskModel;
};
