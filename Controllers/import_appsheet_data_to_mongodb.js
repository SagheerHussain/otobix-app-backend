const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

const router = express.Router();

// Use memory storage to avoid writing to disk
const upload = multer({ storage: multer.memoryStorage() });

// POST route to handle Excel import
router.post('/import-appsheet-data-to-mongodb', upload.single('file'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read Excel file directly from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheetNames = workbook.SheetNames;

        for (const sheet of sheetNames) {
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
            if (data.length > 0) {
                const collection = mongoose.connection.collection(sheet.toLowerCase());
                await collection.deleteMany(); // optional: clear old data
                await collection.insertMany(data);
                console.log(`✅ Imported ${data.length} records into "${sheet}"`);
            }
        }

        res.status(200).json({ message: '✅ AppSheet Excel data imported successfully' });
    } catch (err) {
        console.error('❌ Import failed:', err);
        res.status(500).json({ error: 'Import failed' });
    }
});

module.exports = router;

