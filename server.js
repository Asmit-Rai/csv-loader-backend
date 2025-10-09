import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
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

  const preview = { headers: [], rows: [] };

  try {
    const fileContent = fs.readFileSync(file.path, "utf8");
    const hasHeaders = config.hasHeaders === "true";
    const options = {
      delimiter: config.delimiter || ",",
      columns: hasHeaders,
      skip_empty_lines: true,
      trim: true,
      quote: '"',                 
      escape: '"',               
      relax_column_count: true, 
    };

    const records = parse(fileContent, options);

    if (records.length > 0) {
      if (hasHeaders) {
        preview.headers = Object.keys(records[0]);
        preview.rows = records.map(record => Object.values(record));
      } else {
        preview.headers = records[0].map((_, i) => `Column ${i + 1}`);
        preview.rows = records;
      }
    }

    fs.unlinkSync(file.path); 
  } catch (error) {
    console.error("Error processing CSV file:", error);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(500).json({ message: "Failed to parse the uploaded file." });
  }
  
  console.log("--- Processing Complete ---");
  res.status(200).json({
    message: `File '${file.originalname}' processed successfully!`,
    preview,
  });
});


app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
