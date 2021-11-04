"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasperDidResolver = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
const did_resolver_1 = require("did-resolver");
const VALUE_NOT_FOUNT_ERROR_CODE = -32003;
class CasperDidResolver extends did_resolver_1.Resolver {
    constructor(resolverOptions) {
        super();
        this.resolverOptions = resolverOptions;
    }
    resolve(didUrl, options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign(Object.assign({}, (this.resolverOptions || {})), (options || {}));
            const clientRpc = new casper_js_sdk_1.CasperServiceByJsonRPC(options.rpcUrl);
            const contractDIDHash = options.contract;
            const blockHashBase16 = '';
            const stateRootHash = yield clientRpc.getStateRootHash(blockHashBase16);
            const resolvedPublicKey = this.resolvePublickKey(didUrl);
            const didDocument = yield this.readDidDocument(resolvedPublicKey, clientRpc, contractDIDHash, stateRootHash);
            yield this.readDelegates(didDocument, clientRpc, contractDIDHash, stateRootHash);
            yield this.readAttributes(didDocument, clientRpc, contractDIDHash, stateRootHash);
            return {
                didResolutionMetadata: { contentType: 'application/did+ld+json' },
                didDocument,
                didDocumentMetadata: {}
            };
        });
    }
    resolvePublickKey(didUrl) {
        let publicKeyHex = didUrl;
        if (didUrl.length > 64) {
            publicKeyHex = didUrl.substr(didUrl.length - 64);
            if (didUrl.length >= 66) {
                const type = +didUrl.substr(didUrl.length - 66, 2);
                return {
                    type,
                    url: didUrl,
                    publicKeyHex
                };
            }
            return { type: 1, url: didUrl, publicKeyHex };
        }
        return {
            type: 1,
            url: didUrl,
            publicKeyHex
        };
    }
    getDefaultDiDDocument(pubKey) {
        const publickKey = pubKey.publicKeyHex;
        const typeCfg = this.getTypeInfo(pubKey.type);
        return {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                typeCfg.url,
            ],
            id: publickKey,
            verificationMethod: [
                {
                    id: `${publickKey}#controller`,
                    type: typeCfg.type,
                    controller: publickKey,
                    blockchainAccountId: `${publickKey}@eip155:4`,
                },
            ],
            authentication: [`${publickKey}#controller`],
            assertionMethod: [`${publickKey}#controller`],
        };
    }
    getTypeInfo(pubKeyType) {
        if (pubKeyType == 2) {
            return {
                type: 'Ed25519VerificationKey2018',
                url: 'https://digitalbazaar.github.io/ed25519-signature-2018-context/contexts/ed25519-signature-2018-v1.jsonld'
            };
        }
        return {
            type: 'EcdsaSecp256k1RecoveryMethod2020',
            url: 'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld'
        };
    }
    buildKey(didUrl, suffix) {
        const key = casper_js_sdk_1.Keys.Ed25519.accountHash(casper_js_sdk_1.decodeBase16(didUrl));
        return `${Buffer.from(key).toString('hex')}${suffix || ''}`;
    }
    readKey(key, clientRpc, contractDIDHash, stateRootHash) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield clientRpc.getBlockState(stateRootHash, contractDIDHash, [key]);
            return (_a = result === null || result === void 0 ? void 0 : result.CLValue) === null || _a === void 0 ? void 0 : _a.data;
        });
    }
    readDidDocument(pubKey, clientRpc, contractDIDHash, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this.buildKey(pubKey.publicKeyHex);
                return yield this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
            }
            catch (e) {
                if (e.code = VALUE_NOT_FOUNT_ERROR_CODE) {
                    //console.warn(e);
                    return this.getDefaultDiDDocument(pubKey);
                }
                else {
                    throw e;
                }
            }
        });
    }
    readDelegates(didDocument, clientRpc, contractDIDHash, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletagesLength = yield this.readDeligateLength(didDocument.id, clientRpc, contractDIDHash, stateRootHash);
            if (deletagesLength) {
                const arr = new Array(deletagesLength).fill(0).map((_, i) => i);
                const nowTimestamp = new Date().valueOf();
                for (const index of arr) {
                    const key = this.buildKey(didDocument.id, `_delegate_${index}`);
                    const result = yield this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
                    const [name, value, expirationTimestamp] = result.map(t => t.data.toString());
                    if (+expirationTimestamp > nowTimestamp) {
                        const id = `${didDocument.id}#delegate-${index}`;
                        didDocument.verificationMethod.push({
                            id,
                            type: name,
                            controller: didDocument.id,
                            publicKeyHex: value
                        });
                        if (name == 'sigAuth') {
                            didDocument.authentication.push(id);
                        }
                    }
                }
            }
        });
    }
    readDeligateLength(id, clientRpc, contractDIDHash, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.buildKey(id, '_delegateLength');
            try {
                let result = yield this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
                return +result || 0;
            }
            catch (e) {
                console.log(e);
                return 0;
            }
        });
    }
    readAttributes(didDocument, clientRpc, contractDIDHash, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributesLength = yield this.readAttributesLength(didDocument.id, clientRpc, contractDIDHash, stateRootHash);
            if (attributesLength) {
                const arr = new Array(attributesLength).fill(0).map((_, i) => i);
                const nowTimestamp = new Date().valueOf();
                for (const index of arr) {
                    const key = this.buildKey(didDocument.id, `_attribute_${index}`);
                    const result = yield this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
                    const [name, value, expirationTimestamp] = result.map(t => t.data.toString());
                    if (+expirationTimestamp > nowTimestamp) {
                        let attribute = null;
                        if (name.startsWith('did/svc/')) {
                            const nameArr = name.split('/');
                            attribute = {
                                id: `${didDocument.id}#service-${index}`,
                                type: nameArr[nameArr.length - 1],
                                serviceEndpoint: value
                            };
                            didDocument.service = Array.isArray(didDocument.service) ? [...didDocument.service, attribute] : [attribute];
                            attribute = null;
                        }
                        else if (name.startsWith('did/pub/')) {
                            const nameArr = name.split('/');
                            attribute = {
                                id: `${didDocument.id}#controller-${index}`,
                                type: nameArr[2] == 'Ed25519' ? 'Ed25519VerificationKey2018' : nameArr[2],
                                controller: didDocument.id,
                                publicKeyHex: value
                            };
                        }
                        if (!!attribute) {
                            didDocument.verificationMethod.push(attribute);
                        }
                    }
                }
            }
        });
    }
    readAttributesLength(id, clientRpc, contractDIDHash, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.buildKey(id, '_attributeLength');
            try {
                let result = yield this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
                return +result || 0;
            }
            catch (e) {
                console.log(e);
                return 0;
            }
        });
    }
}
exports.CasperDidResolver = CasperDidResolver;
//# sourceMappingURL=casper-did-resolver.js.map