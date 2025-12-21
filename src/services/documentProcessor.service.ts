import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import Tesseract from 'tesseract.js';
// import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import https from 'https';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';


export interface ProcessedDocument
{
    chunks: Array<{
        id: string;
        content: string;
        chunkIndex: number;
        metadata: Record<string, any>;
    }>;
    totalChunks: number;
}

export class DocumentProcessorService
{
    private textSplitter: RecursiveCharacterTextSplitter;

    constructor ()
    {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: [ '\n\n', '\n', '. ', ' ', '' ],
        });
    }

    private async downloadFile(fileUrl: string): Promise<string>
    {
        return new Promise((resolve, reject) =>
        {
            const tempDir = os.tmpdir();
            const fileName = `${uuidv4()}-${path.basename(fileUrl.split('?')[ 0 ])}`;
            const filePath = path.join(tempDir, fileName);
            const file = fs.createWriteStream(filePath);

            const protocol = fileUrl.startsWith('https') ? https : http;

            protocol.get(fileUrl, (response) =>
            {
                response.pipe(file);
                file.on('finish', () =>
                {
                    file.close();
                    resolve(filePath);
                });
            }).on('error', (err) =>
            {
                fs.unlink(filePath, () => { }); // Delete the file async if error
                reject(err);
            });
        });
    }

    async processDocument(
        filePath: string,
        fileType: string,
        documentId: string,
        documentName: string
    ): Promise<ProcessedDocument>
    {

        let text: string;
        let tempFilePath: string | null = null;

        try {
            // Check if filePath is a URL and download it first
            const processPath = filePath.startsWith('http') ? await this.downloadFile(filePath) : filePath;
            if (filePath.startsWith('http')) {
                tempFilePath = processPath;
            }

            switch (fileType.toUpperCase()) {
                case 'PDF':
                    text = await this.processPDF(processPath);
                    break;
                case 'IMAGE':
                    text = await this.processImage(processPath);
                    break;
                case 'DOCX':
                    text = await this.processDocx(processPath);
                    break;
                case 'CSV':
                    text = await this.processCsv(processPath);
                    break;
                case 'EXCEL':
                    text = await this.processExcel(processPath);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${fileType}`);

            }

            // Split into chunks
            const docs = await this.textSplitter.createDocuments([ text ]);

            const chunks = docs.map((doc, index) => ({
                id: uuidv4(),
                content: doc.pageContent,
                chunkIndex: index,
                metadata: {
                    documentId,
                    documentName,
                    fileType,
                    chunkIndex: index,
                    totalChunks: docs.length,
                },
            }));

            return {
                chunks,
                totalChunks: chunks.length,
            };
        } finally {
            // Clean up temporary file if it was downloaded
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlink(tempFilePath, () => { }); // Delete async, ignore errors
            }
        }
    }

    private async processPDF(filePath: string): Promise<string>
    {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent).join('\n\n');
    }

    private async processImage(filePath: string): Promise<string>
    {
        const result = await Tesseract.recognize(filePath, 'eng', {
            logger: (m) => console.log(m),
        });
        return result.data.text;
    }

    private async processDocx(filePath: string): Promise<string>
    {
        const loader = new DocxLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent).join('\n\n');
    }

    private async processCsv(filePath: string): Promise<string>
    {
        const loader = new CSVLoader(filePath);
        const docs = await loader.load();
        return docs.map((doc) => doc.pageContent).join('\n\n');
    }

    private async processExcel(filePath: string): Promise<string>
    {
        const workbook = XLSX.readFile(filePath);
        let text = '';

        workbook.SheetNames.forEach((sheetName) =>
        {
            const sheet = workbook.Sheets[ sheetName ];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            text += `\n\n=== ${sheetName} ===\n\n${csv}`;
        });

        return text;
    }

}


