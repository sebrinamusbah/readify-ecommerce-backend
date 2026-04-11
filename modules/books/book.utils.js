const parseBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
};

const parseNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

module.exports = {
  parseBoolean,
  parseNumber,
};
