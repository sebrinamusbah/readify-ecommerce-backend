exports.toFixedNumber = (num, decimals = 2) => {
    return Number(num.toFixed(decimals));
};

exports.randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};