// ----- AuctionOS Batch Image Upload Backend (standalone) -----

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS for all origins (for dev; restrict in production)
app.use(cors({ origin: '*' }));

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer in-memory storage (faster for processing)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------- Batch Image Upload Endpoint -----------
app.post('/upload-lot-images', upload.any(), async (req, res) => {
  try {
    // Get lot numbers array from form data
    let lotNumbers = [];
    if (Array.isArray(req.body.lotNumbers)) {
      lotNumbers = req.body.lotNumbers.filter(Boolean);
    } else if (req.body.lotNumbers) {
      lotNumbers = [req.body.lotNumbers];
    }
    if (!lotNumbers.length) return res.status(400).json({ error: 'No lots provided.' });

    const result = {};
    for (const lotNum of lotNumbers) {
      // Find files for this lot
      const files = req.files.filter(f => f.fieldname === `images_${lotNum}`);
      let count = 1;
      result[lotNum] = [];
      for (const file of files) {
        const filename = `${lotNum}_${count}.jpg`;
        const outputPath = path.join(uploadDir, filename);
        // Convert to JPEG and save
        await sharp(file.buffer).jpeg({ quality: 92 }).toFile(outputPath);
        result[lotNum].push(filename);
        count++;
      }
    }

    res.json({ status: "success", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------- Root/Healthcheck -----------
app.get('/', (req, res) => {
  res.send('AuctionOS Image Upload Backend is running.');
});

// ----------- Start Server -----------
app.listen(PORT, () => {
  console.log(`AuctionOS backend running on port ${PORT}`);
});
