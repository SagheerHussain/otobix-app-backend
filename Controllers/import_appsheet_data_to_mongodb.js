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
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
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


// // importAppsheetExcel.js
// const express = require('express');
// const multer = require('multer');
// const mongoose = require('mongoose');
// const XLSX = require('xlsx');
// const path = require('path');
// require('dotenv').config();

// // connect MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log('✅ MongoDB connected'))
//     .catch(err => {
//         console.error('❌ MongoDB connection error:', err);
//         process.exit(1);
//     });

// const router = express.Router();

// // Multer config
// const storage = multer.diskStorage({
//     destination: (_, __, cb) => cb(null, 'uploads/'),
//     filename: (_, file, cb) => cb(null, 'imported.xlsx'), // overwrite
// });
// const upload = multer({ storage });

// // Route to import AppSheet Excel file
// router.post('/import-appsheet-db', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ error: 'File missing' });

//         const workbook = XLSX.readFile(req.file.path);
//         const sheetNames = workbook.SheetNames;

//         for (const sheet of sheetNames) {
//             const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
//             if (data.length > 0) {
//                 const collection = mongoose.connection.collection(sheet.toLowerCase());
//                 await collection.deleteMany(); // clear previous
//                 await collection.insertMany(data);
//                 console.log(`✅ Imported ${data.length} records to "${sheet}"`);
//             }
//         }

//         res.status(200).json({ message: 'AppSheet DB imported to MongoDB successfully.' });
//     } catch (err) {
//         console.error('❌ Import failed:', err);
//         res.status(500).json({ error: 'Failed to import AppSheet database' });
//     }
// });

// module.exports = router;
