const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const multer = require("multer");

const upload = multer({ dest: "public/img/users" });

// signup
router.post("/signup", userController.createUser);
router.post("/login", userController.userLogin);
router.get("/user", authController.protect, userController.getUser);
router.post(
  "/editUserNameAndEmail",
  authController.protect,
  upload.single("photo"),
  userController.editUserNameAndEmail
);
router.post(
  "/ChangePassword",
  authController.protect,
  userController.ChangePassword
);
router.post("/forgotPassword", userController.forgotPassword);
router.get("/resetPassword/:token", userController.resetPasswordPage);
router.post("/resetPassword/:token", userController.resetPassword);
router.get(
  "/deleteUserConfirm",
  authController.protect,
  userController.deleteUserConfirm
);
router.delete("/deleteUser", authController.protect, userController.deleteUser);

module.exports = router;
