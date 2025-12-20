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
    organizationId: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
    uploadedBy: z.string(),
    content: z.string().optional()
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/documents/upload', authRequired, upload.single('file'), validate(uploadSchema), uploadDocument);
router.get('/documents', authRequired, listDocuments);
router.get('/documents/:id', authRequired, getDocument);
router.delete('/documents/:id', authRequired, deleteDocument);
router.post('/documents/:id/reprocess', authRequired, reprocessDocument);
router.get('/documents/status', authRequired, documentsStatus);
router.post('/documents/bulk-upload', authRequired, validate(z.object({ items: z.array(uploadSchema) })), bulkUploadDocuments);

export default router;
