import eccrypto from 'eccrypto';
import { randomBytes } from 'node:crypto';

console.log('-----------------------------------')

// Example: user's private key to encrypt (e.g., for wallet)
const pk = 'a5351e10b5d4de93119ebbc2fd8c27635bc9dda982433bf86e92e3b5109d7ebc'
const secretMessage = Buffer.from(pk, "utf8");
console.log({ secretMessage, pk })

// Step 1: Generate EC key pair (in real usage, the public key belongs to YOU — the server)
const privateKey = randomBytes(32); // your server's private key
const publicKey = eccrypto.getPublic(privateKey); // to share with client/user

// Step 2: Encrypt secret with public key
async function encryptMessage(publicKey: Buffer, message: Buffer) {
  const encrypted = await eccrypto.encrypt(publicKey, message);
  return encrypted;
}

// Step 3: Decrypt with private key
async function decryptMessage(privateKey: Buffer, encrypted: eccrypto.Ecies) {
  const decrypted = await eccrypto.decrypt(privateKey, encrypted);
  return decrypted.toString("utf8");
}


// Step 4: Testing
(async () => {
  console.log("Encrypting message...");
  const encrypted = await encryptMessage(publicKey, secretMessage);
  console.log({ encrypted })
  console.log('-----------------------------------')

  console.log("Encrypted:", {
    iv: encrypted.iv.toString("hex"),
    ephemPublicKey: encrypted.ephemPublicKey.toString("hex"),
    ciphertext: encrypted.ciphertext.toString("hex"),
    mac: encrypted.mac.toString("hex"),
  });

  const decrypted = await decryptMessage(privateKey, encrypted);
  console.log("✅ Decrypted:", decrypted);
})();
