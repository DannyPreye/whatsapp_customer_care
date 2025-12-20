import { Request, Response } from 'express';
import { DocumentsService } from '../services/documents.service';
import { cloudinaryService } from '../services/cloudinary.service';
import { ok, created, noContent } from '../utils/response';

const service = new DocumentsService();

export async function uploadDocument(req: Request, res: Response)
{
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'file is required' });
    const upload = await cloudinaryService.uploadBuffer(file.buffer, file.originalname);
    const payload = {
        organizationId: req.body.organizationId,
        name: req.body.name || file.originalname,
        originalName: file.originalname,
        type: (req.body.type as any) || 'TEXT',
        fileUrl: upload.url,
        fileSize: upload.bytes,
        mimeType: file.mimetype,
        uploadedBy: req.body.uploadedBy,
        content: req.body.content
    } as any;
    const data = await service.upload(payload);
    return created(res, data);
}

export async function listDocuments(_req: Request, res: Response)
{
    const data = await service.list();
    return ok(res, data);
}

export async function getDocument(req: Request, res: Response)
{
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function deleteDocument(req: Request, res: Response)
{
    const success = await service.remove(req.params.id);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return noContent(res);
}

export async function reprocessDocument(req: Request, res: Response)
{
    const data = await service.reprocess(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function documentsStatus(_req: Request, res: Response)
{
    const data = await service.status();
    return ok(res, data);
}

export async function bulkUploadDocuments(req: Request, res: Response)
{
    const data = await service.bulkUpload(req.body.items || []);
    return created(res, data);
}
