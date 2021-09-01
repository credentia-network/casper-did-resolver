const identifier_resolver = require("./../lib");
const core = require("@veramo/core");
const did_resolver = require("@veramo/did-resolver");
const casper_js_sdk = require("casper-js-sdk");

const contractKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/ippolit/IppolitWallet_public_key.pem',
    './network_keys/ippolit/IppolitWallet_secret_key.pem'
);

const identityKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/ippolit/IppolitWallet_public_key.pem',
    './network_keys/ippolit/IppolitWallet_secret_key.pem'
);

const agent = core.createAgent({
    plugins: [
        new did_resolver.DIDResolverPlugin({
            resolver: new identifier_resolver.CasperDidResolver({
                contract: 'CasperDIDRegistry9',
                contractKey,
                identityKey,
                rpcUrl: 'http://164.90.198.193:7777/rpc'
            }),
        }),
    ],
});

agent.resolveDid({
    didUrl: "asd"
}).then(result => console.log(result));