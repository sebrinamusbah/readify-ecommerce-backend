module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Order", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        total: DataTypes.FLOAT,
        status: { type: DataTypes.STRING, defaultValue: "pending" },
    });
};