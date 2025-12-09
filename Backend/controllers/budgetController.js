import Budget from '../models/Budget.js';
import fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import multer from 'multer';



const upload = multer({ dest: 'uploads/' }).single('file');

// ✅ Add Budget Manually
export const addBudget = async (req, res) => {
  try {
    const budget = new Budget({ ...req.body, userId: req.user.id });
    await budget.save();
    res.status(201).json({ success: true, budget });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ✅ Get Budgets with Optional Filters (month, category)
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, category } = req.query;

    const query = { userId };
    if (month) query.month = month;
    if (category) query.category = category;

    const budgets = await Budget.find(query).sort({ month: 1 });
    res.json({ success: true, budgets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Upload Budgets via File (CSV, Excel, JSON)
export const uploadBudget = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error('🛑 Multer upload error:', err);
      return res.status(400).json({ success: false, message: 'Upload failed', error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

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
            message: 'No data found in uploaded file',
            error: 'File appears to be empty or contains no valid rows'
          });
        }

        // Validate required fields
        const isValid = results.every(r =>
          r.month && r.category && (r.budgetAmount || r.budgetAmount === 0)
        );

        if (!isValid) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields in some rows',
            error: 'All rows must have: month, category, budgetAmount'
          });
        }

        // Parse and validate data
        const formatted = results.map((r, index) => {
          try {
            const budgetAmount = parseFloat(r.budgetAmount);
            
            if (isNaN(budgetAmount)) {
              throw new Error(`Invalid budget amount in row ${index + 1}: ${r.budgetAmount}`);
            }
            
            return {
              userId,
              month: r.month,
              category: r.category,
              budgetAmount,
              notes: r.notes || ''
            };
          } catch (parseError) {
            throw new Error(`Row ${index + 1} parsing error: ${parseError.message}`);
          }
        });

        const inserted = await Budget.insertMany(formatted);
        fs.unlinkSync(file.path);

        res.json({
          success: true,
          message: 'Budget uploaded successfully',
          count: inserted.length
        });
      } catch (error) {
        console.error('❌ Budget insert error:', error);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({
          success: false,
          message: 'Failed to process budget data',
          error: error.message
        });
      }
    };

    // ✅ File parsers
    if (ext === 'csv') {
      const csvResults = [];
      let hasError = false;
      let errorMessage = '';
      
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (row) => csvResults.push(row))
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
        const json = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        results = Array.isArray(json) ? json : [json];
        saveAndRespond();
      } catch (error) {
        fs.unlinkSync(file.path);
        res.status(400).json({ success: false, message: 'Invalid JSON format' });
      }
    } else if (ext === 'xls' || ext === 'xlsx') {
      try {
        const workbook = XLSX.readFile(file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        results = XLSX.utils.sheet_to_json(sheet);
        saveAndRespond();
      } catch (error) {
        fs.unlinkSync(file.path);
        res.status(400).json({ success: false, message: 'Excel read error' });
      }
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${ext}. Please upload CSV, JSON, or Excel files.`
      });
    }
  });
};

// ✅ Update Budget Record
export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Budget record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Budget updated successfully', 
      budget: updated 
    });
  } catch (err) {
    console.error('❌ Update budget error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update budget' 
    });
  }
};

// ✅ Delete Budget Record
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await Budget.findOneAndDelete({
      _id: id,
      userId
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Budget record not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Budget deleted successfully' 
    });
  } catch (err) {
    console.error('❌ Delete budget error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete budget' 
    });
  }
};
