import { DIDResolutionResult } from "@veramo/core";
import { CasperServiceByJsonRPC } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { DIDResolutionOptions, Resolver } from "did-resolver";

const CONTRACT_DID_HASH = "hash-7ac5a7bd9b9e7370085c60429969f512cdad2e74e9728af23afe20fdaf0c67a9";

export interface CasperDidResolverOptions extends DIDResolutionOptions {
    rpcUrl: string;
    contractKey: AsymmetricKey;
    contract: string;
}

export class CasperDidResolver extends Resolver {
    constructor(private resolverOptions?: CasperDidResolverOptions) {
        super();
    }

    async resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> {
        options = {
            ...(this.resolverOptions || {}),
            ...(options || {})
        };

        const clientRpc = new CasperServiceByJsonRPC(options.rpcUrl);
        const blockHashBase16 = '';
        const stateRootHash = await clientRpc.getStateRootHash(blockHashBase16);              

        let key = "attribute_";
        key += didUrl;
        if (options?.accept) {
            key += `_${options.accept}`;
        }

        const result = await clientRpc.getBlockState(stateRootHash, CONTRACT_DID_HASH, [key]);
        return result as any;
    }
}