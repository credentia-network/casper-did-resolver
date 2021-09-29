import { DIDResolutionResult } from "@veramo/core";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { DIDResolutionOptions, Resolver } from "did-resolver";
export interface CasperDidResolverOptions extends DIDResolutionOptions {
    rpcUrl: string;
    contractKey: AsymmetricKey;
    contract: string;
}
export declare class CasperDidResolver extends Resolver {
    private resolverOptions?;
    constructor(resolverOptions?: CasperDidResolverOptions);
    resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
    private getAccountInfo;
    private getAccountNamedKeyValue;
}
