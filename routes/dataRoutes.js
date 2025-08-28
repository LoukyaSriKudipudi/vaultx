const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");
const authController = require("../controllers/authController");
const upload = require("../utils/upload");
// Vault routes

router.post(
  "/vault",
  authController.protect,
  upload.array("files", 5),
  dataController.saveData
);

router.get("/vault/file/:key", authController.protect, dataController.getFiles);

router.get("/vault", authController.protect, dataController.getVaultItems);
router.patch(
  "/vault/:id",
  authController.protect,
  upload.array("files", 5),
  dataController.editItem
);
router.get("/vault/:id", authController.protect, dataController.viewItem);
router.delete("/vault/:id", authController.protect, dataController.deleteItem);
router.post(
  "/vault/deleteMultiple",
  authController.protect,
  dataController.deleteMultipleItems
);
module.exports = router;
