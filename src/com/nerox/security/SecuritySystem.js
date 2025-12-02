/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Advanced Security System - Main Controller
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ⚠️  SECURITY NOTICE  ⚠️                                    ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  This security system implements multiple layers of protection:              ║
 * ║                                                                              ║
 * ║  1. AUTH_KEY Validation - Key is verified against obfuscated hash           ║
 * ║  2. File Integrity Monitoring - Detects code modifications at runtime       ║
 * ║  3. Distributed Checkpoints - Multiple validation points across codebase    ║
 * ║  4. Anti-Tamper Protection - Self-healing and crash-on-tamper               ║
 * ║  5. Continuous Monitoring - Background integrity verification               ║
 * ║                                                                              ║
 * ║  Any attempt to bypass, modify, or remove security will instantly           ║
 * ║  terminate the application with no possibility of recovery.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Security modules
import { validateKey, detectTampering, runSelfTest } from './SecurityCore.js';
import { initializeIntegrityMonitor, verifyIntegrity, startContinuousMonitoring } from './IntegrityMonitor.js';
import { initializeMasterToken, quickCheck, triggerSecurityLockout, getSecurityState } from './DistributedChecks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL STATE
// ══════════════════════════════════════════════════════════════════════════════

let _initialized = false;
let _initTime = null;
let _authKeyHash = null;

// ══════════════════════════════════════════════════════════════════════════════
// TERMINATION (Multiple methods for redundancy)
// ══════════════════════════════════════════════════════════════════════════════

const _terminate = (reason) => {
    process.removeAllListeners();

    console.error('\n\x1b[31m');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║           🔒 SECURITY SYSTEM - ACCESS DENIED 🔒              ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error(`║ ${reason.padEnd(60)} ║`);
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error('║ The application cannot start without valid authorization.    ║');
    console.error('║ Please ensure AUTH_KEY is correctly set in your .env file.   ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('\x1b[0m\n');

    setImmediate(() => process.kill(process.pid, 'SIGKILL'));
    setTimeout(() => process.exit(1), 50);
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

export const initializeSecurity = async (options = {}) => {
    // Prevent double initialization
    if (_initialized) {
        console.log('\x1b[33m[Security] Already initialized\x1b[0m');
        return { success: true };
    }

    const {
        projectRoot = resolve(__dirname, '../../../../..'),
        enableMonitoring = true,
        monitorInterval = 30000,
    } = options;

    console.log('\n\x1b[36m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║             NEROX SECURITY SYSTEM v4.0.0                     ║\x1b[0m');
    console.log('\x1b[36m╠══════════════════════════════════════════════════════════════╣\x1b[0m');
    console.log('\x1b[36m║  Initializing multi-layer protection system...              ║\x1b[0m');
    console.log('\x1b[36m╚══════════════════════════════════════════════════════════════╝\x1b[0m\n');

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 1: Self-test core functions
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\x1b[33m[Security]\x1b[0m Running self-diagnostics...');
    if (!runSelfTest()) {
        _terminate('Self-test failed - security core compromised');
        return { success: false };
    }
    console.log('\x1b[32m[Security]\x1b[0m Self-diagnostics passed ✓');

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 2: Check for tampering in security modules
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\x1b[33m[Security]\x1b[0m Checking security module integrity...');
    if (detectTampering()) {
        _terminate('Security module tampering detected');
        return { success: false };
    }
    console.log('\x1b[32m[Security]\x1b[0m Security modules intact ✓');

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 3: Validate AUTH_KEY
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\x1b[33m[Security]\x1b[0m Validating AUTH_KEY...');

    const authKey = process.env.AUTH_KEY;
    if (!authKey) {
        _terminate('AUTH_KEY not found in environment variables');
        return { success: false };
    }

    const validationResult = validateKey(authKey);
    if (!validationResult.valid) {
        const reasonMap = {
            MISSING_KEY: 'AUTH_KEY is missing',
            INVALID_STRUCTURE: 'AUTH_KEY has invalid format',
            INTEGRITY_FAILURE: 'Security system integrity compromised',
            INVALID_KEY: 'AUTH_KEY is invalid or unauthorized',
        };
        _terminate(reasonMap[validationResult.reason] || 'AUTH_KEY validation failed');
        return { success: false };
    }

    // Store hash for later verification
    _authKeyHash = createHash('sha512').update(authKey).digest('hex');
    console.log('\x1b[32m[Security]\x1b[0m AUTH_KEY validated successfully ✓');

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 4: Initialize distributed checkpoints
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\x1b[33m[Security]\x1b[0m Initializing distributed checkpoints...');
    const masterToken = initializeMasterToken(_authKeyHash);
    if (!masterToken) {
        _terminate('Failed to initialize security checkpoints');
        return { success: false };
    }
    console.log('\x1b[32m[Security]\x1b[0m Distributed checkpoints active ✓');

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 5: Initialize file integrity monitoring
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\x1b[33m[Security]\x1b[0m Initializing integrity monitor...');
    if (!initializeIntegrityMonitor(projectRoot)) {
        console.log('\x1b[33m[Security]\x1b[0m Warning: Limited file monitoring');
    } else {
        console.log('\x1b[32m[Security]\x1b[0m File integrity monitor active ✓');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STEP 6: Start continuous monitoring
    // ══════════════════════════════════════════════════════════════════════════
    if (enableMonitoring) {
        console.log('\x1b[33m[Security]\x1b[0m Starting continuous monitoring...');
        startContinuousMonitoring(monitorInterval, (result) => {
            triggerSecurityLockout(`File tampering detected: ${result.file}`);
        });
        console.log('\x1b[32m[Security]\x1b[0m Continuous monitoring enabled ✓');
    }

    // Mark as initialized
    _initialized = true;
    _initTime = Date.now();

    console.log('\n\x1b[32m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[32m║          🔒 SECURITY SYSTEM ACTIVATED SUCCESSFULLY 🔒         ║\x1b[0m');
    console.log('\x1b[32m╚══════════════════════════════════════════════════════════════╝\x1b[0m\n');

    return { success: true };
};

// ══════════════════════════════════════════════════════════════════════════════
// DISTRIBUTED SECURITY CHECK
// Call this at various points in your code for additional protection
// ══════════════════════════════════════════════════════════════════════════════

export const distributedCheck = (checkId) => {
    if (!_initialized) {
        triggerSecurityLockout(`Security check before initialization: ${checkId}`);
        return false;
    }

    return quickCheck(checkId);
};

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY CHECKPOINT
// More thorough check - use at critical code paths
// ══════════════════════════════════════════════════════════════════════════════

export const securityCheckpoint = () => {
    if (!_initialized) {
        triggerSecurityLockout('Checkpoint called before initialization');
        return false;
    }

    // Verify current state
    const state = getSecurityState();
    if (!state.initialized) {
        triggerSecurityLockout('Security state corrupted');
        return false;
    }

    // Verify integrity
    const integrity = verifyIntegrity();
    if (!integrity.valid) {
        triggerSecurityLockout(`Integrity check failed: ${integrity.reason}`);
        return false;
    }

    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// GET SECURITY STATUS
// ══════════════════════════════════════════════════════════════════════════════

export const getSecurityStatus = () => {
    return {
        initialized: _initialized,
        uptime: _initTime ? Date.now() - _initTime : 0,
        ...getSecurityState(),
    };
};

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY: Generate hash for new AUTH_KEY
// Use this to generate the obfuscated hash fragments
// ══════════════════════════════════════════════════════════════════════════════

export const generateKeyHash = (key) => {
    const hash = createHash('sha512').update(key).digest('hex');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('AUTH_KEY Hash Generator for SecurityCore.js');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Your AUTH_KEY hash:');
    console.log(hash);
    console.log('\n--- Copy the fragments below into SecurityCore.js ---\n');

    // Split into 16 fragments of 8 characters each
    for (let i = 0; i < 16; i++) {
        const chunk = hash.substring(i * 8, (i + 1) * 8);
        const bytes = [];
        for (const char of chunk) {
            bytes.push(`0x${char.charCodeAt(0).toString(16)}`);
        }
        const varName = String.fromCharCode(97 + Math.floor(i / 10)) + ((i % 10) + 1);
        console.log(`const _0x${varName} = [${bytes.join(', ')}];`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    return hash;
};

export default {
    initializeSecurity,
    distributedCheck,
    securityCheckpoint,
    getSecurityStatus,
    generateKeyHash,
};
