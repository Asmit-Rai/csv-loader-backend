import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let storedCsvData = "";

app.post("/sign-in", (req, res) => {
  const data = req.body;
  const email = data.userEmail;
  const password = data.userPassword;

  const savedEmail = process.env.EMAIL;
  const savedPassword = process.env.PASSWORD;

  if (savedEmail === email && savedPassword === password) {
    res.json({ 
      auth: true 
    });
  } else {
    res.json({ 
      auth: false
     });
  }
});

app.post("/csv-data", (req, res) => {
  const csvData = req.body;
  storedCsvData = csvData;
  res.json({ 
    success: true, 
  });
});

app.get("/get-csv-data", (req, res) => {
   if (storedCsvData) {
      res.json({ 
        success: true, 
        csvData: storedCsvData 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "No CSV data found. Please upload a CSV file first." 
      });
    }
});

app.listen(3000);
