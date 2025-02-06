const express = require("express");
const { pool } = require("../config/db");
const app = express();
app.use(express.json());
const {
  createReportCategoryTable,
  reportCategoryTable,
} = require("../model/reportCategory");

// Create a new report category
const postReportCategory = async (req, res) => {
  try {
    await createReportCategoryTable();
    const data = req.body;
    if (!data.expire_date || !data.category_name) {
      return res
        .status(400)
        .json({ success: false, massage: "expire data and category required" });
    }
    const [result] = await pool.query(
      `INSERT INTO ${reportCategoryTable} SET ?`,
      [data]
    );

    res.json({
      success: true,
      message: "Report category registered successfully.",
      categoryId: result.insertId,
    });
  } catch (error) {
    console.error("Error registering report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all active report categories (excluding expired ones)
const getReportCategory = async (req, res) => {
  try {
    const [result] = await pool.execute(
      `SELECT * FROM ${reportCategoryTable} WHERE expire_date IS NULL OR expire_date > NOW() ORDER BY created_at DESC`
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching report categories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getReportsCategory = async (req, res) => {
  try {
    // const [result] = await pool.execute(
    //   `SELECT * FROM ${reportCategoryTable} WHERE expire_date IS NULL OR expire_date > NOW() ORDER BY created_at DESC`
    // );
    const [result] = await pool.query(`SELECT * FROM ${reportCategoryTable}`);

    res.json(result);
  } catch (error) {
    console.error("Error fetching report categories:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get a single report category by ID
const getReportCategoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.execute(
      `SELECT * FROM ${reportCategoryTable} WHERE id = ?`,
      [id]
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching report category by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update a report category
const updateReportCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    if (!data.category_name || !data.expire_date) {
      return res.status(400).json({ success: false, massage: "required" });
    }
    // Ensure there is data to update
    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    data.updated_at = new Date(); // Automatically set updated time
    // Dynamically construct the SET clause
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(data);
    values.push(id); // Add ID to the values array

    const [result] = await pool.execute(
      `UPDATE ${reportCategoryTable} SET ${fields} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Report category updated successfully.",
    });
  } catch (error) {
    console.error("Error updating report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a report category
const deleteReportCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.execute(
      `DELETE FROM ${reportCategoryTable} WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Report category deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  postReportCategory,
  getReportsCategory,
  getReportCategory,
  getReportCategoryById,
  updateReportCategory,
  deleteReportCategory,
};
