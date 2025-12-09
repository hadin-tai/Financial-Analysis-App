import fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import multer from 'multer';
import BalanceSheet from '../models/BalanceSheet.js';

const upload = multer({ dest: 'uploads/' }).single('file');

// ✅ Manual Entry - Add One Balance Sheet Record
export const addBalance = async (req, res) => {
  try {
    const balance = new BalanceSheet({ ...req.body, userId: req.user.id });
    await balance.save();
    res.status(201).json({ success: true, balance });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ✅ Get All Balance Sheet Records (with optional filters)
export const getBalances = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const query = { userId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const balances = await BalanceSheet.find(query).sort({ date: -1 });
    res.json({ success: true, balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Upload Balance Sheet File (CSV, Excel, JSON)
export const uploadBalanceSheet = (req, res) => {
  upload(req, res, function (err) {
    if (err) return res.status(400).json({ message: 'Upload failed' });

    const file = req.file;
    const ext = file.originalname.split('.').pop().toLowerCase();
    let results = [];

    const userId = req.user.id;

    const saveAndRespond = async () => {
      try {
        if (!results || results.length === 0) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'No data found in file',
            error: 'File appears to be empty or contains no valid rows'
          });
        }

        // Validate required fields
        const isValid = results.every(r =>
          r.date && r.currentAssets && r.currentLiabilities && r.totalLiabilities && r.totalEquity
        );

        if (!isValid) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields in some rows',
            error: 'All rows must have: date, currentAssets, currentLiabilities, totalLiabilities, totalEquity'
          });
        }

        // Parse and validate dates and numbers
        const parseDate = (dateStr) => {
          if (!dateStr) return null;
          
          try {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate;
            }
          } catch (e) {
            // Continue to other formats
          }
          
          // Try parsing common formats manually
          if (typeof dateStr === 'string') {
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate;
                }
              }
            }
            
            // Handle MM-DD-YYYY format
            if (dateStr.includes('-') && dateStr.split('-').length === 3) {
              const parts = dateStr.split('-');
              if (parts[0].length === 2 && parts[2].length === 4) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                  return parsedDate;
                }
              }
            }
          }
          
          throw new Error(`Unable to parse date: ${dateStr}`);
        };

        const formatted = results.map((r, index) => {
          try {
            const parsedDate = parseDate(r.date);
            const currentAssets = parseFloat(r.currentAssets);
            const currentLiabilities = parseFloat(r.currentLiabilities);
            const totalLiabilities = parseFloat(r.totalLiabilities);
            const totalEquity = parseFloat(r.totalEquity);
            
            if (isNaN(currentAssets) || isNaN(currentLiabilities) || 
                isNaN(totalLiabilities) || isNaN(totalEquity)) {
              throw new Error(`Invalid numeric values in row ${index + 1}`);
            }
            
            return {
              userId,
              date: parsedDate,
              currentAssets,
              currentLiabilities,
              totalLiabilities,
              totalEquity,
              notes: r.notes || ''
            };
          } catch (parseError) {
            throw new Error(`Row ${index + 1} parsing error: ${parseError.message}`);
          }
        });

        await BalanceSheet.insertMany(formatted);
        fs.unlinkSync(file.path);
        res.json({ 
          success: true, 
          message: 'Balance sheet uploaded successfully',
          count: formatted.length
        });
      } catch (error) {
        console.error('❌ Upload Save Error:', error);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ 
          success: false, 
          message: 'Upload failed',
          error: error.message
        });
      }
    };

    if (ext === 'csv') {
      const csvResults = [];
      let hasError = false;
      let errorMessage = '';
      
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', row => csvResults.push(row))
        .on('error', (error) => {
          console.error('🔴 CSV parsing error:', error);
          hasError = true;
          errorMessage = 'Error parsing CSV file. Please check the file format.';
        })
        .on('end', () => {
          if (hasError) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
              success: false, 
              message: 'CSV parsing failed',
              error: errorMessage
            });
          }
          
          results = csvResults;
          saveAndRespond();
        });
    } else if (ext === 'json') {
      try {
        const json = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
        results = json;
        saveAndRespond();
      } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid JSON format' });
      }
    } else if (ext === 'xls' || ext === 'xlsx') {
      try {
        const workbook = XLSX.readFile(file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        results = XLSX.utils.sheet_to_json(sheet);
        saveAndRespond();
      } catch (error) {
        res.status(400).json({ success: false, message: 'Excel read error' });
      }
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }
  });
};

// ✅ Update Balance Sheet Record
export const updateBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await BalanceSheet.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Balance sheet record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Balance sheet updated successfully', 
      balance: updated 
    });
  } catch (err) {
    console.error('❌ Update balance error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update balance sheet' 
    });
  }
};

// ✅ Delete Balance Sheet Record
export const deleteBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await BalanceSheet.findOneAndDelete({
      _id: id,
      userId
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Balance sheet record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Balance sheet deleted successfully' 
    });
  } catch (err) {
    console.error('❌ Delete balance error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete balance sheet' 
    });
  }
};
