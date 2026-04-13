module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Wishlist", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    });
};