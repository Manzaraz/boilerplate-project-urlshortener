const mongoose = require("mongoose");
// const uniqueValidator = require('mongoose-unique-validator');

const shortSchema = mongoose.Schema({
  original_url: { type: String, required: true, unique: true },
  short_url: { type: String },
});
// shortSchema.plugin(uniqueValidator);
module.exports = mongoose.model("ShortURL", shortSchema);
