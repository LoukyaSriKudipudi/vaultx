// // local
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");

// const uploadDir = path.join(__dirname, "../uploads");
// const imgUploadDir = path.join(__dirname, "../uploads/images");
// if (!fs.existsSync(imgUploadDir))
//   fs.mkdirSync(imgUploadDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) cb(null, imgUploadDir);
//     else cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = uuidv4();
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = [
//     "image/png",
//     "image/jpeg",
//     "application/pdf",
//     "text/plan",
//     "application/zip",
//   ];

//   if (allowed.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("invalid file type!"), false);
//   }
// };

// const limits = { fileSize: 10 * 1024 * 1024, files: 5 };

// const upload = multer({ storage, fileFilter, limits });

// module.exports = upload;

// // aws

const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/png",
    "image/jpeg",
    "application/pdf",
    "text/plain",
    "application/zip",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type!"), false);
};

const limits = { fileSize: 10 * 1024 * 1024, files: 5 };

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits,
});

module.exports = upload;
