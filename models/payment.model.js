module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Payment", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        amount: DataTypes.FLOAT,
        status: DataTypes.STRING,
        method: DataTypes.STRING,
    });
};