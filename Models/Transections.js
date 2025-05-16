const { request } = require('express');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SubCategory = sequelize.define('Transections', {
        transectionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          
        },

        dateOfPayment: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING },
        taskOwner: { type: DataTypes.STRING },
        taskUser: { type: DataTypes.STRING },
        userId: { type: DataTypes.STRING },
        typeOfPayment: { type: DataTypes.STRING },
        amount: { type: DataTypes.STRING },
        categoryName:{ type: DataTypes.STRING },
        status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "approval", "completed", "rejected",]],
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
    }, {
        timestamps: true,
        tableName: 'Transections'
    });

    return SubCategory;
}
