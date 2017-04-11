import * as fs from 'fs';

export type ReadableFileInput = string|fs.ReadStream;
export type WritableFileInput = string|fs.WriteStream;

export function normalizeReadStream(file: ReadableFileInput) {
    if (typeof file === 'string') {
        file = fs.createReadStream(file);
    } else if (!isReadStream(file)) {
        throw new Error(`Expected file path or fs.ReadStream, got ${file}.`);
    }

    return file;
}

export function normalizeWriteStream(file: WritableFileInput) {
    if (typeof file === 'string') {
        file = fs.createWriteStream(file);
    } else if (!isWriteStream(file)) {
        throw new Error(`Expected file path or fs.WriteStream, got ${file}.`);
    }

    return file;
}

export function isReadStream(file: ReadableFileInput): file is fs.ReadStream {
    const stream = file as fs.ReadStream;
    return !!(stream && stream.path !== undefined && stream.bytesRead !== undefined);
}

export function isWriteStream(file: WritableFileInput): file is fs.WriteStream {
    const stream = file as fs.WriteStream;
    return !!(stream && stream.path !== undefined && stream.bytesWritten !== undefined);
}
