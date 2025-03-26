const { pool } = require('../config/db');
const { createApplicationFormTable, createFormTable } = require("../model/form");
const fs = require('fs');
const path = require('path');

exports.adminCreateForm = async (req, res) => {
    await createFormTable();
    try {
        const { form_name, expires_at } = req.body;
        const userId = req.user.id;

        // Verify admin privileges
        const [staffCheck] = await pool.query(
            'SELECT role, name FROM staff WHERE id = ?',
            [userId]
        );

        if (!staffCheck.length || staffCheck[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        if (!form_name || !expires_at) {
            return res.status(400).json({ 
                error: 'Missing required fields: form_name, expires_at' 
            });
        }

        const [result] = await pool.query(
            'INSERT INTO forms (form_name, expires_at, createdBy) VALUES (?, ?, ?)',
            [form_name, new Date(expires_at), staffCheck[0].name]
        );

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message
        });
    }
};

exports.getAllFormsForAdmin = async (req, res) => {
    try {
        const [forms] = await pool.query('SELECT * FROM forms ORDER BY created_at DESC');
        res.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllForms = async (req, res) => {
    await createApplicationFormTable();
    try {
      const userId = req.user.id; // Assuming you have user authentication
  
      const [forms] = await pool.query(`
        SELECT 
          f.id AS form_id,
          f.form_name,
          f.expires_at,
          f.createdBy,
          f.created_at,
          f.updated_at,
          af.id AS submission_id,
          af.created_at,
          af.application_file,
          af.status,
          af.update_permission
        FROM forms f 
        LEFT JOIN applicationForm af ON f.id = af.form_id AND af.user_id = ?
        ORDER BY f.created_at DESC
      `, [userId]);
  
      const processedForms = forms.map((form) => ({
        id: form.form_id,
        form_name: form.form_name,
        expires_at: form.expires_at,
        createdBy: form.createdBy,
        created_at: form.created_at,
        updated_at: form.updated_at,
        is_editable: new Date(form.expires_at) > new Date(), // Derive is_editable from expires_at
        user_submission: form.submission_id
          ? {
              id: form.submission_id,
              submitted_at: form.created_at,
              application_file: form.application_file,
              status: form.status,
              update_permission: form.update_permission,
            }
          : null,
      }));
  
      res.status(200).json(processedForms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      res.status(500).json({ error: 'Failed to fetch forms' });
    }
  };
exports.getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // Assuming you have user authentication

        // Fetch the form
        const [form] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);

        if (!form.length) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Fetch the user's submission for this form
        const [userSubmission] = await pool.query(
            'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
            [userId, id]
        );

        // Add user_submission data to the form response
        const canEdit = new Date(form[0].expires_at) > new Date();
        form[0].can_edit = canEdit;
        form[0].user_submission = userSubmission.length > 0 ? userSubmission[0] : null;

        res.json(form[0]);
    } catch (error) {
        console.error('Error fetching form:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const { form_name, expires_at } = req.body;

        const [result] = await pool.query(
            'UPDATE forms SET form_name = ?, expires_at = ? WHERE id = ?',
            [form_name, new Date(expires_at), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteForm = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM forms WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



//// application form
exports.getUserSubmission = async (req, res) => {
    await createApplicationFormTable();
    try {
        const { form_id } = req.query;
        const userId = req.user.id;

        const [submission] = await pool.query(
            'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
            [userId, form_id]
        );

        res.json(submission);
    } catch (error) {
        console.error('Error fetching user submission:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllSubmission = async (req, res) => {
    await createApplicationFormTable();

    try {
        const { form_id } = req.query;
        const userId = req.user.id;
        const [staffCheck] = await pool.query(
            'SELECT role FROM staff WHERE id = ?',
            [userId]
        );

        if (!staffCheck.length || staffCheck[0].role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // const [submission] = await pool.query(
        //     'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
        //     [userId, form_id]
        // );
    const [submission] = await pool.execute(`SELECT * FROM applicationForm ORDER BY created_at DESC`);

        res.json(submission);
    } catch (error) {
        console.error('Error fetching user submission:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getAllApplicationForms = async (req, res) => {
    await createApplicationFormTable();

    try {
        const userId = req.user.id; // Get user ID from authentication

        const [forms] = await pool.execute(
            `SELECT * FROM applicationForm WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        res.json(forms);
    } catch (error) {
        console.error("Error fetching application forms:", error);
        res.status(500).json({ error: "Server error" });
    }
};
exports.getApplicationFormById = async (req, res) => {
    await createApplicationFormTable();

    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid application ID' });
        }

        let query = 'SELECT * FROM applicationForm WHERE id = ?';
        const params = [id];

        // Only add user_id condition for non-admin users
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        const [applicationForm] = await pool.execute(query, params);

        if (applicationForm.length === 0) {
            return res.status(404).json({ 
                error: userRole === 'admin' || userRole === 'super_admin' 
                    ? 'Application form not found' 
                    : 'Application form not found or unauthorized' 
            });
        }

        res.json(applicationForm[0]);
    } catch (error) {
        console.error('Error fetching application form:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getApplicationFormsByUserId = async (req, res) => {
    await createApplicationFormTable();

    try {
        const { userId } = req.params;
        const userRole = req.user.role;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        let query = 'SELECT * FROM applicationForm WHERE cso_id = ?';
        const params = [userId];

        // For non-admin users, restrict to their own data
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            if (req.user.id !== parseInt(user_id)) {
                return res.status(403).json({ error: 'Unauthorized access' });
            }
        }

        const [applicationForms] = await pool.execute(query, params);

        res.json(applicationForms);
    } catch (error) {
        console.error('Error fetching application forms:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updateApplicationStatus = async (req, res) => {
    await createApplicationFormTable();

    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
  
      // Verify admin role
      const [staffCheck] = await pool.query(
        'SELECT role FROM staff WHERE id = ?',
        [userId]
      );
  
      if (!staffCheck.length || staffCheck[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
  
      const [result] = await pool.query(
        'UPDATE applicationForm SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }
  
      res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
      console.error('Status update error:', error);
      res.status(500).json({ error: 'Server error' });
    }
};
exports.updateApplicationUpdatePermission = async (req, res) => {
    await createApplicationFormTable();

    try {
      const { id } = req.params;
      const { update_permission } = req.body;
      const userId = req.user.id;
  
      // Verify admin role
      const [staffCheck] = await pool.query(
        'SELECT role FROM staff WHERE id = ?',
        [userId]
      );
  
      if (!staffCheck.length || staffCheck[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
  
      const [result] = await pool.query(
        'UPDATE applicationForm SET update_permission = ?, updated_at = NOW() WHERE id = ?',
        [update_permission, id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }
  
      res.json({ success: true, message: 'update permission updated successfully' });
    } catch (error) {
      console.error('update permission update error:', error);
      res.status(500).json({ error: 'Server error' });
    }
};
exports.deleteApplicationForm = async (req, res) => {
    await createApplicationFormTable();

    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: 'Invalid application ID' });
        }

        // For admin/super-admin: just verify the application exists
        if (userRole === 'admin' || userRole === 'super_admin') {
            const [check] = await pool.query(
                'SELECT * FROM applicationForm WHERE id = ?',
                [id]
            );
            
            if (check.length === 0) {
                return res.status(404).json({ error: 'Application form not found' });
            }
        } 
        // For regular users: verify they own the application
        else {
            const [check] = await pool.query(
                'SELECT * FROM applicationForm WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            
            if (check.length === 0) {
                return res.status(404).json({ 
                    error: 'Application form not found or not authorized' 
                });
            }
        }

        // Delete associated files first (if needed)
        const [appToDelete] = await pool.query(
            'SELECT application_file FROM applicationForm WHERE id = ?',
            [id]
        );
        
        if (appToDelete.length > 0 && appToDelete[0].application_file) {
            const filePath = path.join(__dirname, '../uploads', appToDelete[0].application_file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete the application
        const [result] = await pool.query(
            'DELETE FROM applicationForm WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Application form not found' });
        }

        // Delete associated comments
        await pool.query(
            'DELETE FROM comments WHERE report_id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            message: 'Application and associated files/comments deleted successfully' 
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.submitApplicationForm = async (req, res) => {
    await createApplicationFormTable();
    try {
        const { form_id, report_name, description } = req.body;
        const application_file = req.file; // File uploaded by multer (stored in memory)
        const userId = req.user.id;

        // Verify that the form exists and is not expired
        const [form] = await pool.query('SELECT * FROM forms WHERE id = ?', [form_id]);
        const [row] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        // const [cso] = await pool.query('SELECT * FROM cso WHERE id = ?', [row.userId]);

        if (!form.length) {
            return res.status(404).json({ error: 'Form not found' });
        }

        let fileName = null;

        if (application_file) {
            // Define the upload folder
            const uploadFolder = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadFolder)) {
                fs.mkdirSync(uploadFolder, { recursive: true }); // Create the folder if it doesn't exist
            }

            // Generate a unique filename
            fileName = `${Date.now()}_${application_file.originalname}`;
            const filePath = path.join(uploadFolder, fileName);

            // Write the file buffer to the upload folder
            fs.writeFileSync(filePath, application_file.buffer);
        }

        // Check if the user has already submitted an application for this form
        const [existingApplication] = await pool.query(
            'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
            [userId, form_id]
        );

        // Check if the form is expired and the user has no permission to update
        const isFormExpired = new Date(form[0].expires_at) < new Date();
        const hasExistingSubmission = existingApplication.length > 0;
        const isUpdatePermissionClosed = hasExistingSubmission && existingApplication[0].update_permission === "close";

        if (isFormExpired && isUpdatePermissionClosed) {
            return res.status(400).json({ error: 'Form submission closed' });
        }

        if (hasExistingSubmission) {
            // Update the existing application
            const [result] = await pool.query(
                `UPDATE applicationForm
                 SET form_name = ?, report_name = ?, description = ?, application_file = ?, expires_at = ?
                 WHERE user_id = ? AND form_id = ?`,
                [
                    form[0].form_name,
                    report_name,
                    description,
                    fileName || existingApplication[0].application_file, // Retain existing file if no new file is uploaded
                    form[0].expires_at,
                    userId,
                    form_id,
                ]
            );

            return res.status(200).json({ success: true, id: existingApplication[0].id });
        } else {
            // Insert a new application
            const [result] = await pool.query(
                `INSERT INTO applicationForm (user_id, cso_id, form_id, form_name, report_name, description, application_file, expires_at, update_permission)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, row[0].userId, form_id, form[0].form_name, report_name, description, fileName, form[0].expires_at, "close"]
            );

            return res.status(201).json({ success: true, id: result.insertId });
        }
    } catch (error) {
        console.error('Error submitting application form:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// exports.submitApplicationForm = async (req, res) => {
//     await createApplicationFormTable();
//     try {
//         const { form_id, report_name, description } = req.body;
//         const application_file = req.file; // File uploaded by multer (stored in memory)
//         const userId = req.user.id;

//         // Verify that the form exists and is not expired
//         const [form] = await pool.query('SELECT * FROM forms WHERE id = ?', [form_id]);

//         if (!form.length) {
//             return res.status(404).json({ error: 'Form not found' });
//         }

        
//         let fileName = null;

//         if (application_file) {
//             // Define the upload folder
//             const uploadFolder = path.join(__dirname, '../uploads');
//             if (!fs.existsSync(uploadFolder)) {
//                 fs.mkdirSync(uploadFolder, { recursive: true }); // Create the folder if it doesn't exist
//             }

//             // Generate a unique filename
//             fileName = `${Date.now()}_${application_file.originalname}`;
//             const filePath = path.join(uploadFolder, fileName);

//             // Write the file buffer to the upload folder
//             fs.writeFileSync(filePath, application_file.buffer);
//         }

//         // Check if the user has already submitted an application for this form
//         const [existingApplication] = await pool.query(
//             'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
//             [userId, form_id]
//         );
//         if(!existingApplication.length){
//            update_permission = "close"
//         }
//         if (new Date(form[0].expires_at) < new Date() && (existingApplication[0].update_permission === "close" )) {
//             return res.status(400).json({ error: 'Form submission closed' });
//         }

//         if (existingApplication.length > 0) {
//             // Update the existing application
//             const [result] = await pool.query(
//                 `UPDATE applicationForm
//                  SET form_name = ?, report_name = ?, description = ?, application_file = ?, expires_at = ?
//                  WHERE user_id = ? AND form_id = ?`,
//                 [
//                     form[0].form_name,
//                     report_name,
//                     description,
//                     fileName || existingApplication[0].application_file, // Retain existing file if no new file is uploaded
//                     form[0].expires_at,
//                     userId,
//                     form_id,
//                 ]
//             );

//             return res.status(200).json({ success: true, id: existingApplication[0].id });
//         } else {
//             // Insert a new application
//             const [result] = await pool.query(
//                 `INSERT INTO applicationForm (user_id, form_id, form_name, report_name, description, application_file, expires_at)
//                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [userId, form_id, form[0].form_name, report_name, description, fileName, form[0].expires_at]
//             );

//             return res.status(201).json({ success: true, id: result.insertId });
//         }
//     } catch (error) {
//         console.error('Error submitting application form:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
// exports.submitApplicationForm = async (req, res) => {
//     await createApplicationFormTable();
//     try {
//         const { form_id, report_name, description } = req.body;
//         const application_file = req.file; // File uploaded by multer (stored in memory)
//         const userId = req.user.id;

//         // Verify that the form exists and is not expired
//         const [form] = await pool.query('SELECT * FROM forms WHERE id = ?', [form_id]);

//         if (!form.length) {
//             return res.status(404).json({ error: 'Form not found' });
//         }

//         if (new Date(form[0].expires_at) < new Date()) {
//             return res.status(400).json({ error: 'Form submission closed' });
//         }

//         let filePath = null;
//         let fileName = null;

//         if (application_file) {
//             // Define the upload folder
//             const uploadFolder = path.join(__dirname, '../uploads');
//             if (!fs.existsSync(uploadFolder)) {
//                 fs.mkdirSync(uploadFolder, { recursive: true }); // Create the folder if it doesn't exist
//             }

//             // Generate a unique filename
//             fileName = `${Date.now()}_${application_file.originalname}`;
//             filePath = path.join(uploadFolder, fileName);

//             // Write the file buffer to the upload folder
//             fs.writeFileSync(fileName, application_file.buffer);
//         }

//         // Check if the user has already submitted an application for this form
//         const [existingApplication] = await pool.query(
//             'SELECT * FROM applicationForm WHERE user_id = ? AND form_id = ?',
//             [userId, form_id]
//         );

//         if (existingApplication.length > 0) {
//             // Update the existing application
//             const [result] = await pool.query(
//                 `UPDATE applicationForm
//                  SET form_name = ?, report_name = ?, description = ?, application_file = ?, expires_at = ?
//                  WHERE user_id = ? AND form_id = ?`,
//                 [form[0].form_name, report_name, description, fileName?fileName:existingApplication[0].application_file, form[0].expires_at, userId, form_id]
//             );

//             return res.status(200).json({ success: true, id: existingApplication[0].id });
//         } else {
//             // Insert a new application
//             const [result] = await pool.query(
//                 `INSERT INTO applicationForm (user_id, form_id, form_name, report_name, description, application_file, expires_at)
//                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
//                 [userId, form_id, form[0].form_name, report_name, description, fileName, form[0].expires_at]
//             );

//             return res.status(201).json({ success: true, id: result.insertId });
//         }
//     } catch (error) {
//         console.error('Error submitting application form:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };
// exports.getApplicationFormById = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const userId = req.user.id;
  
//       if (!id || isNaN(id)) {
//         return res.status(400).json({ error: 'Invalid application ID' });
//       }
  
//       const [applicationForm] = await pool.execute(
//         `SELECT * FROM applicationForm WHERE id = ? AND user_id = ?`,
//         [id, userId]
//       );
  
//       if (applicationForm.length === 0) {
//         return res.status(404).json({ error: 'Application form not found or unauthorized' });
//       }
  
//       res.json(applicationForm[0]);
//     } catch (error) {
//       console.error('Error fetching application form:', error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   };
  
// exports.updateApplicationFormStatus = async (req, res) => {
//     try {
//         const { applicationId } = req.params;
//         const { status } = req.body;
//         const userId = req.user.id;

//         // Verify admin privileges
//         const [staffCheck] = await pool.query(
//             'SELECT role FROM staff WHERE id = ?',
//             [userId]
//         );

//         if (!staffCheck.length || staffCheck[0].role !== 'admin') {
//             return res.status(403).json({ error: 'Admin access required' });
//         }

//         const [result] = await pool.query(
//             'UPDATE applicationForm SET status = ? WHERE id = ?',
//             [status, applicationId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Application form not found' });
//         }

//         res.json({ success: true });
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// exports.deleteApplicationForm = async (req, res) => {
//     try {
//         const { id } = req.params; // Changed from applicationId to id
//         const userId = req.user.id;

//         // Optional: Verify the application belongs to the user
//         const [check] = await pool.query(
//             'SELECT * FROM applicationForm WHERE id = ? AND user_id = ?',
//             [id, userId]
//         );

//         if (check.length === 0) {
//             return res.status(404).json({ error: 'Application form not found or not authorized' });
//         }

//         const [result] = await pool.query(
//             'DELETE FROM applicationForm WHERE id = ?',
//             [id]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Application form not found' });
//         }

//         res.json({ success: true, message: 'Application deleted successfully' });
//     } catch (error) {
//         console.error('Delete error:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// };