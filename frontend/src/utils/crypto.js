import CryptoJS from 'crypto-js';

// Derive a key using PBKDF2 for stronger encryption, or just use simple AES for MVP
// For this app, we'll use AES directly with the roomId acting as part of the secret 
// combined with a base secret. Since there's no auth, the secret is shared via the URL.
// Real E2EE would use DH key exchange, but CryptoJS AES with a shared secret is a good start for this concept.

export const generateSecretKey = () => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

export const encryptMessage = (message, secretKey) => {
  try {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
  } catch (error) {
    console.error("Encryption error", error);
    return null;
  }
};

export const decryptMessage = (ciphertext, secretKey) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption error", error);
    return null;
  }
};
