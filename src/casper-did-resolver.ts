import { DIDResolutionResult } from "@veramo/core";
import { CasperServiceByJsonRPC } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { DIDResolutionOptions, Resolver } from "did-resolver";

export interface CasperDidResolverOptions extends DIDResolutionOptions {
    identityKey: AsymmetricKey;
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
        const contractHash = await this.getAccountNamedKeyValue(clientRpc, stateRootHash, options.contractKey, options.contract);
        if (!contractHash) {
            throw new Error(`Key '${options.contract}' couldn't be found.`);
        }

        let key = "attribute_";
        key += Buffer.from(options.contractKey.accountHash()).toString('hex');
        key += "_";
        key += didUrl;

        const result = await clientRpc.getBlockState(stateRootHash, contractHash, [key]);
        return result as any;
    }

    private async getAccountInfo(client: CasperServiceByJsonRPC, stateRootHash: string, keyPair: AsymmetricKey) {
        const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
        const storedValue = await client.getBlockState(
            stateRootHash,
            `account-hash-${accountHash}`,
            []
        )
        return storedValue.Account;
    };

    private async getAccountNamedKeyValue(client: CasperServiceByJsonRPC, stateRootHash: string, keyPair: AsymmetricKey, namedKey: string) {
        const accountInfo = await this.getAccountInfo(client, stateRootHash, keyPair);
        if (!accountInfo) {
            throw new Error('IdentifierProvider.getAccountInfo returned an undefined result.');
        }
        const res = accountInfo.namedKeys.find(i => i.name === namedKey);
        return res!.key;
    }
}