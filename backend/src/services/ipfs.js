import pinataSDK from '@pinata/sdk';

let client;

function getClient() {
  if (client) return client;
  const key = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_SECRET_API_KEY;
  client = new pinataSDK({ pinataApiKey: key, pinataSecretApiKey: secret });
  return client;
}

export async function pinJSON(name, json) {
  try {
    const key = process.env.PINATA_API_KEY;
    const secret = process.env.PINATA_SECRET_API_KEY;
    
    if (!key || !secret) {
      console.warn('⚠️ IPFS not configured. Skipping IPFS pinning.');
      return { cid: null, url: null };
    }
    
    const res = await getClient().pinJSONToIPFS(json, { pinataMetadata: { name } });
    return { cid: res.IpfsHash, url: `https://gateway.pinata.cloud/ipfs/${res.IpfsHash}` };
  } catch (error) {
    console.error('❌ IPFS pinning failed:', error.message);
    return { cid: null, url: null };
  }
}




