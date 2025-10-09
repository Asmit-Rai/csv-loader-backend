// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const corsOptions = {
  origin: 'https://flat-file-parser.vercel.app', 
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const upload = multer({ dest: "uploads/" });
let storedCsvData = "";
app.post("/sign-in", (req, res) => {
  const { userEmail, userPassword } = req.body;
  const savedEmail = process.env.EMAIL;
  const savedPassword = process.env.PASSWORD;

  if (savedEmail === userEmail && savedPassword === userPassword) {
    res.json({ auth: true , user:{email:savedEmail} });
  } else {
    res.json({ auth: false });
  }
});

app.post("/csv-data", (req, res) => {
  storedCsvData = req.body.csvData || req.body;
  res.json({ success: true });
});

app.get("/get-csv-data", (req, res) => {
  if (storedCsvData) {
    res.json({ success: true, csvData: storedCsvData });
  } else {
    res.status(404).json({ success: false, message: "No CSV data found." });
  }
});

app.post("/api/uploads", upload.single("file"), (req, res) => {
  const file = req.file;
  const config = req.body;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  console.log("--- File Received ---");
  console.log("File Info:", file);
  console.log("Configuration:", config);

  const preview = { headers: [], rows: [] };

  try {
    const fileContent = fs.readFileSync(file.path, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
    const delimiter = config.delimiter || ",";

    if (config.hasHeaders === "true" && lines.length > 0) {
      preview.headers = lines[0].split(delimiter);
      // preview.rows = lines.slice(1, 6).map((line) => line.split(delimiter));
      preview.rows = lines.slice(1).map((line) => line.split(delimiter));
    } else {
      const firstRow = lines.length > 0 ? lines[0].split(delimiter) : [];
      preview.headers = firstRow.map((_, i) => `Column ${i + 1}`);
      preview.rows = lines.map((line) => line.split(delimiter));
    }
    fs.unlinkSync(file.path);
  } catch (error) {
    console.error("Error reading file for preview:", error);
    fs.unlinkSync(file.path);
    return res.status(500).json({ message: "Failed to read uploaded file." });
  }

  setTimeout(() => {
    console.log("--- Processing Complete ---");
    res.status(200).json({
      message: `File '${file.originalname}' processed successfully!`,
      fileInfo: {
        filename: file.originalname,
        size: file.size,
      },
      receivedConfig: config,
      preview,
    });
  }, 2000);
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
