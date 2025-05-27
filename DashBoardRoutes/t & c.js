const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('../db');
const TermsModel = require('../Models/t & c ')(sequelize); // rename properly
const { successResponse, errorResponse } = require("../Midileware/response");
const { SystemUserAuth } = require("../Midileware/Auth");
const pdfParse = require('pdf-parse'); 

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/terms';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `terms-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.pdf') return cb(new Error('Only PDFs are allowed'));
    cb(null, true);
  }
});

// Upload and extract PDF content
router.post('/upload', SystemUserAuth, upload.single('termsFile'), async (req, res) => {
  try {
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer); // ✅ Extract text

    const newTerms = await TermsModel.create({
      userId: req.user.id,
      filePath: req.file.path,
      fileName: req.file.filename,
      description: pdfData.text, // ✅ Store extracted text as description
    });

    return successResponse(res, 'PDF uploaded and parsed successfully', newTerms);
  } catch (error) {
    console.error('Error parsing or saving PDF:', error);
    return errorResponse(res, 'Failed to upload or parse PDF', error);
  }
});

// Get all uploaded terms (with description, if any)
router.get('/get-all', SystemUserAuth, async (req, res) => {
  try {
    const allTerms = await TermsModel.findAll({
      order: [['createdAt', 'ASC']],
    });
    return successResponse(res, 'Fetched all terms', allTerms);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch terms', error);
  }
});


// Delete uploaded terms by ID
router.delete('/delete', SystemUserAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const term = await TermsModel.findByPk(id);

    if (!term) {
      return errorResponse(res, 'Term not found', null);
    }

    await term.destroy(); // Delete the term

    return successResponse(res, 'Term deleted successfully', null);
  } catch (error) {
    return errorResponse(res, 'Failed to delete term', error);
  }
});



module.exports = router;
