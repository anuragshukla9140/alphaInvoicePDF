// server.js
const express = require("express");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
const port = 3000;

app.use(express.json({ limit: "5mb" })); // accept JSON bodies
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// serve static: logo and saved pdfs
app.use(express.static(path.join(__dirname, "public")));
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));


//Secure home route
app.get("/", (req, res) => {
  try {
    res.send("Invoice PDF Generator API is running.");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error in home route",
      error: error.message
    });
  }
});



/**
 * POST /generate-pdf
 * Body: { templateId: string, data: object }
 * Returns: { success: true, invoiceId, pdf_url }
 */
app.post("/generate-pdf", async (req, res) => {
  try {
    const { templateId, data } = req.body;

    if (!templateId || !data) {
      return res.status(400).json({ error: "templateId and data required" });
    }

    // ---- DEFAULT VALUES TO PREVENT 'not defined' ERRORS ----
    const defaults = {
      invoiceNumber: "",
      balanceDue: "",
      date: "",
      loadNumber: "",
      billTo: "",
      subtotal: "",
      total: "",
      items: [],
      imagePath: "",
    };

    // Merge incoming data + defaults
    const finalData = { ...defaults, ...data };

    // Absolute path for puppeteer image loading
    finalData.imagePath = `http://localhost:${port}/HAlogo.png`;

    // ---- ENSURE /pdfs FOLDER EXISTS ----
    const pdfDir = path.join(__dirname, "pdfs");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

    // ---- RENDER EJS HTML ----
    const html = await ejs.renderFile(
      path.join(__dirname, "views", "invoice.ejs"),
      finalData
    );

    // ---- GENERATE PDF USING PUPPETEER ----
    const browser = await puppeteer.launch(); // add args: ['--no-sandbox'] if needed
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }
    });

    await browser.close();

    // ---- SAVE PDF FILE ----
    const fileName = `invoice-${Date.now()}.pdf`;
    const savePath = path.join("pdfs", fileName);
    fs.writeFileSync(path.join(__dirname, savePath), pdfBuffer);

    // ---- SAVE DATABASE RECORD ----
    const [result] = await db.query(
      "INSERT INTO invoices (template_id, data, file_path) VALUES (?, ?, ?)",
      [templateId, JSON.stringify(finalData), savePath]
    );

    // ---- PUBLIC URL ----
    const fileUrl = `http://localhost:${port}/${savePath}`;

    // SUCCESS RESPONSE
    return res.json({
      success: true,
      invoiceId: result.insertId,
      pdf_url: fileUrl
    });

  } catch (err) {
    console.error("generate-pdf error:", err);
    return res.status(500).json({
      error: "PDF generation failed",
      detail: err.message
    });
  }
});


app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
