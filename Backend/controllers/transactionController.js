import csv from 'csv-parser';
import multer from 'multer';
import fs from 'fs';
import * as XLSX from 'xlsx';
import Transaction from '../models/Transaction.js';

const upload = multer({ dest: 'uploads/' }).single('file');

// ✅ Upload File (CSV, Excel, JSON)
export const uploadFile = (req, res) => {
  upload(req, res, function (err) {
    if (err) return res.status(400).json({ 
      success: false, 
      message: 'File upload error',
      error: err.message 
    });

    const file = req.file;
    const ext = file.originalname.split('.').pop().toLowerCase();
    let results = [];

    if (ext === 'csv') {
      const csvResults = [];
      let hasError = false;
      let errorMessage = '';
      
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (row) => {
          csvResults.push({ ...row, userId: req.user.id });
        })
        .on('error', (error) => {
          console.error('🔴 CSV parsing error:', error);
          hasError = true;
          errorMessage = 'Error parsing CSV file. Please check the file format.';
        })
        .on('end', async () => {
          if (hasError) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
              success: false, 
              message: 'CSV parsing failed',
              error: errorMessage
            });
          }
          
          if (csvResults.length === 0) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
              success: false, 
              message: 'No data found in CSV file',
              error: 'The CSV file appears to be empty or contains no valid rows'
            });
          }
          
          await saveTransactions(csvResults, file.path, res);
        });
    } else if (ext === 'json') {
      try {
        const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        results = jsonData.map((row) => ({ ...row, userId: req.user.id }));
        saveTransactions(results, file.path, res);
      } catch (error) {
        console.error('🔴 JSON parsing error:', error);
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid JSON format',
          error: error.message 
        });
      }
    } else if (ext === 'xls' || ext === 'xlsx') {
      try {
        const workbook = XLSX.readFile(file.path);
        const sheet = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        results = data.map((row) => ({ ...row, userId: req.user.id }));
        saveTransactions(results, file.path, res);
      } catch (error) {
        console.error('🔴 Excel upload error:', error);
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          success: false, 
          message: 'Excel read error',
          error: error.message 
        });
      }
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported file type',
        error: `File type '${ext}' is not supported. Please upload CSV, JSON, or Excel files.` 
      });
    }
  });
};

// ✅ Helper to insert transactions
const saveTransactions = async (data, path, res) => {
  try {
    // Check if data is empty
    if (!data || data.length === 0) {
      fs.unlinkSync(path);
      return res.status(400).json({ 
        success: false, 
        message: 'No data found in file',
        error: 'File appears to be empty or contains no valid rows'
      });
    }

    // Basic presence validation
    const isValid = data.every(tx =>
      tx.date && tx.type && tx.amount && tx.category && tx.paymentMethod && tx.status
    );

    if (!isValid) {
      fs.unlinkSync(path);
      return res.status(400).json({ 
        success: false, 
        message: 'One or more rows have missing required fields.',
        error: 'Validation failed for required fields: date, type, amount, category, paymentMethod, status'
      });
    }

    // Validate type values
    const validTypes = ['income', 'expense'];
    const invalidTypes = data.filter(tx => !validTypes.includes((tx.type || '').toString().toLowerCase()));
    if (invalidTypes.length > 0) {
      fs.unlinkSync(path);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid type values found. Allowed values: ${validTypes.join(', ')}`,
        error: `Invalid type values: ${invalidTypes.map(tx => tx.type).join(', ')}`
      });
    }

    // Validate status values (Completed / Pending)
    const validStatuses = ['Completed', 'Pending'];
    const invalidStatuses = data.filter(tx => !validStatuses.includes((tx.status || '').toString().trim()));
    if (invalidStatuses.length > 0) {
      fs.unlinkSync(path);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status values found. Allowed values: ${validStatuses.join(', ')}`,
        error: `Invalid status values: ${invalidStatuses.map(tx => tx.status).join(', ')}`
      });
    }

    // Transform and insert
    const parseDateSafe = (dateStr) => {
      if (!dateStr) return null;
      // Try native Date first
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
      // Try MM/DD/YYYY
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          const parsed = new Date(year, month, day);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
      // Try DD-MM-YYYY or MM-DD-YYYY heuristics
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [a, b, c] = parts.map((p) => parseInt(p, 10));
          // If last part looks like year
          if (String(c).length === 4) {
            // Heuristic: if a > 12, treat as DD-MM-YYYY
            if (a > 12) {
              const parsed = new Date(c, b - 1, a);
              if (!isNaN(parsed.getTime())) return parsed;
            } else {
              const parsed = new Date(c, a - 1, b);
              if (!isNaN(parsed.getTime())) return parsed;
            }
          }
        }
      }
      throw new Error(`Unable to parse date: ${dateStr}`);
    };

    const formatted = data.map((tx) => {
      const parsedDate = parseDateSafe(tx.date);
      const parsedDueDate = tx.dueDate ? parseDateSafe(tx.dueDate) : null;
      const parsedAmount = parseFloat(tx.amount);

      if (isNaN(parsedAmount)) {
        throw new Error(`Invalid amount: ${tx.amount}`);
      }

      return {
        userId: tx.userId,
        date: parsedDate,
        type: tx.type.toLowerCase(),
        amount: parsedAmount,
        category: tx.category,
        paymentMethod: tx.paymentMethod,
        status: (tx.status || '').toString().trim(),
        dueDate: parsedDueDate,
        notes: tx.notes || ''
      };
    });

    await Transaction.insertMany(formatted);
    fs.unlinkSync(path);
    res.json({ 
      success: true, 
      message: 'Transactions uploaded successfully', 
      count: formatted.length,
      data: {
        uploaded: formatted.length,
        totalAmount: formatted.reduce((sum, tx) => sum + tx.amount, 0)
      }
    });
  } catch (error) {
    console.error('❌ Insert error:', error);
    if (fs.existsSync(path)) fs.unlinkSync(path);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving transactions',
      error: error.message
    });
  }
};

// ✅ Manual Add Transaction
export const addTransaction = async (req, res) => {
  try {
    const {
      date, type, amount, category, paymentMethod,
      status, dueDate, notes
    } = req.body;

    // Validate type value
    const validTypes = ['income', 'expense'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid type. Allowed values: ${validTypes.join(', ')}`,
        error: `Type '${type}' is not valid`
      });
    }

    // Validate status value (Completed/Pending)
    const validStatuses = ['Completed', 'Pending'];
    const cleanedStatus = (status || '').toString().trim();
    if (!validStatuses.includes(cleanedStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
        error: `Status '${status}' is not valid`
      });
    }

    // Parse and validate date
    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format',
          error: `Unable to parse date: ${date}`
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format',
        error: `Date parsing failed: ${error.message}`
      });
    }

    // Parse and validate dueDate if provided
    let parsedDueDate = null;
    if (dueDate) {
      try {
        parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid due date format',
            error: `Unable to parse due date: ${dueDate}`
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid due date format',
          error: `Due date parsing failed: ${error.message}`
        });
      }
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount',
        error: `Amount '${amount}' is not a valid number`
      });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      date: parsedDate,
      type: type.toLowerCase(),
      amount: parsedAmount,
      category,
      paymentMethod,
      status: cleanedStatus,
      dueDate: parsedDueDate,
      notes
    });

    await transaction.save();
    res.status(201).json({ 
      success: true, 
      message: 'Transaction added successfully', 
      data: { transaction },
      timestamp: new Date()
    });
  } catch (err) {
    console.error('❌ Add error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add transaction',
      error: err.message 
    });
  }
};

// ✅ Update Transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found',
        error: 'No transaction found with the specified ID for this user'
      });
    }

    res.json({ 
      success: true, 
      message: 'Transaction updated successfully', 
      data: { transaction: updated },
      timestamp: new Date()
    });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update transaction',
      error: err.message 
    });
  }
};

// ✅ Delete Transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found',
        error: 'No transaction found with the specified ID for this user'
      });
    }

    res.json({ 
      success: true, 
      message: 'Transaction deleted successfully',
      data: { deletedId: id },
      timestamp: new Date()
    });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete transaction',
      error: err.message 
    });
  }
};
