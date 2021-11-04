import { DIDResolutionResult } from "@veramo/core";
import { Keys } from "casper-js-sdk";
import { DIDResolutionOptions, Resolver } from "did-resolver";
export interface CasperDidResolverOptions extends DIDResolutionOptions {
    rpcUrl: string;
    contractKey: Keys.AsymmetricKey;
    contract: string;
}
export declare class CasperDidResolver extends Resolver {
    private resolverOptions?;
    constructor(resolverOptions?: CasperDidResolverOptions);
    resolve(didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
    private resolvePublickKey;
    private getDefaultDiDDocument;
    private getTypeInfo;
    private buildKey;
    private readKey;
    private readDidDocument;
    private readDelegates;
    private readDeligateLength;
    private readAttributes;
    private readAttributesLength;
}
