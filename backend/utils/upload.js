const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (_req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image uploads are allowed"));
    return;
  }

  callback(null, true);
};

module.exports = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter
});
