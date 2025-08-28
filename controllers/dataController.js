const Data = require("../models/dataModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const { uploadFile, getFileUrl, deleteFile } = require("../utils/s3");
const { encryptValue, decryptValue } = require("../utils/crypto");

// savedata
exports.saveData = async (req, res) => {
  try {
    const { title, value } = req.body;
    const userId = req.user._id;

    const encryptedValue = await encryptValue(value);

    let filesinfo = [];
    if (req.files && req.files.length > 0) {
      filesinfo = await Promise.all(req.files.map(uploadFile));
    }

    const data = await Data.create({
      userId,
      title,
      encryptedValue,
      fileinfo: filesinfo,
    });

    res.status(201).json({
      status: "success",
      data,
      message: "Secret added successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// getdata
exports.getData = async (req, res) => {
  try {
    const userId = req.user._id;

    const encryptedData = await Data.find({ userId });

    const decryptedData = await encryptedData.map((item) => ({
      _id: item._id,
      title: item.title,
      value: decryptValue(item.encryptedValue),
      createdAt: item.createdAt,
    }));
    res.status(200).json({
      status: "success",
      data: decryptedData,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// delete item
exports.deleteItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    const item = await Data.findOne({ _id: itemId, userId });

    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Item not found or does not belong to you",
      });
    }

    if (item.fileinfo && item.fileinfo.length > 0) {
      await Promise.all(item.fileinfo.map((file) => deleteFile(file.key)));
    }

    await item.deleteOne();

    res.status(200).json({
      status: "success",
      message: `Item "${item.title}" has been deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

// delete multiple
exports.deleteMultipleItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide an array of item IDs to delete",
      });
    }

    // const objectIds = itemIds.map((id) => mongoose.Types.ObjectId(id));
    const items = await Data.find({ _id: { $in: itemIds }, userId });

    for (const item of items) {
      if (item.fileinfo && item.fileinfo.length > 0) {
        await Promise.all(item.fileinfo.map((file) => deleteFile(file.key)));
      }
    }

    const result = await Data.deleteMany({ _id: { $in: itemIds }, userId });

    res.status(200).json({
      status: "success",
      message: `${result.deletedCount} item(s) deleted successfully`,
    });
  } catch (err) {
    console.error("Delete Multiple Error:", err); // <-- Log the actual error
    res.status(500).json({
      status: "error",
      message: err.message || "Something went wrong",
    });
  }
};

// edit data
exports.editItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;
    const { title, value } = req.body;
    if (!title || !value) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide both title and value",
      });
    }

    const encryptedValue = await encryptValue(value);

    const item = await Data.findOne({ _id: itemId, userId });
    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Item not found or does not belong to you",
      });
    }

    let newFiles = [];
    if (req.files && req.files.length > 0) {
      // Filter out files that already exist (before upload)
      const filesToUpload = req.files.filter(
        (file) =>
          !item.fileinfo.some(
            (existing) => existing.filename === file.originalname
          )
      );

      if (filesToUpload.length > 0) {
        const uploadedFiles = await Promise.all(filesToUpload.map(uploadFile));
        item.fileinfo = [...item.fileinfo, ...uploadedFiles];
        newFiles = uploadedFiles;
      }
    }

    item.title = title;
    item.encryptedValue = encryptedValue;
    await item.save({ validateBeforeSave: false });
    res.status(200).json({
      status: "success",
      message: `Item "${item.title}" has been updated successfully`,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

// search item

exports.getVaultItems = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    const { search, page = 1, limit = 50, sort = "-createdAt" } = req.query;

    const query = { userId };
    if (search) {
      query.title = { $regex: search, $options: "i" }; // case-insensitive search
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find items with pagination and sorting
    const items = await Data.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Decrypt values before sending
    const results = items.map((item) => ({
      _id: item._id,
      title: item.title,
      value: decryptValue(item.encryptedValue),
      createdAt: item.createdAt,
    }));

    // Optional: total count for pagination info
    const total = await Data.countDocuments(query);

    res.status(200).json({
      status: "success",
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      username: user.username,
      results,
    });
  } catch (err) {
    console.error("getVaultItems error:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

exports.viewItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    // Find the secret belonging to the logged-in user
    const item = await Data.findOne({ userId, _id: itemId });

    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "Secret not found or does not belong to you",
      });
    }

    // Decrypt the value before sending
    const decryptedValue = await decryptValue(item.encryptedValue);

    const files = item.fileinfo.map((file) => ({
      filename: file.filename,
      key: file.key,
      mimetype: file.mimetype,
      size: file.size,
    }));

    res.status(200).json({
      status: "success",
      _id: item._id,
      title: item.title,
      value: decryptedValue,
      files: files,
      createdAt: item.createdAt,
    });
  } catch (err) {
    console.error("viewItem error:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong while fetching the secret",
    });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const key = req.params.key;

    if (!key) {
      return res.status(400).json({
        status: "fail",
        message: "File key is required",
      });
    }

    // Find item containing this file key belonging to this user
    const item = await Data.findOne({
      userId,
      "fileinfo.key": key,
    });

    if (!item) {
      return res.status(404).json({
        status: "fail",
        message: "File not found or does not belong to you",
      });
    }

    // Generate pre-signed URL for download
    const fileUrl = await getFileUrl(key);

    res.status(200).json({
      status: "success",
      url: fileUrl,
      filename: item.fileinfo.find((f) => f.key === key)?.filename || "file",
    });
  } catch (err) {
    console.error("getFiles error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch file",
    });
  }
};
