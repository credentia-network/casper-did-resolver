const { CasperServiceByJsonRPC, Keys, decodeBase16 } = require("casper-js-sdk");

(async function () {
    const clientRpc = new CasperServiceByJsonRPC('http://159.65.118.250:7777/rpc');
    const stateRootHash = await clientRpc.getStateRootHash('');

    const didHashHex = '01706798f37e5e10ba90fcfa0ac81e2564a8d3f78edacbe84050c20e520891f70a';

    const key = Keys.Ed25519.accountHash(decodeBase16('706798f37e5e10ba90fcfa0ac81e2564a8d3f78edacbe84050c20e520891f70a'));

    // const key = Keys.Ed25519.accountHex(new Uint8Array(Buffer.from(didHashHex, 'hex')));
    // console.log(key);
    console.log(Buffer.from(key).toString('hex'));
})();