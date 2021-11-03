import { DIDResolutionResult } from "@veramo/core";
import { CasperServiceByJsonRPC, decodeBase16, Keys } from "casper-js-sdk";
import { DIDDocument, DIDResolutionOptions, Resolver } from "did-resolver";

const VALUE_NOT_FOUNT_ERROR_CODE = -32003;

export interface CasperDidResolverOptions extends DIDResolutionOptions {
    rpcUrl: string;
    contractKey: Keys.AsymmetricKey;
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
        const contractDIDHash = options.contract;
        const blockHashBase16 = '';
        const stateRootHash = await clientRpc.getStateRootHash(blockHashBase16);

        const didDocument = await this.readDidDocument(didUrl, clientRpc, contractDIDHash, stateRootHash);
        await this.readDelegates(didDocument, didUrl, clientRpc, contractDIDHash, stateRootHash);
        await this.readAttributes(didDocument, didUrl, clientRpc, contractDIDHash, stateRootHash);

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

    private buildKey(didUrl: string, suffix?: string) {
        const key = Keys.Ed25519.accountHash(decodeBase16(didUrl));
        return `${Buffer.from(key).toString('hex')}${suffix || ''}`;
    }

    private async readKey<T>(key: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string): Promise<T> {
        let result = await clientRpc.getBlockState(stateRootHash, contractDIDHash, [key]);
        return result?.CLValue?.data;
    }

    private async readDidDocument(didUrl: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string): Promise<any> {
        try {
            const key = this.buildKey(didUrl);
            return await this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
        } catch (e: any) {
            if (e.code = VALUE_NOT_FOUNT_ERROR_CODE) {
                //console.warn(e);
                return this.getDefaultDiDDocument(didUrl);
            } else {
                throw e;
            }
        }
    }

    private async readDelegates(didDocument: any, didUrl: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string) {
        const deletagesLength = await this.readDeligateLength(didUrl, clientRpc, contractDIDHash, stateRootHash);

        if (deletagesLength) {
            const arr = new Array(deletagesLength).fill(0).map((_, i) => i);
            const nowTimestamp = new Date().valueOf();
            for (const index of arr) {
                const key = this.buildKey(didUrl, `_delegate_${index}`);
                const result = await this.readKey<any[]>(key, clientRpc, contractDIDHash, stateRootHash);

                const [name, value, expirationTimestamp] = result.map(t => t.data.toString());
                if (+expirationTimestamp > nowTimestamp) {
                    const id = `${didUrl}#delegate-${index}`
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
    }

    private async readDeligateLength(didUrl: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string): Promise<number> {
        const key = this.buildKey(didUrl, '_delegateLength');
        try {
            let result = await this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
            return +result || 0;
        } catch (e) {
            console.log(e);
            return 0;
        }
    }

    private async readAttributes(didDocument: any, didUrl: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string) {
        const attributesLength = await this.readAttributesLength(didUrl, clientRpc, contractDIDHash, stateRootHash);

        if (attributesLength) {
            const arr = new Array(attributesLength).fill(0).map((_, i) => i);
            const nowTimestamp = new Date().valueOf();
            for (const index of arr) {
                const key = this.buildKey(didUrl, `_attribute_${index}`);
                const result = await this.readKey<any[]>(key, clientRpc, contractDIDHash, stateRootHash);

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
                    } else if (name.startsWith('did/pub/')) {
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
    }

    private async readAttributesLength(didUrl: string, clientRpc: CasperServiceByJsonRPC, contractDIDHash: string, stateRootHash: string) {
        const key = this.buildKey(didUrl, '_attributeLength');
        try {
            let result = await this.readKey(key, clientRpc, contractDIDHash, stateRootHash);
            return +result || 0;
        } catch (e) {
            console.log(e);
            return 0;
        }
    }
}