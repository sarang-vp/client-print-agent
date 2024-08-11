const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { print } = require("pdf-to-printer");
//const { convert } = require("pdf-poppler");
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const EscPosEncoder = require("esc-pos-encoder");
const app = express();
const cors = require("cors");
app.use(cors({ origin: "*" }));
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json({ limit: "100mb" }));
const { exec } = require("child_process");
const encodeImage = require("./image");

app.get("/printers", async (req, res) => {
  try {
    exec("wmic printer get name", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send("Error listing printers");
      }
      const printersList = stdout
        .split("\n")
        .slice(1, -1)
        .map((line) => line.trim());
      //res.send(printersList);
      const cleanedPrintersList = printersList.filter(
        (printer) => printer !== ""
      );
      res.status(200).send(cleanedPrintersList);
    });
  } catch (err) {
    console.error("Error listing printers:", err);
    res.status(500).send("Error listing printers");
  }
});

const upload = multer({ dest: "uploads/" });

app.post("/print", upload.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    const pdfFilePath = path.resolve(req.file.path);
    const options = {
      printer: req.body.printer_name || "Microsoft Print to PDF",
      monochrome: true, // Specify grayscale printing
      // Other print options here
    };

    await print(pdfFilePath, options);
    res.status(200).send("PDF printed successfully.");
  } catch (error) {
    console.error(error);
    //await fs.unlink(catPath);

    res.status(500).send(`Error printing PDF: ${error.message}`);
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) throw err;
        console.log("file deleted");
      });
      console.log("Uploaded file deleted.");
    }
  }
});

app.post("/thermalPrint", upload.single("logoFile"), async (req, res) => {
  let {
    kotInfo,
    companyName,
    invoiceUrl,
    address,
    name,
    customerName,
    tables,
    orderInfo,
    taxableAmt,
    taxDetails,
    amtTotal,
    printerName,
    printerWidth,
    footerMsg,
  } = req.body;
  if (tables) {
    try {
      tables = JSON.parse(tables);
    } catch (error) {
      console.error("Error parsing tables JSON:", error);
      return res.status(400).send("Invalid JSON format for tables");
    }
  }
  if (customerName) {
    try {
      customerName = JSON.parse(customerName);
    } catch (error) {
      console.error("Error parsing customerName JSON:", error);
      return res.status(400).send("Invalid JSON format for customerName");
    }
  }
  if (taxDetails) {
    try {
      taxDetails = JSON.parse(taxDetails);
    } catch (error) {
      console.error("Error parsing taxDetails JSON:", error);
      return res.status(400).send("Invalid JSON format for taxDetails");
    }
  }
  if (orderInfo) {
    try {
      orderInfo = JSON.parse(orderInfo);
    } catch (error) {
      console.error("Error parsing orderInfo JSON:", error);
      return res.status(400).send("Invalid JSON format for orderInfo");
    }
  }
  if (kotInfo) {
    try {
      kotInfo = JSON.parse(kotInfo);
    } catch (error) {
      console.error("Error parsing kotInfo JSON:", error);
      return res.status(400).send("Invalid JSON format for kotInfo");
    }
  }
  if (taxableAmt) {
    taxableAmt = parseFloat(taxableAmt);
  }
  if (amtTotal) {
    amtTotal = parseFloat(amtTotal);
  }
  if (!printerName) {
    return res.status(400).send("Printer not selected");
  }
  try {
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `//localhost/${printerName}`,
      // interface: "//localhost/POS-58",
      width: printerWidth || 32,
      // options: {
      //   encoding: 'UTF-8', // Use UTF-8 encoding
      // },
    });
    const printer1 = require("@thiagoelg/node-printer");

    function checkPrinterStatus(printerName) {
      try {
        const printers = printer1.getPrinters();
        const targetPrinter = printers.find((p) => p.name === printerName);
        if (!targetPrinter) {
          console.log(`Printer '${printerName}' not found`);
          return false;
        }

        //console.log('Printer details:', targetPrinter);
        // Check if the printer is local, shared, and not offline
        const isLocal = targetPrinter.attributes.includes("LOCAL");
        const isShared = targetPrinter.attributes.includes("SHARED");
        const isOffline = targetPrinter.attributes.includes("OFFLINE");

        // The printer is ready if it is local, shared, and not offline
        return isLocal && isShared && !isOffline;
      } catch (error) {
        console.error("Error checking printer status:", error);
        return false;
      }
    }

    const isConnected = checkPrinterStatus(printerName);
    if (!isConnected) {
      res.status(404).send(`printer not connected`);
      return;
    }

    if (req.file) {
      const imagePath = path.join(__dirname, "uploads", req.file.filename);
      let imageData = await encodeImage(imagePath);
      printer.alignCenter();
      printer.append(imageData);
    }
    printer.newLine();
    printer.println(companyName ? companyName : "NO NAME");
    printer.println(address);
    printer.drawLine();
    printer.setTypeFontB();
    printer.setTextSize(0, 0);
    printer.alignLeft();
    printer.println(`BILL NO: ${name}`);
    printer.println(`CUSTOMER: ${customerName.name}`);
    printer.println(`MOBILE: ${customerName.mobileNo}`);
    printer.println(`ADDRESS:`);
    printer.println(`TABLE NO: ${tables.join(", ") || "N/A"}`);
    printer.println(`NO: ${kotInfo.join(",")}`);
    printer.newLine();

    printer.tableCustom([
      { text: "Item", width: 0.4 },
      { text: "Qty", width: 0.2, align: "RIGHT" },
      { text: "Price", width: 0.3, align: "RIGHT" },
      { text: "Amount", width: 0.3, align: "RIGHT" },
    ]);
    printer.newLine();
    orderInfo.forEach((item) => {
      printer.tableCustom([
        { text: item.productName, width: 0.4 },
        { text: item.qty.toString(), width: 0.2, align: "RIGHT" },
        { text: item.unitPrice.toFixed(2), width: 0.3, align: "RIGHT" },
        { text: item.lineTotal.toFixed(2), width: 0.3, align: "RIGHT" },
      ]);
    });

    printer.drawLine();
    printer.setTextNormal();
    printer.alignRight();
    printer.println(`Taxable Amount: ${taxableAmt.toFixed(2)}`);
    taxDetails.length > 0
      ? taxDetails.forEach((tax) => {
          printer.println(`${tax.taxName}: ${tax.amount.toFixed(2)}`);
        })
      : null;
    printer.println(`Total: ${amtTotal.toFixed(2)}`);
    printer.drawLine();
    printer.alignCenter();
    printer.newLine();

    const encoder = new EscPosEncoder();
    let result = encoder
      //.initialize()
      .qrcode(invoiceUrl, 1, 4, "l")
      .align("center")
      .encode();
    let result1 = encoder.barcode(name, "code128", 60).encode();
    //printer.alignCenter();
    printer.append(result);
    printer.alignCenter();
    printer.newLine();
    printer.alignCenter();
    printer.append(result1);
    printer.newLine();
    printer.println(footerMsg ? footerMsg : "Thank You for Your Business!");
    printer.newLine();
    printer.newLine();
    printer.beep();
    printer.cut();
    printer
      .execute()
      .then(async () => {
        console.log("Receipt printed successfully");
        res.status(200).send("Receipt printed successfully");
      })
      .catch(async (error) => {
        console.error("Failed to print receipt", error);
        res.status(500).send(`Failed to print receipt: ${error.message}`);
      });
  } catch (error) {
    console.error("Error initializing printer", error);
    res.status(500).send(`Error initializing printer: ${error.message}`);
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) throw err;
        console.log("file deleted");
      });
    }
  }
});

// app.post("/print-pdf", upload.single("pdf"), async (req, res) => {
//   try {
//     // Validate inputs
//     const { printerType, printerInterface } = req.body;
//     if (!printerType || !printerInterface || !req.file) {
//       return res
//         .status(400)
//         .send("Printer type, interface, and PDF file are required");
//     }

//     const pdfPath = req.file.path;
//     const outputDir = path.join(__dirname, "output");

//     // Ensure output directory exists
//     await fs.mkdir(outputDir, { recursive: true });

//     // Convert PDF to images
//     const options = {
//       format: "png",
//       out_dir: outputDir,
//       out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
//       page: null,
//     };
//     await convert(pdfPath, options);

//     // Get list of generated image files
//     const files = await fs.readdir(outputDir);
//     const imageFiles = files.filter(
//       (file) => file.startsWith(options.out_prefix) && file.endsWith(".png")
//     );

//     // Initialize the thermal printer
//     const printer = new ThermalPrinter({
//       type: Types[printerType.toUpperCase()],
//       interface: printerInterface,
//     });

//     // Print each image file
//     for (const file of imageFiles) {
//       const imagePath = path.join(outputDir, file);
//       printer.alignCenter();
//       await printer.printImage(imagePath);
//       printer.newLine();
//       await fs.unlink(imagePath); // Clean up the image file
//     }

//     // Finalize printing
//     printer.cut();
//     let execute = await printer.execute();
//     console.log("Print executed", execute);

//     // Send success response
//     res.status(200).send("Printed successfully");
//   } catch (error) {
//     console.error("Print failed", error);
//     res.status(500).send("Print failed");
//   } finally {
//     try {
//       // Clean up uploaded PDF file
//       if (req.file) {
//         await fs.unlink(req.file.path);
//       }
//       // Clean up output directory
//       await fs.rm(path.join(__dirname, "output"), { recursive: true });
//     } catch (cleanupError) {
//       console.error("Cleanup failed", cleanupError);
//     }
//   }
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Client print agent running on port ${PORT}`);
});
