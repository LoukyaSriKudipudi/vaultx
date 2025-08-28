const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const Data = require("../models/dataModel");
const path = require("path");

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message:
          "All fields (username, email, password, passwordConfirm) are required",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      passwordConfirm,
    });

    const token = signToken(user._id);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    let errorMessage = "Something went wrong while creating the user";

    // Duplicate email error
    if (err.code === 11000) {
      errorMessage = "Email already exists. Please use another one";
    }

    // Validation errors
    if (err.name === "ValidationError") {
      errorMessage = Object.values(err.errors)
        .map((el) => el.message)
        .join(", ");
    }

    res.status(400).json({
      status: "fail",
      message: errorMessage,
    });
  }
};

// User login
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide both email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }

    const isPasswordCorrect = await user.checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect password",
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Internal server error: " + err.message,
    });
  }
};

// Get user details
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found. Please login again",
      });
    }

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Internal server error: " + err.message,
    });
  }
};

// forgotpassword
const sendResetMail = require("../utils/email");
exports.forgotPassword = async (req, res) => {
  let user;
  try {
    const { email } = req.body;
    user = await User.findOne({ email });

    if (!user) {
      // Better: don't reveal if email exists, just send a generic message
      return res.status(200).json({
        status: "success",
        message:
          "If that email is registered, a password reset link has been sent.",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/v1/users/resetPassword/${resetToken}`;

    await sendResetMail(user.email, resetURL, user.username, req.get("host"));
    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email.",
    });
  } catch (err) {
    if (user) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later.",
    });
  }
};

// resetPassword
const crypto = require("crypto");

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Reset link is invalid or has expired.",
      });
    }

    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Your password has been reset successfully.",
      token,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Unable to reset password. Please try again later.",
    });
  }
};

const { deleteFile } = require("../utils/s3");

// delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    const data = await Data.find({ userId: user._id });

    const keys = data.map((d) => d.fileinfo.map((f) => f.key));

    for (const item of data) {
      if (item.fileinfo && item.fileinfo.length > 0) {
        await Promise.all(item.fileinfo.map((file) => deleteFile(file.key)));
      }
    }

    // delete related data
    await Data.deleteMany({ userId: req.user._id });
    await user.deleteOne();
    res.status(200).json({
      status: "success",
      message: "User account and all related data deleted permanently.",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};

// deleteUserConfirm
exports.deleteUserConfirm = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    const dataCount = await Data.countDocuments({ userId: user._id });

    res.status(200).json({
      status: "success",
      username: user.username,
      message: `Deleting your account will permanently remove all your saved data (${dataCount} items). This action cannot be undone.`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};

// reset page
exports.resetPasswordPage = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    res.sendFile(path.join(__dirname, "..", "public", "resetPassword.html"));
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
};

// edit user name and email and password
exports.editUserNameAndEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (!req.body.name || !req.body.email) {
      return res.status(400).json({
        status: "fail",
        message: "Both name and email are required",
      });
    }

    user.username = req.body.name;
    user.email = req.body.email;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: "success",
      message: "Details updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong while updating user details",
    });
  }
};

// change password
exports.ChangePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Check current password
    const isMatch = await user.checkPassword(
      req.body.currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Current password is incorrect",
      });
    }

    // Update to new password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;

    await user.save();

    const token = signToken(user._id);

    return res.status(200).json({
      status: "success",
      message: "Password updated successfully",
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong while updating password",
    });
  }
};
