module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Coupon", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: DataTypes.STRING, unique: true },
        type: DataTypes.STRING,
        value: DataTypes.FLOAT,
        expiryDate: DataTypes.DATE,
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        usageLimit: DataTypes.INTEGER,
        usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        minOrderAmount: DataTypes.FLOAT,
    });
};