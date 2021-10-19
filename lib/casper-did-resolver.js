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
const CONTRACT_DID_HASH = "hash-7ac5a7bd9b9e7370085c60429969f512cdad2e74e9728af23afe20fdaf0c67a9";
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
            const blockHashBase16 = '';
            const stateRootHash = yield clientRpc.getStateRootHash(blockHashBase16);
            let key = "attribute_";
            key += didUrl;
            if (options === null || options === void 0 ? void 0 : options.accept) {
                key += `_${options.accept}`;
            }
            try {
                const result = yield clientRpc.getBlockState(stateRootHash, CONTRACT_DID_HASH, [key]);
                return result;
            }
            catch (e) {
                if (e.code = VALUE_NOT_FOUNT_ERROR_CODE) {
                    const didDocument = this.getDefaultDiDDocument(didUrl);
                    return {
                        didResolutionMetadata: { error: 'notFound' },
                        didDocument,
                        didDocumentMetadata: {}
                    };
                }
                console.error(e);
            }
        });
    }
    getDefaultDiDDocument(did) {
        const publickKey = this.getDidPublickKey(did);
        const type = this.getType(did);
        return {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://identity.foundation/EcdsaSecp256k1RecoverySignature2020/lds-ecdsa-secp256k1-recovery2020-0.0.jsonld',
            ],
            id: did,
            verificationMethod: [
                {
                    id: `${did}#controller`,
                    type,
                    controller: did,
                    blockchainAccountId: `${publickKey}@eip155:4`,
                },
            ],
            authentication: [`${did}#controller`],
            assertionMethod: [`${did}#controller`],
        };
    }
    getDidPublickKey(did) {
        const data = did.split(':');
        return data[data.length - 1];
    }
    getType(did) {
        const publickKey = this.getDidPublickKey(did);
        const code = +publickKey.substr(publickKey.startsWith('0x') ? 2 : 0, 2);
        if (code == 2) {
            return '';
        }
        return 'EcdsaSecp256k1RecoveryMethod2020';
    }
}
exports.CasperDidResolver = CasperDidResolver;
//# sourceMappingURL=casper-did-resolver.js.map