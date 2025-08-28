const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  key: { type: String, required: true },
  mimetype: String,
  size: Number,
});

const dataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Please provide a title"],
    trim: true,
  },
  encryptedValue: {
    type: String,
    required: [true, "Please provide a value"],
  },
  fileinfo: [fileSchema],
  createdAt: { type: Date, default: Date.now },
});

const Data = mongoose.model("Data", dataSchema);
module.exports = Data;
