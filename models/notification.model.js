module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Notification", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        message: DataTypes.STRING,
        type: DataTypes.STRING,
        isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    });
};