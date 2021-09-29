# casper-did-resolver
Veramo plugin - Casper DID Resolver

## Build
```
npm run build
```

## Test

```
npm run test
```

## How to use

Install all dependencies, such as: Veramo and Casper.

Create  Veramo agent manager:

```
const agent = core.createAgent({
    plugins: [
        new did_resolver.DIDResolverPlugin({
            resolver: new identifier_resolver.CasperDidResolver({
                contract: 'CasperDIDRegistry9',
                contractKey,
                rpcUrl: 'http://144.76.97.151:7777/rpc'
            }),
        }),
    ],
});
```

To resove key use following code:

```
const key: string = 'you_key_name';
agent.resolveDid({didUrl: key});
```