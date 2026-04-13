module.exports = (sequelize, DataTypes) => {
    return sequelize.define("Book", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING,
        author: DataTypes.STRING,
        price: DataTypes.FLOAT,
        description: DataTypes.TEXT,
        stock: DataTypes.INTEGER,
    });
};