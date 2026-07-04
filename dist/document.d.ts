export type UploadedDocument = Pick<File, 'name' | 'type' | 'arrayBuffer' | 'text'>;
export declare const isPdfDocument: (file: Pick<UploadedDocument, "name" | "type">) => boolean;
export declare const isDocxDocument: (file: Pick<UploadedDocument, "name" | "type">) => boolean;
export declare const extractTextFromUploadedDocument: (file: UploadedDocument) => Promise<string>;
