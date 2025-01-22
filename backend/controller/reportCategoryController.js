const express = require("express");
const app = express();
const { reportCategoryCollection } = require("../model/reportCategory");
const { ObjectId } = require("mongodb");
app.use(express.json());

// Report category registration function
const postReportCategory = async (req, res) => {
  try {
    const data = req.body;

    // Insert the category data into the MongoDB collection
    const result = await reportCategoryCollection.insertOne(data);
    console.log(result);
    // Respond with success
    res.json({
      success: true,
      message: "Report category registered successfully.",
      result,
    });
  } catch (error) {
    console.error("Error registering report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all report categories
const getReportCategory = async (req, res) => {
  try {
    const reportCategory = await reportCategoryCollection.find().toArray();
    res.json(reportCategory);
  } catch (error) {
    console.error("Error fetching report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get single report category by ID
const getReportCategoryById = async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await reportCategoryCollection.findOne(filter);

    if (!result) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching report category by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update report category by ID
const updateReportCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    // Filter to find the category by ID
    const filter = { _id: new ObjectId(id) };

    // Update the category data
    const result = await reportCategoryCollection.updateOne(filter, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Report category updated successfully.",
      result,
    });
  } catch (error) {
    console.error("Error updating report category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  postReportCategory,
  getReportCategory,
  getReportCategoryById,
  updateReportCategory,
};
