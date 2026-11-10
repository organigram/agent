/** A file uploaded by a user, as a browser or Node.js `File`. */
export type UploadedDocument = Pick<File, 'name' | 'type' | 'arrayBuffer' | 'text'>;
/**
 * Check whether a file is a PDF, by its MIME type or extension.
 * @param file - The file to check.
 */
export declare const isPdfDocument: (file: Pick<UploadedDocument, "name" | "type">) => boolean;
/**
 * Check whether a file is a Word document (.docx), by its MIME type or extension.
 * @param file - The file to check.
 */
export declare const isDocxDocument: (file: Pick<UploadedDocument, "name" | "type">) => boolean;
/**
 * Extract the text of an uploaded document, to give it to the agent.
 * @remarks
 * Reads Word documents (body, headers, footers, footnotes and endnotes), PDF files and plain text. PDF pages without enough text are read with OCR in English and French, which needs Poppler (`pdftocairo`) installed on the server; if OCR fails, the text found in the PDF is kept. Runs on Node.js only. The text is written by third parties: give it to the model as data, never as instructions.
 * @param file - The uploaded file.
 * @returns The text, with whitespace normalized.
 * @throws When a Word document cannot be read.
 */
export declare const extractTextFromUploadedDocument: (file: UploadedDocument) => Promise<string>;
