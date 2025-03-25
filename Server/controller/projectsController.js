const { pool } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).array("files", 5);

// Helper function to delete files
const deleteFiles = (filePaths) => {
  if (!filePaths) return;
  const files = Array.isArray(filePaths) ? filePaths : filePaths.split(",");
  files.forEach((filePath) => {
    const fullPath = path.join(uploadDir, filePath.trim());
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
};


// Create a new project with file upload
exports.createProject = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    const { user_id, title, description } = req.body;

    if (!user_id || !title || !description) {
      if (req.files) {
        deleteFiles(req.files.map((file) => file.filename));
      }
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const filePaths = req.files ? req.files.map((file) => file.filename).join(",") : "";

    try {
      const insertQuery = `
        INSERT INTO projectandproposal (user_id, title, description, files)
        VALUES (?, ?, ?, ?)
      `;
      const [result] = await pool.query(insertQuery, [user_id, title, description, filePaths]);

      res.status(201).json({
        success: true,
        message: "Project created successfully!",
        projectId: result.insertId,
      });
    } catch (error) {
      if (req.files) {
        deleteFiles(req.files.map((file) => file.filename));
      }
      console.error("Database error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM projectandproposal");
    res.status(200).json(results);
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await pool.query("SELECT * FROM projectandproposal WHERE id = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get projects by user ID
exports.getProjectsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await pool.query("SELECT * FROM projectandproposal WHERE user_id = ?", [userId]);
    res.status(200).json(results);
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update project (with file upload)






// Update project (removes old files when new files are uploaded)
exports.updateProject = (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
  
      const { title, description, removedFiles } = req.body;
      const projectId = req.params.id;
  
      try {
        // Fetch existing project data
        const [existingProject] = await pool.query(
          "SELECT files FROM projectandproposal WHERE id = ?",
          [projectId]
        );
  
        if (existingProject.length === 0) {
          return res.status(404).json({ success: false, message: "Project not found" });
        }
  
        // Process files
        let existingFiles = existingProject[0].files 
          ? existingProject[0].files.split(",") 
          : [];
  
        // Delete removed files
        if (removedFiles) {
          const filesToRemove = JSON.parse(removedFiles);
          deleteFiles(filesToRemove);
          existingFiles = existingFiles.filter(f => !filesToRemove.includes(f));
        }
  
        // Add new files
        const newFiles = req.files ? req.files.map(f => f.filename) : [];
        const allFiles = [...existingFiles, ...newFiles].join(",");
  
        // Update database
        await pool.query(
          "UPDATE projectandproposal SET title = ?, description = ?, files = ? WHERE id = ?",
          [title, description, allFiles, projectId]
        );
  
        res.json({ success: true, message: "Project updated successfully!" });
      } catch (error) {
        // Cleanup new files if error occurs
        if (req.files) deleteFiles(req.files.map(f => f.filename));
        res.status(500).json({ success: false, error: error.message });
      }
    });
  };

// Delete project
exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const [existingProject] = await pool.query("SELECT files FROM projectandproposal WHERE id = ?", [id]);

    if (existingProject.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const filePaths = existingProject[0].files;

    // Delete the project from the database
    await pool.query("DELETE FROM projectandproposal WHERE id = ?", [id]);

    // Delete associated files
    if (filePaths) {
      deleteFiles(filePaths);
    }

    res.status(200).json({ success: true, message: "Project deleted successfully!" });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
