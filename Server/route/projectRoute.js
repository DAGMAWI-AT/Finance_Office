//route/projectandproposalRoute

const express = require('express');
const router = express.Router();
const projectController = require('../controller/projectsController');

// Serve static files
router.use("/", express.static("/uploads"));

router.post('/create', projectController.createProject);
router.get('/all', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.get('/user/:userId', projectController.getProjectsByUserId);
router.put('/update/:id', projectController.updateProject);
router.delete('/delete/:id', projectController.deleteProject);

module.exports = router;
