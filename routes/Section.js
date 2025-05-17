const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');

router.get('/section/index', sectionController.index);
router.post('/section/store', sectionController.store);
router.post('/section/get-section-data', sectionController.getSectionData);
router.post('/section/edit', sectionController.sectionDataEdit);

module.exports = router;
