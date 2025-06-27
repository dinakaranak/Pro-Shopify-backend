const express = require("express");
const router = express.Router();
const { log } = require("console");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const YoutubeVideo = require("../models/Youtube");

// Set up storage for image files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/images");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Set up storage for PDF files
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/pdfs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

const imageupload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("photo");

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."), false);
    }
  },
}).single("pdf");

// Image upload route
router.post("/", imageupload, (req, res) => {
  console.log(req.body);

  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const imageUrl = `${process.env.BASE_URL}/uploads/images/${req.file.filename}`;
  console.log("Image uploaded successfully:", imageUrl);

  res.json({ location: imageUrl });
});
// router.get("/videos", async (req, res) => {
//   try {
//     const videos = await YoutubeVideo.find().sort({ order: 1 });
//     res.json(videos);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching videos" });
//   }
// });

// Create a new video
// router.post("/videos", async (req, res) => {
//   try {
//     const { title, description, youtubeUrl, order } = req.body;
//     const newVideo = new YoutubeVideo({
//       title,
//       description,
//       youtubeUrl,
//       order,
//     });
//     await newVideo.save();
//     res.status(201).json(newVideo);
//   } catch (err) {
//     res.status(500).json({ message: "Error creating video" });
//   }
// });

// router.put("/videos/:id", async (req, res) => {
//   try {
//     const { title, description, youtubeUrl, order } = req.body;
//     const newVideo = await YoutubeVideo.findByIdAndUpdate(
//       req.params.id,
//       { title, description, youtubeUrl, order },
//       { new: true }
//     );
//     if (!newVideo) return res.status(404).json({ message: "Video not found" });
//     res.json(newVideo);
//   } catch (err) {
//     res.status(500).json({ message: "Error creating video" });
//   }
// });

// Delete a video
// router.delete("/videos/:id", async (req, res) => {
//   try {
//     const video = await YoutubeVideo.findByIdAndDelete(req.params.id);
//     if (!video) return res.status(404).json({ message: "Video not found" });
//     res.json({ message: "Video deleted" });
//   } catch (err) {
//     res.status(500).json({ message: "Error deleting video" });
//   }
// });

router.post("/upload/file", upload, (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  const fileUrl = `/uploads/images/${req.file.filename}`;
  res.json({ message: "File uploaded successfully", location: fileUrl });
});

// PDF upload route
router.post("/upload-pdf", pdfUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).send("No PDF file uploaded");
  }
  const pdfUrl = `/uploads/pdfs/${req.file.filename}`;
  res.json({ message: "PDF uploaded successfully", location: pdfUrl });
});

// Fetch uploaded files (images and PDFs)
router.get("/files", async (req, res) => {
  const uploadDir = path.join(__dirname, "../uploads/images");
  try {
    const items = await fs.promises.readdir(uploadDir, { withFileTypes: true });

    const files = [];
    for (const item of items) {
      if (item.isFile()) {
        const filePath = path.join(uploadDir, item.name);
        const stats = await fs.promises.stat(filePath); // Get file stats
        files.push({
          filename: item.name,
          url: `/uploads/images/${item.name}`,
          createdAt: stats.mtime, // Use the modification time
        });
      }
    }

    // Sort files by createdAt (newest first)
    files.sort((a, b) => b.createdAt - a.createdAt);

    res.json(files);
  } catch (err) {
    res.status(500).send("Error reading directory");
  }
});


// Fetch uploaded PDF files
router.get("/files/pdfs", async (req, res) => {
  const pdfDir = path.join(__dirname, "../uploads/pdfs");

  try {
    const items = await fs.promises.readdir(pdfDir);  // Read PDF directory

    const files = [];
    for (const file of items) {
      const filePath = path.join(pdfDir, file);
      const stats = await fs.promises.stat(filePath);  // Get file stats

      files.push({
        filename: file,
        url: `/uploads/pdfs/${file}`,
        createdAt: stats.mtime.getTime(),  // Use modification date (timestamp)
      });
    }

    // Sort files by modification date (newest first)
    files.sort((a, b) => b.createdAt - a.createdAt);  // Sort descending by date

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading PDF directory");
  }
});

router.get("/files/xls", async (req, res) => {
  const xlsDir = path.join(__dirname, "../uploads/Question");

  try {
    const items = await fs.promises.readdir(xlsDir);  // Read PDF directory

    const files = [];
    for (const file of items) {
      const filePath = path.join(xlsDir, file);
      const stats = await fs.promises.stat(filePath);  // Get file stats

      files.push({
        filename: file,
        url: `/uploads/Question/${file}`,
        createdAt: stats.mtime.getTime(),  // Use modification date (timestamp)
      });
    }

    // Sort files by modification date (newest first)
    files.sort((a, b) => b.createdAt - a.createdAt);  // Sort descending by date

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading PDF directory");
  }
});

router.delete("/files/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "../uploads/images",
    req.params.filename
  );
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send("Error deleting file");
    }
    res.json({ message: "File deleted successfully" });
  });
});

// Delete a PDF file
router.delete("/files/pdfs/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/pdfs", req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send("Error deleting PDF file");
    }
    res.json({ message: "PDF file deleted successfully" });
  });
});
router.delete("/files/xls/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads/Question", req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send("Error deleting xls file");
    }
    res.json({ message: "PDF file deleted successfully" });
  });
});

// Serve uploaded static files via Express
// router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Ensure the uploads directory and pdfs sub-directory exist
const uploadsDir = path.join(__dirname, "../uploads");
const pdfsDir = path.join(__dirname, "../uploads/pdfs");
// const xlsDir = path.join(__dirname, "../uploads/xls");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}
// if (!fs.existsSync(xlsDir)) {
//   fs.mkdirSync(xlsDir, { recursive: true });
// }

module.exports = router;
