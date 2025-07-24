const { DataTypes, Sequelize } = require("sequelize");
module.exports = (Sequelize) => {
  const UserModel = Sequelize.define(
    "Users",
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userName: { type: DataTypes.STRING },

      phoneNumber: { type: DataTypes.STRING },

      email: { type: DataTypes.STRING, unique: true },

      password: { type: DataTypes.STRING },

      profilePic: { type: DataTypes.STRING },

      address: { type: DataTypes.STRING },

      gender: { type: DataTypes.STRING },
      
      remarks: { type: DataTypes.JSON, allowNull: true },

      identityProof: { type: DataTypes.JSON, allowNull: true },

      identityNumber: { type: DataTypes.STRING, JSON },

      chating: { type: DataTypes.STRING, JSON },

      skills: { type: DataTypes.JSON },

      experiance: { type: DataTypes.JSON },

      accountHolder: { type: DataTypes.JSON },

      accountNumber: { type: DataTypes.JSON },

      bankName: { type: DataTypes.JSON },

      ifscCode: { type: DataTypes.JSON },

      status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",
        validate: {
          isIn: [["Declined", "Approved", "Pending", "Rejected"]],
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
    },
    {
      timestamps: true,
      tableName: "Users",
    }
  );
  return UserModel;
};
