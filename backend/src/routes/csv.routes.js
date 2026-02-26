import express from 'express';
import multer from 'multer';
import * as csvController from '../controllers/csv.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

router.use(protect);

router.get('/template', csvController.downloadTemplate);
router.post('/upload', upload.single('file'), csvController.uploadCSV);

export default router;
