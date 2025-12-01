const express = require("express");
const ejs = require("ejs");
const puppeteer = require("puppeteer");
const path = require("path");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // allow image access

// Show HTML preview
app.get("/", (req, res) => {
  res.render("invoice", {
    invoiceNumber: 60561,
    balanceDue: "3,151.90",
    date: "2025-02-04",
    payTerms: "",
    dueDate: "",
    poNumber: "498927900",
    billTo: "C.H.ROBINSON",
    loadNumber: "498927900",
    subtotal: "3,151.90",
    total: "3,151.90",
    imagePath: "/HAlogo.png",   // correct
    items: [{
      description: "REI - Goodyear",
      pickupAddress: "4877 N Cotton Ln, Goodyear, AZ 85395",
      dropAddress: "1700 45th St E, Sumner, WA 98352",
      qty: 1,
      rate: "3,151.90",
      amount: "3,151.90"
    }]
  });
});

// DOWNLOAD PDF
app.get("/download-pdf", async (req, res) => {
  try {
    const data = {
      invoiceNumber: 60561,
      balanceDue: "3,151.90",
      date: "2025-02-04",
      payTerms: "",
      dueDate: "",
      poNumber: "498927900",
      billTo: "C.H.ROBINSON",
      loadNumber: "498927900",
      subtotal: "3,151.90",
      total: "3,151.90",
      imagePath: `http://localhost:${port}/HAlogo.png`,
      items: [{
        description: "REI - Goodyear",
        pickupAddress: "4877 N Cotton Ln, Goodyear, AZ 85395",
        dropAddress: "1700 45th St E, Sumner, WA 98352",
        qty: 1,
        rate: "3,151.90",
        amount: "3,151.90"
      }]
    };

    // Render HTML from EJS
    const html = await ejs.renderFile(path.join(__dirname, "views", "invoice.ejs"), data);

    // Run Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // Send PDF to browser
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice.pdf",
    });

    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation error");
  }
});

app.listen(port, () => console.log(`Server running on ${port}`));
