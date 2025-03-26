
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");

// Function to get the report dashboard statistics
const getReportDashboard = async (req, res) => {
  try {
    // Fetch total user count
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users");

    // Fetch count of active and inactive users
    const [statusUsers] = await pool.query("SELECT status, COUNT(*) as count FROM users GROUP BY status");

    // Fetch total CSOs
    const [cso] = await pool.query("SELECT COUNT(*) as count FROM cso");

    // Fetch total user reports
    const [reports] = await pool.query("SELECT COUNT(*) as count FROM applicationForm");

    // Fetch total staff count
    const [staff] = await pool.query("SELECT COUNT(*) as count FROM staff");

    // Fetch count of staff by status
    const [statusStaff] = await pool.query("SELECT status, COUNT(*) as count FROM staff GROUP BY status");

    // Fetch count of staff by role
    const [roleStaff] = await pool.query("SELECT role, COUNT(*) as count FROM staff GROUP BY role");

    // Calculate the total active and inactive users
    const activeUsers = statusUsers.find(user => user.status === 'active')?.count || 0;
    const inactiveUsers = statusUsers.find(user => user.status === 'inactive')?.count || 0;
    // Calculate the total admin and super admin and active and inactive
    const adminStaff = roleStaff.find(user => user.role === 'admin')?.count || 0;
    const superAdminStaff = roleStaff.find(user => user.role === 'sup_admin')?.count || 0;
    const activeStaff = statusStaff.find(user => user.status === 'active')?.count || 0;
    const inactiveStaff = statusStaff.find(user => user.status === 'inactive')?.count || 0;
    // Extract total counts
    const totalUsers = users[0].count;
    const totalCSO = cso[0].count;
    const totalReports = reports[0].count;
    const totalStaff = staff[0].count;

    // Prepare data for response
    res.json({
      activeUsers,
      inactiveUsers,
      totalUsers,
      totalCSO,
      totalReports,
      totalStaff,
      adminStaff,
      superAdminStaff,
      activeStaff,
      inactiveStaff
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Function to get the status report
const getStatusReport = async (req, res) => {
  const query = `
    SELECT status, COUNT(*) AS count
    FROM applicationForm
    GROUP BY status
  `;

  try {
    // Query database to get status counts
    const [results] = await pool.query(query);

    const statusCounts = {
      approve: 0,
      pending: 0,
      reject: 0,
      new: 0,
      inprogress: 0
    };

    // Populate status counts with values from the database
    results.forEach(result => {
      if (statusCounts[result.status] !== undefined) {
        statusCounts[result.status] = result.count;
      }
    });

    res.json(statusCounts);
  } catch (err) {
    console.error("Error fetching status report:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCategoryWithStatusCountsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }
    // Fetch status counts directly from user_reports, grouped by form_name
    const [rows] = await pool.execute(
      `SELECT form_name, status, COUNT(*) AS count 
       FROM applicationForm 
       WHERE user_id = ?
       GROUP BY form_name, status`,[userId]
    );

    // Organize data in the required format
    const groupedReports = rows.reduce((acc, row) => {
      const { form_name, status, count } = row;

      if (!acc[form_name]) {
        acc[form_name] = { new: 0, approve: 0, reject: 0, pending: 0, inprogress: 0, total:0 };
      }
      acc[form_name][status] = count; // Assign count to the correct status
      acc[form_name].total += count; // Add count to total

      return acc;
    }, {});

    res.json({ success: true, reports: groupedReports });
  } catch (error) {
    console.error("Error fetching reports by category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
module.exports = { getReportDashboard, getStatusReport, getCategoryWithStatusCountsByUserId };


// const express = require("express");
// const router = express.Router();
// const { pool } = require("../config/db");

// const getReportDashboard = async (req, res) => {
//   try {
//     // Fetch data from the database
//     const [users] = await pool.query("SELECT COUNT(*) as count FROM users");
//     const [statusUsers] = await pool.query("SELECT status COUNT(*) as count FROM users GROUP BY status");
//     const [cso] = await pool.query("SELECT COUNT(*) as count FROM cso");
//     const [reports] = await pool.query("SELECT COUNT(*) as count FROM user_reports");
//     const [staff] = await pool.query("SELECT COUNT(*) as count FROM staff");
//     const [statusStaff] = await pool.query("SELECT status COUNT(*) as count FROM staff GROUP BY status");
//     const [roleStaff] = await pool.query("SELECT role COUNT(*) as count FROM staff GROUP BY role");




//     // Calculate percentages (example logic, adjust as needed)
//     const totalUsers = users[0].count;
//     const totalStatusUsers = statusUsers[0].count;

//     const totalCSO = cso[0].count;

//     const totalReports = reports[0].count;

//     const totalStaff = staff[0].count;
//     const totalStatusStaff = statusStaff[0].count;
//     const totalRoleStaff = roleStaff[0].count;




//     const statusUsersPercentage = (totalStatusUsers / totalUsers) * 100;// i want active and in active user 


//     res.json({
//       statusUsersPercentage,
//       usersCount: totalStatusUsers,
//       usersCount: totalUsers,
//       csoCount: totalCSO,
//       reportsCount: totalReports,
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard stats:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };
// const getStatusReport = async (req, res) => {
//   const query = `
//     SELECT status, COUNT(*) AS count
//     FROM user_reports
//     GROUP BY status
//   `;

//   try {
//     // Use async/await to query the database
//     const [results] = await pool.query(query);

//     const statusCounts = {
//       approve: 0,
//       pending: 0,
//       reject: 0,
//       new: 0,
//       inprogress: 0
//     };

//     // Fill in the counts for each status
//     results.forEach(result => {
//       statusCounts[result.status] = result.count;
//     });

//     res.json(statusCounts);
//   } catch (err) {
//     console.error("Error fetching status report:", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// module.exports = {getReportDashboard, getStatusReport};