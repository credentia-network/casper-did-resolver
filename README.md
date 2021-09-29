# casper-did-resolver
Veramo plugin - Casper DID Resolver
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

Create  Veramo agent manager:
```ts
const PUBLIC_KEY = Keys.Ed25519.readBase64WithPEM('MCowBQYDK2VwAyEANUSxkqzpKbbhYVMo0bP3nVe+gen4jFp06Ki5u6cIATk=');
const PRIVATE_KEY = Keys.Ed25519.readBase64WithPEM('MC4CAQAwBQYDK2VwBCIEIAdjynMSLimFalVdB51TI6wGlwQKaI8PwdsG55t2qMZM');
const RPC_URL = '<CASPER_NODE_RPC_URL>';
const CONTRACT = 'CasperDIDRegistry9';

const contractKey = Keys.Ed25519.parseKeyPair(PUBLIC_KEY, PRIVATE_KEY);
const identityKey = Keys.Ed25519.parseKeyPair(PUBLIC_KEY, PRIVATE_KEY);

const agent = core.createAgent({
    plugins: [
        new did_resolver.DIDResolverPlugin({
            resolver: new identifier_resolver.CasperDidResolver({
                contract: 'CONTRACT',
                contractKey,
                rpcUrl: RPC_URL
            }),
        }),
    ],
});
```

To resove key use following code:

```ts
const key: string = 'you_key_name';
agent.resolveDid({didUrl: key});
```

Casper public blockchain nodes RPC can be found here:
 - For Testnet: [https://testnet.cspr.live/tools/peers](https://testnet.cspr.live/tools/peers)
 - For Mainnet: [https://cspr.live/tools/peers](https://cspr.live/tools/peers)