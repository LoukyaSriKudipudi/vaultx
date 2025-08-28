require("dotenv").config();
const crypto = require("crypto");

const CRYPTO_SECRET = process.env.CRYPTO_SECRET;
if (!CRYPTO_SECRET) throw new Error("CRYPTO_SECRET missing in .env");

// fixed sizes
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const VERSION_LENGTH = 1;

// derive 32-byte key from secret + salt
function getKey(salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(CRYPTO_SECRET, salt, 32, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// encrypt text
async function encryptValue(value) {
  if (typeof value !== "string") throw new Error("Value must be a string");

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await getKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();
  const version = Buffer.from([1]);

  // combine everything: version + salt + iv + authTag + ciphertext
  const packageBuffer = Buffer.concat([
    version,
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return packageBuffer.toString("base64");
}

// decrypt text
async function decryptValue(encryptedValue) {
  if (!encryptedValue) return null;

  try {
    const buffer = Buffer.from(encryptedValue, "base64");

    const version = buffer.readUInt8(0);
    if (version !== 1) throw new Error("Unsupported version");

    const salt = buffer.subarray(1, 1 + SALT_LENGTH);
    const iv = buffer.subarray(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      1 + SALT_LENGTH + IV_LENGTH,
      1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = buffer.subarray(
      1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );

    const key = await getKey(salt);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return null;
  }
}

module.exports = { encryptValue, decryptValue };
