const { combine, timestamp, json } = require("winston").format;

exports.jsonFormat = combine(timestamp(), json());