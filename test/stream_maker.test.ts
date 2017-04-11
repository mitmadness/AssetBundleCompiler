import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as streamMaker from '../src/stream_maker';

describe('stream_maker', () => {
    const tmpFilePath = path.normalize(`${os.tmpdir()}/test.empty`);

    describe('isWriteStream()', () => {
        it('should recognize WriteStreams', () => {
            const stream = fs.createWriteStream(tmpFilePath);
            expect(streamMaker.isWriteStream(stream)).to.be.true;
        });

        it('should return false for non-WriteStreams', () => {
            const stream = fs.createReadStream(tmpFilePath);
            expect(streamMaker.isWriteStream(stream as any)).to.be.false;
            expect(streamMaker.isWriteStream(null as any)).to.be.false;
        });
    });

    describe('isReadStream()', () => {
        it('should recognize ReadStreams', () => {
            const stream = fs.createReadStream(tmpFilePath);
            expect(streamMaker.isReadStream(stream)).to.be.true;
        });

        it('should return false for non-ReadStreams', () => {
            const stream = fs.createWriteStream(tmpFilePath);
            expect(streamMaker.isReadStream(stream as any)).to.be.false;
            expect(streamMaker.isReadStream(null as any)).to.be.false;
        });
    });

    describe('normalizeWriteStream()', () => {
        it('should convert paths to write streams', () => {
            const stream = streamMaker.normalizeWriteStream(tmpFilePath);
            expect(streamMaker.isWriteStream(stream)).to.be.true;
        });

        it('should return write streams as-is', () => {
            const stream = fs.createWriteStream(tmpFilePath);
            expect(streamMaker.normalizeWriteStream(stream)).to.equal(stream);
        });

        it('should throw when encountering something other than a string or write stream', () => {
            expect(() => { streamMaker.normalizeWriteStream(null as any); }).to.throw();
            expect(() => { streamMaker.normalizeWriteStream(42 as any); }).to.throw();
            expect(() => { streamMaker.normalizeWriteStream(String as any); }).to.throw();
        });
    });

    describe('normalizeReadStream()', () => {
        it('should convert paths to read streams', () => {
            const stream = streamMaker.normalizeReadStream(tmpFilePath);
            expect(streamMaker.isReadStream(stream)).to.be.true;
        });

        it('should return read streams as-is', () => {
            const stream = fs.createReadStream(tmpFilePath);
            expect(streamMaker.normalizeReadStream(stream)).to.equal(stream);
        });

        it('should throw when encountering something other than a string or read stream', () => {
            expect(() => { streamMaker.normalizeReadStream(null as any); }).to.throw();
            expect(() => { streamMaker.normalizeReadStream(42 as any); }).to.throw();
            expect(() => { streamMaker.normalizeReadStream(String as any); }).to.throw();
        });
    });

    after(() => fs.removeSync(tmpFilePath));
});
