const rateLimit = require("express-rate-limit");
const { pool } = require("../config/db");
const { createUserTable, usersTable } = require("../model/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { createCsoTable, csoTable } = require("../model/cso");
const { createStaffTable, staffTable } = require("../model/staff");
const nodemailer = require("nodemailer");

const secretKey = process.env.JWT_secretKey;
// if (!secretKey) {
//   throw new Error("JWT_secretKey is not set in the environment variables.");
// }
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

const restKey = process.env.JWT_SECRET;
if (!restKey) {
  throw new Error("JWT_SECRET is not set in the environment variables.");
}

const generateResetToken = (userId) => {
  return jwt.sign({ id: userId }, restKey, { expiresIn: "1h" });
};
const loginLimite = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: "Too many login attempts. Please try again later.",
  statusCode: 429, // Status code for rate limiting
  headers: true, // Include rate limiting headers in the response
});
// Handle login
async function login(req, res) {
  try {
    const { registrationId, email, password } = req.body;

    // Find user by registrationId
    const [user] = await pool.query(
      `SELECT * FROM ${usersTable} WHERE registrationId = ? AND email = ?`,
      [registrationId, email]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided registration ID or Email.",
      });
    }
    if (user[0].status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }
    const isPasswordValid = password === user[0].password;
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user[0].id,
        registrationId: user[0].registrationId,
        role: user[0].role,
      },
      secretKey,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: token,
      role: user[0].role,
      registrationId: user[0].registrationId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Handle create account
async function createAccount(req, res) {
  try {
    await createUserTable();
    await createStaffTable();
    await createCsoTable();
    const { registrationId, password } = req.body;

    // Validate input
    if (!registrationId || !password) {
      return res.status(400).json({
        success: false,
        message: "Registration ID and password are required.",
      });
    }

    // Check if the registrationId exists in csoTable and staffTable
    const [dataRecord] = await pool.query(
      `SELECT * FROM ${csoTable} WHERE registrationId = ?`,
      [registrationId]
    );

    // Check if the registrationId exists in csoTable
    const [csoRecord] = await pool.query(
      `SELECT * FROM ${csoTable} WHERE registrationId = ?`,
      [registrationId]
    );

    // If not found in csoTable, check staffTable
    let staffRecord = [];
    if (csoRecord.length === 0) {
      [staffRecord] = await pool.query(
        `SELECT * FROM ${staffTable} WHERE registrationId = ?`,
        [registrationId]
      );
    }

    // If not found in both tables, return 404 error
    if (csoRecord.length === 0 && staffRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No record found in both CSO and Staff tables for the provided registration ID.",
      });
    }

    let usersTableExists = false;

    try {
      // Check if usersTable exists by querying the INFORMATION_SCHEMA
      const [tableCheck] = await pool.query(
        `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
        [usersTable]
      );

      usersTableExists = tableCheck[0]?.count > 0;
    } catch (err) {
      console.error("Error checking table existence:", err);
      throw err;
    }

    if (!usersTableExists) {
      await createUserTable();
    }
    // Check if the user already exists in usersTable
    const [existingUser] = await pool.query(
      `SELECT * FROM ${usersTable} WHERE registrationId = ?`,
      [registrationId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "An account already exists for the provided registration ID.",
      });
    }

    // Prepare user account data
    const userAccount = {
      registrationId,
      name: csoRecord[0]?.csoName || staffRecord[0]?.name, // Use name from csoTable if available
      userId: `user-${Date.now()}`,
      email: csoRecord[0]?.email || staffRecord[0]?.email, // Use email from csoTable if available
      role: csoRecord[0]?.role || staffRecord[0]?.role, // Default role
      status: "active",
      password, // Store a hashed version of the password in production
      createdAt: new Date(),
    };

    // Insert user account into usersTable
    await pool.query(`INSERT INTO ${usersTable} SET ?`, [userAccount]);

    res.json({
      success: true,
      message: "User account created successfully.",
    });
  } catch (error) {
    console.error("Error creating user account:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// Get all users
async function getUsers(req, res) {
  try {
    const [users] = await pool.query(`SELECT * FROM ${usersTable}`);
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get single user
async function getUsersId(req, res) {
  try {
    const id = req.params.id;
    const [user] = await pool.query(
      `SELECT * FROM ${usersTable} WHERE id = ?`,
      [id]
    );
    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    data.updated_at = new Date();

    if (data.createdAt) {
      delete data.createdAt;
    }
    const [result] = await pool.query(
      `UPDATE ${usersTable} SET ? WHERE id = ?`,
      [data, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User updated successfully." });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM ${usersTable} WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

async function updatePassword(req, res) {
  try {
    const userId = req.user.id; // From JWT middleware
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    // Fetch user from database
    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0]; // Get user data

    // Skip password hashing (direct comparison)
    if (currentPassword !== user.password) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Directly update the password (no hashing)
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      newPassword,
      userId,
    ]);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Handle logout
async function logout(req, res) {
  res.clearCookie("token");
  res.clearCookie("user");
  return res.json({ message: "Successfully logged out" });
}

// const generateResetToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
// };

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const [rows] = await pool.query(`SELECT id FROM users WHERE email = ?`, [
      email,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    const userId = rows[0].id;
    const token = generateResetToken(userId);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });

    res.json({ success: true, message: "Reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Verify Token
    const decoded = jwt.verify(token, restKey);
    const userId = decoded.id;

    // Update Password in Database (Without Hashing)
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      newPassword,
      userId,
    ]);

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(400)
      .json({ success: false, message: "Invalid or expired token." });
  }
};
module.exports = {
  login,
  createAccount,
  getUsers,
  getUsersId,
  updateUser,
  deleteUser,
  updatePassword,
  logout,
  loginLimite,
  resetPassword,
  forgotPassword,
};
