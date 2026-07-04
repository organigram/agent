import { createRequire } from 'node:module';
import AdmZip from 'adm-zip';
import { input as pdfToImg } from 'node-pdftocairo';
import { createWorker } from 'tesseract.js';
const require = createRequire(import.meta.url);
let pdfJsModulePromise = null;
let pdfJsDomPolyfillsInstalled = false;
const installPdfJsDomPolyfills = () => {
    if (pdfJsDomPolyfillsInstalled)
        return;
    pdfJsDomPolyfillsInstalled = true;
    const globals = globalThis;
    if (globals.DOMMatrix != null &&
        globals.ImageData != null &&
        globals.Path2D != null) {
        return;
    }
    try {
        const canvas = require('@napi-rs/canvas');
        if (globals.DOMMatrix == null && canvas.DOMMatrix != null) {
            globals.DOMMatrix = canvas.DOMMatrix;
        }
        if (globals.ImageData == null && canvas.ImageData != null) {
            globals.ImageData = canvas.ImageData;
        }
        if (globals.Path2D == null && canvas.Path2D != null) {
            globals.Path2D = canvas.Path2D;
        }
    }
    catch (error) {
        console.warn('[document] Cannot load @napi-rs/canvas for PDF parsing.', error);
    }
};
const getPdfJsModule = async () => {
    if (pdfJsModulePromise == null) {
        installPdfJsDomPolyfills();
        pdfJsModulePromise = (async () => {
            const [pdfjsModule, pdfjsWorker] = await Promise.all([
                import('pdfjs-dist/legacy/build/pdf.mjs'),
                import('pdfjs-dist/legacy/build/pdf.worker.mjs')
            ]);
            const globals = globalThis;
            globals.pdfjsWorker = pdfjsWorker;
            return pdfjsModule;
        })();
    }
    return await pdfJsModulePromise;
};
const MIN_NATIVE_PAGE_CHAR_COUNT = 120;
const OCR_RESOLUTION = 180;
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOCX_TEXT_ENTRY_PATTERN = /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes)\.xml$/i;
const normalizeText = (value) => value.replace(/[\0]/g, ' ').replace(/\s+/g, ' ').trim();
const splitWords = (value) => normalizeText(value).split(/\s+/).filter(Boolean);
const hasEnoughNativeText = (value) => {
    const normalized = normalizeText(value);
    const words = splitWords(normalized);
    return (normalized.length >= MIN_NATIVE_PAGE_CHAR_COUNT ||
        words.length >= Math.floor(MIN_NATIVE_PAGE_CHAR_COUNT / 4));
};
const looksLikeReadableText = (value) => {
    const normalized = normalizeText(value);
    const words = splitWords(normalized);
    if (words.length < 10)
        return false;
    const letters = (normalized.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length;
    const digits = (normalized.match(/[0-9]/g) ?? []).length;
    return (letters + digits) / Math.max(normalized.length, 1) > 0.5;
};
const decodeXmlEntities = (value) => value.replace(/&(#x?[0-9a-fA-F]+|amp|apos|gt|lt|quot);/g, (_match, entity) => {
    switch (entity) {
        case 'amp':
            return '&';
        case 'apos':
            return "'";
        case 'gt':
            return '>';
        case 'lt':
            return '<';
        case 'quot':
            return '"';
        default:
            if (typeof entity === 'string' && entity.startsWith('#x')) {
                return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
            }
            if (typeof entity === 'string' && entity.startsWith('#')) {
                return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
            }
            return ' ';
    }
});
const extractTextFromDocxXml = (value) => {
    const withTextNodes = value
        .replace(/<w:(?:tab)[^/>]*\/>/g, ' ')
        .replace(/<w:(?:br|cr)[^/>]*\/>/g, '\n')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<\/w:tr>/g, '\n')
        .replace(/<\/w:tc>/g, '\t')
        .replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g, (_match, text) => decodeXmlEntities(text));
    return normalizeText(withTextNodes.replace(/<[^>]+>/g, ' '));
};
const extractTextFromDocxDocument = async (file) => {
    try {
        const zip = new AdmZip(Buffer.from(await file.arrayBuffer()));
        const texts = zip
            .getEntries()
            .filter(entry => DOCX_TEXT_ENTRY_PATTERN.test(entry.entryName))
            .sort((left, right) => left.entryName.localeCompare(right.entryName))
            .map(entry => extractTextFromDocxXml(entry.getData().toString('utf8')))
            .filter(Boolean);
        return normalizeText(texts.join('\n\n'));
    }
    catch {
        throw new Error('No usable text found in uploaded files.');
    }
};
const extractPdfPageTexts = async (buffer) => {
    const { getDocument } = await getPdfJsModule();
    const loadingTask = getDocument({
        data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
        useWorkerFetch: false,
        isEvalSupported: false
    });
    try {
        const pdf = await loadingTask.promise;
        const pages = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const text = normalizeText(textContent.items
                .map(item => {
                const candidate = item;
                return typeof candidate.str === 'string' ? candidate.str : '';
            })
                .join(' '));
            pages.push({ pageNumber, text });
            page.cleanup();
        }
        return pages;
    }
    finally {
        await loadingTask.destroy();
    }
};
const runOcrForPdfPages = async (buffer, pageNumbers) => {
    const results = new Map();
    if (pageNumbers.length === 0)
        return results;
    const worker = await createWorker(['eng', 'fra']);
    try {
        for (const pageNumber of pageNumbers) {
            const images = await pdfToImg(buffer, {
                format: 'jpeg',
                range: { f: pageNumber, l: pageNumber },
                resolution: OCR_RESOLUTION
            }).output();
            const image = images[0];
            if (image == null)
                continue;
            const { data: { text } } = await worker.recognize(image);
            results.set(pageNumber, normalizeText(text));
        }
    }
    finally {
        await worker.terminate();
    }
    return results;
};
export const isPdfDocument = (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
export const isDocxDocument = (file) => file.type === DOCX_MIME_TYPE || file.name.toLowerCase().endsWith('.docx');
export const extractTextFromUploadedDocument = async (file) => {
    if (isDocxDocument(file)) {
        return await extractTextFromDocxDocument(file);
    }
    if (!isPdfDocument(file)) {
        return normalizeText(await file.text());
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const pageTexts = await extractPdfPageTexts(buffer);
    const pagesNeedingOcr = pageTexts
        .filter(page => !hasEnoughNativeText(page.text) && !looksLikeReadableText(page.text))
        .map(page => page.pageNumber);
    let ocrTexts = new Map();
    if (pagesNeedingOcr.length > 0) {
        try {
            ocrTexts = await runOcrForPdfPages(buffer, pagesNeedingOcr);
        }
        catch (error) {
            console.warn('[document] OCR fallback failed, keeping native PDF text.', error);
        }
    }
    return pageTexts
        .map(page => {
        const ocrText = ocrTexts.get(page.pageNumber);
        if (ocrText != null && looksLikeReadableText(ocrText)) {
            return ocrText.length > page.text.length ? ocrText : page.text;
        }
        return page.text;
    })
        .filter(Boolean)
        .join('\n\n')
        .trim();
};
