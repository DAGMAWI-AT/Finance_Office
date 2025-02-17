const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

const getReportDashboard = async (req, res) => {
  try {
    // Fetch data from the database
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [cso] = await pool.query("SELECT COUNT(*) as count FROM cso");
    const [reports] = await pool.query("SELECT COUNT(*) as count FROM user_reports");
    // const [projects] = await pool.query("SELECT COUNT(*) as count FROM projects");

    // Calculate percentages (example logic, adjust as needed)
    const totalUsers = users[0].count;
    const totalCSO = cso[0].count;
    const totalReports = reports[0].count;
    // const totalProjects = projects[0].count;

    const usersPercentage = (totalUsers / 1000) * 100; // Example calculation
    const csoPercentage = (totalCSO / 500) * 100; // Example calculation
    const reportsPercentage = (totalReports / 1000) * 100; // Example calculation
    // const projectsPercentage = (totalProjects / 100) * 100; // Example calculation

    res.json({
      usersPercentage,
      usersCount: totalUsers,
      csoPercentage,
      csoCount: totalCSO,
      reportsPercentage,
      reportsCount: totalReports,
    //   projectsPercentage,
    //   projectsCount: totalProjects,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {getReportDashboard};