import { Request, Response } from 'express';
import { DocumentsService } from '../services/documents.service';
import { cloudinaryService } from '../services/cloudinary.service';
import { ok, created, noContent } from '../utils/response';

const service = new DocumentsService();

function getDocumentTypeFromMimeType(mimeType: string): string
{
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType === 'text/plain') return 'TEXT';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'EXCEL';
    if (mimeType === 'text/csv') return 'CSV';
    return 'TEXT';
}

export async function uploadDocument(req: Request, res: Response)
{
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'file is required' });

    const user = (req as any).user;

    // console.log('\n\n\nUploading document for user:', user);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const upload = await cloudinaryService.uploadBuffer(file.buffer, file.originalname);
    const payload = {
        organizationId: organizationId,
        name: req.body.name || file.originalname,
        originalName: file.originalname,
        type: getDocumentTypeFromMimeType(file.mimetype),
        fileUrl: upload.url,
        fileSize: upload.bytes,
        mimeType: file.mimetype,
        uploadedBy: user.sub,
        content: req.body.content
    } as any;
    const data = await service.upload(payload);


    return created(res, data);
}

export async function listDocuments(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const data = await service.list(organizationId);
    return ok(res, data);
}

export async function getDocument(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const data = await service.getById(req.params.id, organizationId);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function deleteDocument(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const success = await service.remove(req.params.id, organizationId);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return noContent(res);
}

export async function reprocessDocument(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const data = await service.reprocess(req.params.id, organizationId);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function documentsStatus(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const data = await service.status(organizationId);
    return ok(res, data);
}

export async function bulkUploadDocuments(req: Request, res: Response)
{
    const organizationId = req.params.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    const items = (req.body.items || []).map((item: any) => ({
        ...item,
        organizationId: organizationId
    }));
    const data = await service.bulkUpload(items);
    return created(res, data);
}
