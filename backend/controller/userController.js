// src/controllers/userController.js
const rateLimit = require("express-rate-limit");
const { UserCollection } = require("../model/user");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secretKey = process.env.JWT_secretKey;
if (!secretKey) {
  throw new Error("JWT_secretKey is not set in the environment variables.");
}

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
    const { registrationId, password } = req.body;
    const user = await UserCollection.findOne({ registrationId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with the provided registration ID.",
      });
    }

    const isPasswordValid = password === user.password;
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    const token = jwt.sign(
      { id: user._id, registrationId: user.registrationId, role: user.role },
      secretKey, // Ensure this matches across your app
      { expiresIn: "1s" }
    );
    
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production"  ,    
    //   sameSite: "strict", // Protect against CSRF
    //   maxAge: 3600000, // 1 hour
    // });
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: token,
      role: user.role,
      // registrationId: user.registrationId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Handle create account
async function createAccount(req, res) {
  try {
    const { registrationId, password } = req.body;

    // Validate input
    if (!registrationId || !password) {
      return res.status(400).json({
        success: false,
        message: "Registration ID and password are required.",
      });
    }

    const existingUserAccount = await UserCollection.findOne({ registrationId });
    if (existingUserAccount) {
      return res.status(400).json({
        success: false,
        message: "An account already exists for the provided registration ID.",
      });
    }
    // Check in StaffCollection
    let user = await StaffCollection.findOne({ registrationId });

    // If not found, check in CSOCollection
    if (!user) {
      user = await CSOCollection.findOne({ registrationId });
    }

    // If no matching record found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No record found for the provided registration ID.",
      });
    }

    // Prepare user account data
    const userAccount = {
      registrationId: user.registrationId,
      name: user.name || user.csoName, // Staff uses `name`, CSO uses `csoName`
      userId: `${user.name || user.csoName}-${Date.now()}`,
      email: user.email,
      role: user.role || "CSO", // Staff uses `role`, default "CSO" for CSOs
      status: user.status,
      password, // Store a hashed version of the password in production
      createdAt: new Date(),
    };

    // Insert user account
    const result = await UserCollection.insertOne(userAccount);

    res.json({
      success: true,
      message: "User account created successfully.",
      result,
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
    const users = await UserCollection.find().toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
//Get single user
async function getUsersId(req, res) {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await UserCollection.findOne(filter);
  res.send(result);
}


async function logout(req, res)  {
  // Clear the token from the cookies
  res.clearCookie("token"); 
  res.clearCookie("user"); // Clear the token from the cookie
  return res.json({ message: "Successfully logged out" });
};

module.exports = { login, createAccount, getUsers, getUsersId, logout, loginLimite};
