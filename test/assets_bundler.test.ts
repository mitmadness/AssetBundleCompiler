import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as assetsBundler from '../src/assets_bundler';

describe('AssetsBundler', () => {
    const tmpFilePath = path.normalize(`${os.tmpdir()}/test.empty`);
    let bundler: assetsBundler.AssetsBundler;

    before(() => fs.createFileSync(tmpFilePath));

    beforeEach(() => bundler = new assetsBundler.AssetsBundler());

    describe('#includingAssets()', () => {
        it('should take path strings or read streams', () => {
            expect(bundler.includingAssets(tmpFilePath)).to.equal(bundler);
            expect(bundler.includingAssets(fs.createReadStream(tmpFilePath))).to.equal(bundler);
        });

        it('should throw when passing something other than a string or read stream', () => {
            expect(() => { bundler.includingAssets(null as any); }).to.throw();
            expect(() => { bundler.includingAssets(5 as any); }).to.throw();
            expect(() => { bundler.includingAssets(fs.createWriteStream(tmpFilePath) as any); }).to.throw();
        });
    });

    describe('#targeting()', () => {
        it('should take strings', () => {
            expect(bundler.targeting('EnumMemberName')).to.equal(bundler);
        });

        it('should throw when passing something other than a string', () => {
            expect(() => { bundler.targeting(null as any); }).to.throw();
            expect(() => { bundler.targeting(5 as any); }).to.throw();
        });
    });
});
