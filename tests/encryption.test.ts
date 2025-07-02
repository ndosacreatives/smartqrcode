// @ts-nocheck

const key = '12345678901234567890123456789012'; // 32 chars
process.env.CREDENTIALS_ENCRYPTION_KEY = key;

const { encrypt, decrypt } = require('@/lib/encryption');

describe('Encryption helper', () => {
  it('round-trips a string', () => {
    const plaintext = 'Hello, world!';
    const cipher = encrypt(plaintext);
    expect(cipher).not.toEqual(plaintext);
    const decrypted = decrypt(cipher);
    expect(decrypted).toEqual(plaintext);
  });

  it('produces unique ciphertexts for same input', () => {
    const text = 'sample';
    const a = encrypt(text);
    const b = encrypt(text);
    expect(a).not.toEqual(b);
    expect(decrypt(a)).toEqual(text);
    expect(decrypt(b)).toEqual(text);
  });

  it('throws on invalid ciphertext', () => {
    expect(() => decrypt('invalid')).toThrow();
  });
});