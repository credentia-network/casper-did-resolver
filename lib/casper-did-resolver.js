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
            const contractHash = yield this.getAccountNamedKeyValue(clientRpc, stateRootHash, options.contractKey, options.contract);
            if (!contractHash) {
                throw new Error(`Key '${options.contract}' couldn't be found.`);
            }
            let key = "attribute_";
            key += Buffer.from(options.contractKey.accountHash()).toString('hex');
            key += "_";
            key += didUrl;
            const result = yield clientRpc.getBlockState(stateRootHash, contractHash, [key]);
            console.log("attribute result:");
            console.log(result.CLValue.data[0]);
            console.log(result.CLValue.data[1]);
            return result;
        });
    }
    getAccountInfo(client, stateRootHash, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
            const storedValue = yield client.getBlockState(stateRootHash, `account-hash-${accountHash}`, []);
            return storedValue.Account;
        });
    }
    ;
    getAccountNamedKeyValue(client, stateRootHash, keyPair, namedKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountInfo = yield this.getAccountInfo(client, stateRootHash, keyPair);
            if (!accountInfo) {
                throw new Error('IdentifierProvider.getAccountInfo returned an undefined result.');
            }
            const res = accountInfo.namedKeys.find(i => i.name === namedKey);
            return res.key;
        });
    }
}
exports.CasperDidResolver = CasperDidResolver;
//# sourceMappingURL=casper-did-resolver.js.map