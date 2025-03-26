const rateLimit = require("express-rate-limit");
const { pool } = require("../config/db");
const { createUserTable, usersTable } = require("../model/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { createCsoTable, csoTable } = require("../model/cso");
const { createStaffTable, staffTable } = require("../model/staff");
const nodemailer = require("nodemailer");
// const bcrypt = require("bcrypt");
const bcrypt = require('bcryptjs');

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
    const [users] = await pool.query(
      `SELECT * FROM users WHERE registrationId = ? AND email = ?`,
      [registrationId, email]
    );

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided registration ID or email.",
      });
    }

    const user = users[0];

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    // Verify password (compare plain-text password with hashed password)
    const isPasswordValid = await bcrypt.compare(password, user.password);


    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        registrationId: user.registrationId,
        userId: user.userId,
        role: user.role,
      },
      secretKey,
      { expiresIn: "1h" }
    );

    // Cookie options
    const cookieOptions = {
      httpOnly: true, // Prevent access by JavaScript
      secure: process.env.NODE_ENV === "production", // Send only over HTTPS in production
      sameSite: "Strict", // Prevent CSRF
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/", // Accessible across the entire site
    };

    // Set cookie
    res.cookie("token", token, cookieOptions);

    // Return success response
    return res.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// async function me(req, res){
//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized: No token found",
//     });
//   }
//   try {
//     const decoded = jwt.verify(token, secretKey);
//     res.json({
//       success: true,
//       role: decoded.role,
//       registrationId: decoded.registrationId,
//       id: decoded.id,
//     });
//   } catch (error) {
//     console.error("Error verifying token:", error);
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized: Invalid token",
//     });
//   }
// };

async function me(req, res) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token found",
    });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    res.json({
      success: true,
      role: decoded.role,
      registrationId: decoded.registrationId,
      userId: decoded.userId,
      id: decoded.id,
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
}



// Create User Account
async function createAccount(req, res) {
  try {
    await createUserTable();

    const { registrationId, password } = req.body;
    if (!registrationId || !password) {
      return res.status(400).json({ success: false, message: "Registration ID and password are required." });
    }

    // Check if the registrationId exists in CSO table
    const [csoRecord] = await pool.query(`SELECT * FROM cso WHERE registrationId = ?`, [registrationId]);
    if (!csoRecord.length) {
      return res.status(404).json({ success: false, message: "CSO record not found for the provided registration ID." });
    }

    // Check if user already exists
    const [existingUser] = await pool.query(`SELECT * FROM users WHERE registrationId = ?`, [registrationId]);
    if (existingUser.length) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into users table
    await pool.query(`INSERT INTO users (registrationId, userId, name, email, role, status, password) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      registrationId,
      csoRecord[0].id,
      csoRecord[0].csoName,
      csoRecord[0].email,
      csoRecord[0].role,
      "active",
      hashedPassword,
    ]);

    res.json({ success: true, message: "User account created successfully." });
  } catch (error) {
    console.error("Error creating user account:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    // Fetch user from the database
    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0]; // Get user data

    // Compare the current password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      hashedPassword,
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Password in Database (Without Hashing)
    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      hashedPassword,
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
  me,
};
