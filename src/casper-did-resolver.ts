import { DIDResolutionResult } from "@veramo/core";
import { CasperServiceByJsonRPC } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { DIDDocument, DIDResolutionOptions, Resolver } from "did-resolver";

const CONTRACT_DID_HASH = "hash-7ac5a7bd9b9e7370085c60429969f512cdad2e74e9728af23afe20fdaf0c67a9";

const VALUE_NOT_FOUNT_ERROR_CODE = -32003;

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

        try {
            const result = await clientRpc.getBlockState(stateRootHash, CONTRACT_DID_HASH, [key]);
            return result as any;
        } catch (e: any) {
            if (e.code = VALUE_NOT_FOUNT_ERROR_CODE) {
                const didDocument = this.getDefaultDiDDocument(didUrl);
                return {
                    didResolutionMetadata: { error: 'notFound'},
                    didDocument,
                    didDocumentMetadata: {}
                };
            }
            console.error(e);
        }
    }

    private getDefaultDiDDocument(did: string): DIDDocument {
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

    private getDidPublickKey(did: string): string {
        const data = did.split(':');
        return data[data.length - 1];
    }

    private getType(did: string): string {
        const publickKey = this.getDidPublickKey(did);
        const code = +publickKey.substr(publickKey.startsWith('0x') ? 2 : 0, 2);
        if (code == 2) {
            return 'Ed25519VerificationKey2020';
        }

        return 'EcdsaSecp256k1RecoveryMethod2020';
    }
}