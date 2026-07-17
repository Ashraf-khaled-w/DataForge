import express from "express";
import multer from "multer";
import {
  getRecords,
  createRecord,
  getRecordsByWorkspaceId,
  getRecordById,
  updateRecord,
  deleteRecord,
  uploadRecords
} from "../controllers/recordController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for Excel/CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "text/csv" // csv
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("نوع الملف غير مدعوم، يرجى رفع ملف إكسيل/CSV فقط"));
    }
  }
});

// Apply auth middleware to protect all routes
router.use(authenticateToken);

// Record CRUD routes
router.get("/records", getRecords);
router.post("/records", createRecord);
router.get("/records/workspace/:id", getRecordsByWorkspaceId);
router.get("/record/:id", getRecordById);
router.patch("/record/:id", updateRecord);
router.delete("/record/:id", deleteRecord);

// Bulk upload route
router.post("/workspace/:workspace_id/upload", upload.single("file"), uploadRecords);

export default router;
