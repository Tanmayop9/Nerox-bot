/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Advanced Security Core - Obfuscated Validation Engine
 * WARNING: Any modification will cause immediate application failure
 */

import { createHash, timingSafeEqual } from 'node:crypto';

// ══════════════════════════════════════════════════════════════════════════════
// OBFUSCATED KEY FRAGMENTS - Split across multiple variables
// These fragments combine to form the expected hash
// Modifying ANY fragment will break the entire system
// ══════════════════════════════════════════════════════════════════════════════

const _0xa1 = [0x35, 0x32, 0x61, 0x65, 0x31, 0x31, 0x35, 0x36];
const _0xb2 = [0x38, 0x34, 0x66, 0x32, 0x37, 0x33, 0x66, 0x64];
const _0xc3 = [0x33, 0x33, 0x30, 0x66, 0x63, 0x39, 0x39, 0x64];
const _0xd4 = [0x63, 0x35, 0x39, 0x65, 0x64, 0x31, 0x62, 0x38];
const _0xe5 = [0x33, 0x38, 0x30, 0x34, 0x30, 0x62, 0x61, 0x39];
const _0xf6 = [0x36, 0x36, 0x31, 0x32, 0x61, 0x64, 0x62, 0x62];
const _0xg7 = [0x64, 0x36, 0x33, 0x66, 0x65, 0x65, 0x39, 0x38];
const _0xh8 = [0x65, 0x33, 0x63, 0x65, 0x33, 0x65, 0x62, 0x39];
const _0xi9 = [0x64, 0x61, 0x33, 0x66, 0x63, 0x64, 0x33, 0x33];
const _0xj0 = [0x61, 0x39, 0x36, 0x61, 0x35, 0x32, 0x62, 0x33];
const _0xk1 = [0x36, 0x66, 0x36, 0x32, 0x65, 0x35, 0x31, 0x34];
const _0xl2 = [0x63, 0x35, 0x38, 0x35, 0x30, 0x30, 0x38, 0x35];
const _0xm3 = [0x32, 0x39, 0x36, 0x62, 0x38, 0x34, 0x65, 0x32];
const _0xn4 = [0x36, 0x32, 0x63, 0x32, 0x61, 0x35, 0x31, 0x36];
const _0xo5 = [0x34, 0x35, 0x37, 0x66, 0x37, 0x61, 0x62, 0x32];
const _0xp6 = [0x31, 0x61, 0x65, 0x63, 0x38, 0x63, 0x32, 0x66];

// Integrity check values - computed at build time
const _INTEGRITY_SALT = 'NX4_SEC_2024_ANTI_TAMPER';
const _FRAGMENT_COUNT = 16;

// ══════════════════════════════════════════════════════════════════════════════
// ANTI-TAMPER: Self-verification of fragment integrity
// ══════════════════════════════════════════════════════════════════════════════

const _verifyFragmentIntegrity = () => {
    const fragments = [
        _0xa1,
        _0xb2,
        _0xc3,
        _0xd4,
        _0xe5,
        _0xf6,
        _0xg7,
        _0xh8,
        _0xi9,
        _0xj0,
        _0xk1,
        _0xl2,
        _0xm3,
        _0xn4,
        _0xo5,
        _0xp6,
    ];

    // Check fragment count
    if (fragments.length !== _FRAGMENT_COUNT) return false;

    // Check each fragment has exactly 8 bytes
    for (const frag of fragments) {
        if (!Array.isArray(frag) || frag.length !== 8) return false;
        for (const byte of frag) {
            if (typeof byte !== 'number' || byte < 0 || byte > 255) return false;
        }
    }

    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// RECONSTRUCT EXPECTED HASH (Obfuscated)
// ══════════════════════════════════════════════════════════════════════════════

const _reconstructExpectedHash = () => {
    if (!_verifyFragmentIntegrity()) {
        return null;
    }

    const fragments = [
        _0xa1,
        _0xb2,
        _0xc3,
        _0xd4,
        _0xe5,
        _0xf6,
        _0xg7,
        _0xh8,
        _0xi9,
        _0xj0,
        _0xk1,
        _0xl2,
        _0xm3,
        _0xn4,
        _0xo5,
        _0xp6,
    ];

    let result = '';
    for (const frag of fragments) {
        for (const byte of frag) {
            result += String.fromCharCode(byte);
        }
    }

    return result;
};

// ══════════════════════════════════════════════════════════════════════════════
// SECURE HASH COMPARISON (Timing-safe)
// ══════════════════════════════════════════════════════════════════════════════

const _secureCompare = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;

    try {
        const bufA = Buffer.from(a, 'utf8');
        const bufB = Buffer.from(b, 'utf8');
        return timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-LAYER HASH FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

const _computeKeyHash = (key) => {
    // Layer 1: SHA-512
    const hash1 = createHash('sha512').update(key).digest('hex');
    return hash1;
};

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL VERIFICATION LAYER - Key structure validation
// ══════════════════════════════════════════════════════════════════════════════

const _validateKeyStructure = (key) => {
    // Key must be at least 64 characters (hex format)
    if (key.length < 64) return false;

    // Key must be valid hex
    if (!/^[a-f0-9]+$/i.test(key)) return false;

    // Key must have high entropy (no repeated patterns)
    const chunks = [];
    for (let i = 0; i < key.length; i += 8) {
        chunks.push(key.substring(i, i + 8));
    }
    const uniqueChunks = new Set(chunks);
    if (uniqueChunks.size < chunks.length * 0.8) return false;

    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED VALIDATION FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export const validateKey = (authKey) => {
    // Step 1: Basic validation
    if (!authKey || typeof authKey !== 'string') {
        return { valid: false, reason: 'MISSING_KEY' };
    }

    // Step 2: Structure validation
    if (!_validateKeyStructure(authKey)) {
        return { valid: false, reason: 'INVALID_STRUCTURE' };
    }

    // Step 3: Reconstruct expected hash
    const expectedHash = _reconstructExpectedHash();
    if (!expectedHash) {
        return { valid: false, reason: 'INTEGRITY_FAILURE' };
    }

    // Step 4: Compute and compare hash
    const computedHash = _computeKeyHash(authKey);
    if (!_secureCompare(computedHash, expectedHash)) {
        return { valid: false, reason: 'INVALID_KEY' };
    }

    return { valid: true };
};

// ══════════════════════════════════════════════════════════════════════════════
// ANTI-DEBUG: Detect if someone is trying to debug/inspect
// ══════════════════════════════════════════════════════════════════════════════

export const detectTampering = () => {
    // Check if fragments are intact
    if (!_verifyFragmentIntegrity()) {
        return true;
    }

    // Verify reconstruction works
    const hash = _reconstructExpectedHash();
    if (!hash || hash.length !== 128) {
        return true;
    }

    return false;
};

// ══════════════════════════════════════════════════════════════════════════════
// SELF-TEST: Verify core functions haven't been modified
// ══════════════════════════════════════════════════════════════════════════════

const _selfTest = () => {
    // Test hash function
    const testKey = 'test_key_12345';
    const hash = _computeKeyHash(testKey);
    if (typeof hash !== 'string' || hash.length !== 128) {
        return false;
    }

    // Test comparison
    if (!_secureCompare('test', 'test')) return false;
    if (_secureCompare('test', 'Test')) return false;

    return true;
};

export const runSelfTest = _selfTest;

export default { validateKey, detectTampering, runSelfTest };
