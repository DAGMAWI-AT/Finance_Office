// src/controllers/userController.js
const { UserCollection } = require("../model/user");
const jwt = require("jsonwebtoken");
const { secretKey } = require("../configration/jwtConfig");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
      secretKey,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: token,
      user: {
        registrationId: user.registrationId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
      userId: `${user.name}-${Date.now()}` || `{user.csoName}-${Date.now()}`,
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

module.exports = { login, createAccount, getUsers, getUsersId };