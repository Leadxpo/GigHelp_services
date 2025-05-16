const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('notifications', {
        notificationId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        title: { 
            type: DataTypes.STRING,
            allowNull: false,
        },

        message: { 
            type: DataTypes.TEXT,
            allowNull: false,
        },

        userId: { 
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        timestamps: true,
        tableName: 'notifications',
    });

    return Notification;
};
