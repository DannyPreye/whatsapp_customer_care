import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import
{
    uploadDocument,
    listDocuments,
    getDocument,
    deleteDocument,
    reprocessDocument,
    documentsStatus,
    bulkUploadDocuments
} from '../controllers/documents.controller';

const router = Router();

const uploadSchema = z.object({
    name: z.string().optional(),
    content: z.string().optional()
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) =>
    {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

router.post('/organizations/:organizationId/documents/upload', authRequired, upload.single('file'), uploadDocument);
router.get('/organizations/:organizationId/documents', authRequired, listDocuments);
router.get('/organizations/:organizationId/documents/:id', authRequired, getDocument);
router.delete('/organizations/:organizationId/documents/:id', authRequired, deleteDocument);
router.post('/organizations/:organizationId/documents/:id/reprocess', authRequired, reprocessDocument);
router.get('/organizations/:organizationId/documents/status', authRequired, documentsStatus);
router.post('/organizations/:organizationId/documents/bulk-upload', authRequired, validate(z.object({ items: z.array(uploadSchema) })), bulkUploadDocuments);

export default router;
