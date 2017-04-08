import { expect } from 'chai';
import * as fs from 'fs';
import * as streamMaker from '../src/stream_maker';

describe('stream_maker', () => {
    describe('#normalizeWriteStream()', () => {
        it('should convert paths to write streams', () => {
            expect(streamMaker.normalizeWriteStream('test.empty')).to.have.property('bytesWritten');
        });

        it('should return write streams as-is', () => {
            const stream = fs.createWriteStream('test.empty');
            expect(streamMaker.normalizeWriteStream(stream)).to.equal(stream);
        });

        it('should throw when encountering something other than a string or write stream', () => {
            expect(() => { streamMaker.normalizeWriteStream(null); }).to.throw();
            expect(() => { streamMaker.normalizeWriteStream(42 as any); }).to.throw();
            expect(() => { streamMaker.normalizeWriteStream(String as any); }).to.throw();
        });
    });
});
