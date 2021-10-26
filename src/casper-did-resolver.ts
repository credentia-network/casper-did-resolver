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

        let didDocument = null;
        try {
            didDocument = await clientRpc.getBlockState(stateRootHash, CONTRACT_DID_HASH, [didUrl]);
        } catch (e: any) {
            if (e.code = VALUE_NOT_FOUNT_ERROR_CODE) {
                didDocument = this.getDefaultDiDDocument(didUrl);
            } else {
                throw e;
            }
        }

        return {
            didResolutionMetadata: { contentType: 'application/did+ld+json' },
            didDocument,
            didDocumentMetadata: {}
        };
    }

    private getDefaultDiDDocument(did: string): DIDDocument {
        const publickKey = this.getDidPublickKey(did);
        const typeCfg = this.getTypeInfo(did);

        return {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                typeCfg.url,
            ],
            id: did,
            verificationMethod: [
                {
                    id: `${did}#controller`,
                    type: typeCfg.type,
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

    private getTypeInfo(did: string) {
        const publickKey = this.getDidPublickKey(did);
        const code = +publickKey.substr(publickKey.startsWith('0x') ? 2 : 0, 2);
        if (code == 2) {
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
}