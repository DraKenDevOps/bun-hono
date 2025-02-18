import crypto from "crypto";
import env from "../env";

const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY || "");
const algorithm = "aes-256-cbc";
const encode = "hex" as BufferEncoding;

export function encryptText(text: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    let encrypt = cipher.update(text);
    encrypt = Buffer.concat([encrypt, cipher.final()]);
    return `${iv.toString(encode)}:${encrypt.toString(encode)}`;
}

export function decryptText(text: string) {
    const _iv = text.split(":").shift();
    const _encrypted = text.split(":").pop();
    if (_iv && _encrypted) {
        const iv = Buffer.from(_iv, encode);
        const pw = Buffer.from(_encrypted, encode);
        const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
        let decrypt = decipher.update(pw);
        decrypt = Buffer.concat([decrypt, decipher.final()]);
        return decrypt.toString();
    } else {
        return "";
    }
}

export function qrEncrypt(text: string) {
    const buffer = Buffer.from(text);
    try {
        const encrypted = crypto.privateEncrypt(env.QR_PRIVATE_KEY, buffer);
        return encrypted.toString("base64");
    } catch (error) {
        console.error("QR encrypt error", { error });
        return "";
    }
}

export function qrDecrypt(encrypted: string) {
    let plain = ""
    try {
        const buffer = Buffer.from(encrypted, "base64");
        const decrypted = crypto.publicDecrypt(env.QR_PUBLIC_KEY, buffer);
        plain = decrypted.toString();
    } catch (error) {
        console.error("QR decrypt error", { error });
    }
    return plain;
}
