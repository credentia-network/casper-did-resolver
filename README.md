# DID Resolver for the Casper DID method

This project implements Casper DID Resolver plugin for [Veramo](https://veramo.io/)

Resolver is designed according to the [Casper DID Method Specification](https://github.com/credentia-network/Docs/blob/main/readme/casper-did-method-spec.md)

Initial project structure is derived from [Veramo did-resolver](https://github.com/uport-project/veramo/tree/next/packages/did-resolver)

The method implementation is partially derived from [Ethr DID Resolver](https://github.com/decentralized-identity/ethr-did-resolver)

## How to use
Install all dependencies, such as: Veramo and Casper by adding them to package.json:
```json
  "dependencies": {
    ...................
    "casper-did-provider": "git+https://github.com//credentia-network/casper-did-provider.git",
    "casper-did-resolver": "git+https://github.com/credentia-network/casper-did-resolver.git",
    "casper-js-sdk": "1.4.3",
    ...................
  },
```

For Veramo basics please follow the documentation and samples [here](https://veramo.io/docs/basics/introduction)

Create  Veramo agent manager:
```ts
const PUBLIC_KEY = Keys.Ed25519.readBase64WithPEM('MCowBQYDK2VwAyEANUSxkqzpKbbhYVMo0bP3nVe+gen4jFp06Ki5u6cIATk=');
const PRIVATE_KEY = Keys.Ed25519.readBase64WithPEM('MC4CAQAwBQYDK2VwBCIEIAdjynMSLimFalVdB51TI6wGlwQKaI8PwdsG55t2qMZM');
const RPC_URL = '<CASPER_NODE_RPC_URL>';
const CONTRACT_DID_HASH = "<DID_CONTRACT_HASH_HERE>";

const agent = core.createAgent({
    plugins: [
        new did_resolver.DIDResolverPlugin({
            resolver: new identifier_resolver.CasperDidResolver({
                contract: CONTRACT_DID_HASH,
                rpcUrl: RPC_URL
            }),
        }),
    ],
});
```

In order to resove DID please use following code:

```ts
const key: string = 'your_did_key_hash';
agent.resolveDid({didUrl: key});
```

To get hash as HEX string use following example:

```ts
const didHash = Buffer.from(identityKey.accountHash()).toString('hex');
```

Casper public blockchain nodes RPC can be found here:
 - For Testnet: [https://testnet.cspr.live/tools/peers](https://testnet.cspr.live/tools/peers)
 - For Mainnet: [https://cspr.live/tools/peers](https://cspr.live/tools/peers)
