const identifier_resolver = require("./../lib");
const core = require("@veramo/core");
const did_resolver = require("@veramo/did-resolver");

const agent = core.createAgent({
    plugins: [
        new did_resolver.DIDResolverPlugin({
            resolver: new identifier_resolver.CasperDidResolver({
                contract: 'CasperDIDRegistry9',
                rpcUrl: 'http://159.65.118.250:7777/rpc'
            }),
        }),
    ],
});

// const didHashHex = '7ac5a7bd9b9e7370085c60429969f512cdad2e74e9728af23afe20fdaf0c67a9';
const didHashHex = 'did:casper:casper-test:013112068231a00e12e79b477888ae1f3b2dca40d6e2de17de4174534bc3a5143b';

agent.resolveDid({
    didUrl: didHashHex,
    options: { accept: 'some_attribute_type'} // Optional
}).then(result => console.log(JSON.stringify(result)));