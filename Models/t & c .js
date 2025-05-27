const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid'); // Add this for UUIDs

module.exports = (Sequelize) => {
    const usermodel = Sequelize.define('termsconditions',
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: uuidv4, // ✅ Generate UUID automatically
            },
            heading: { type: DataTypes.STRING },
            description: { type: DataTypes.TEXT },
            termsFile: { type: DataTypes.JSON },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            timestamps: true,
            tableName: 'termsconditions'
        }
    );
    return usermodel;
};
