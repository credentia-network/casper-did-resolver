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
            const result = yield clientRpc.getBlockState(stateRootHash, CONTRACT_DID_HASH, [key]);
            return result;
        });
    }
}
exports.CasperDidResolver = CasperDidResolver;
//# sourceMappingURL=casper-did-resolver.js.map