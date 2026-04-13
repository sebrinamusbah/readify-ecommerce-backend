module.exports = (sequelize, DataTypes) => {
    return sequelize.define("OrderItem", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        quantity: DataTypes.INTEGER,
        price: DataTypes.FLOAT,
    });
};