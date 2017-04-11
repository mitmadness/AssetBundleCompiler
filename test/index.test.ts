import { expect } from 'chai';
import * as assetsBundler from '../src/AssetsBundler';
import * as index from '../src/index';

describe('index', () => {
    describe('bundle', () => {
        it('should return an AssetsBundler', () => {
            expect(index.bundle()).to.be.an.instanceof(assetsBundler.AssetsBundler);
        });
    });
});
