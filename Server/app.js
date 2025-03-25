const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
const userRoute = require('./route/userRoute'); 
const csoRoute = require("./route/csoRoute");
const staffRoute = require("./route/staffRoute");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "form_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.status(401).json({ error: 'Invalid user' });
    
    req.user = user[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};
app.use('/api/users', userRoute);
app.use("/api/cso", csoRoute);
app.use("/api/staff", staffRoute);
// Auth Routes
// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
//     if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });

//     const valid = await bcrypt.compare(password, users[0].password);
//     if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

//     const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token, role: users[0].role });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Admin Routes
// app.post('/admin/forms', async (req, res) => {
//   try {
//     const { form_name, form_data, expires_at } = req.body;
//     const [result] = await pool.query(
//       'INSERT INTO forms (form_name, form_data, expires_at, created_by) VALUES (?, ?, ?, ?)',
//       [form_name, JSON.stringify(form_data), expires_at, "1"]
//     );
//     res.status(201).json({ id: result.insertId });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });
app.post('/admin/forms', async (req, res) => { // Add auth middlewares
  try {
    const { form_name, form_data, expires_at } = req.body;
    
    // Validate request body
    if (!form_name || !expires_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO forms (form_name, form_data, expires_at, created_by) VALUES (?, ?, ?, ?)',
      [
        form_name,
        JSON.stringify(form_data || {}), // Handle empty form_data
        new Date(expires_at), // Ensure proper date format
        "1" // Use authenticated user's ID instead of hardcoded "1"
      ]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: error.message // Include error details for debugging
    });
  }
});
app.put('/admin/forms/:id/deadline', authenticate, checkAdmin, async (req, res) => {
  try {
    const { expires_at } = req.body;
    await pool.query(
      'UPDATE forms SET expires_at = ? WHERE id = ?',
      [expires_at, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User Routes
app.get('/forms', async (req, res) => {
  try {
    const [forms] = await pool.query(`
      SELECT f.*, 
        (NOW() < f.expires_at OR u.role = 'admin') AS is_editable,
        s.submission_data AS user_submission
      FROM forms f
      LEFT JOIN submissions s ON f.id = s.form_id AND s.user_id = ?
      LEFT JOIN users u ON u.id = ?
    `, ["1", "2"]);
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/submissions', async (req, res) => {
  try {
    const { form_id, submission_data } = req.body;
    const [form] = await pool.query('SELECT * FROM forms WHERE id = ?', [form_id]);
    
    if (new Date(form[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'Form submission closed' });
    }

    const [result] = await pool.query(
      'INSERT INTO submissions (form_id, user_id, submission_data) VALUES (?, ?, ?)',
      [form_id, req.user.id, JSON.stringify(submission_data)]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
// app.get('/forms/:formId', async (req, res) => {
//   try {
//     const formId = req.params.formId;
//     const userId = "2";

//     const [results] = await pool.query(`
//       SELECT 
//         f.*,
//         (NOW() < f.expires_at OR EXISTS (
//           SELECT 1 FROM users WHERE id = ? AND role = 'admin'
//         )) AS is_editable,
//         s.submission_data AS user_submission,
//         s.submitted_at
//       FROM forms f
//       LEFT JOIN submissions s 
//         ON f.id = s.form_id 
//         AND s.user_id = ?
//       WHERE f.id = ?
//     `, [userId, userId, formId]);

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Form not found' });
//     }

//     const form = results[0];
    
//     // Parse JSON fields if stored as strings
//     if (typeof form.form_data === 'string') {
//       try {
//         form.form_data = JSON.parse(form.form_data);
//       } catch (error) {
//         console.error('Error parsing form_data:', error);
//         form.form_data = { fields: [] };
//       }
//     }

//     // Structure the response
//     const response = {
//       ...form,
//       user_submission: form.user_submission 
//         ? {
//             submission_data: form.user_submission,
//             submitted_at: form.submitted_at
//           }
//         : null
//     };

//     res.json(response);
//   } catch (error) {
//     console.error('Error fetching form:', error);
//     res.status(500).json({ 
//       error: 'Server error',
//       message: error.message
//     });
//   }
// });

app.get('/forms/:formId', async (req, res) => {
  try {
    const formId = parseInt(req.params.formId);
    const userId = "2";

    // Validate form ID
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form ID' });
    }

    const [results] = await pool.query(`
      SELECT 
        f.*,
        (NOW() < f.expires_at OR EXISTS (
          SELECT 1 FROM users WHERE id = ? AND role = 'admin'
        )) AS is_editable,
        s.submission_data AS user_submission,
        s.submitted_at
      FROM forms f
      LEFT JOIN submissions s 
        ON f.id = s.form_id 
        AND s.user_id = ?
      WHERE f.id = ?
    `, [userId, userId, formId]);

    if (!results.length) {
      return res.status(404).json({ 
        error: 'Form not found',
        message: `Form with ID ${formId} does not exist`
      });
    }

    // ... rest of the existing code ...

  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message
    });
  }
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));