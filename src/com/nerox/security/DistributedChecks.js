/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Distributed Security Checkpoints
 * WARNING: These checks are embedded throughout the application
 * Removing or bypassing any checkpoint will cause cascading failures
 */

import { createHash, randomBytes } from 'node:crypto';

// ══════════════════════════════════════════════════════════════════════════════
// CHECKPOINT STATE
// ══════════════════════════════════════════════════════════════════════════════

let _masterToken = null;
let _checkpointTokens = new Map();
let _failedCheckpoints = 0;
const _MAX_FAILURES = 3;

// ══════════════════════════════════════════════════════════════════════════════
// IMMEDIATE TERMINATION (Cannot be caught or prevented)
// ══════════════════════════════════════════════════════════════════════════════

const _instantKill = (reason, code) => {
    // Remove all listeners to prevent catching
    process.removeAllListeners('exit');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    
    // Log the breach
    console.error('\x1b[31m');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║           ⚠️  SECURITY BREACH DETECTED  ⚠️                    ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error(`║  Reason: ${reason.padEnd(51)}  ║`);
    console.error(`║  Code: ${code.padEnd(53)}  ║`);
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error('║  Application terminated for security reasons.                ║');
    console.error('║  Contact the developer if you believe this is an error.      ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('\x1b[0m');
    
    // Multiple termination methods for redundancy
    setImmediate(() => process.kill(process.pid, 'SIGKILL'));
    setTimeout(() => process.exit(1), 10);
    process.abort?.();
};

// ══════════════════════════════════════════════════════════════════════════════
// MASTER TOKEN MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export const initializeMasterToken = (authKeyHash) => {
    if (_masterToken) {
        _instantKill('Double initialization attempt', 'REINIT_BLOCKED');
        return null;
    }
    
    // Generate master token from auth key hash
    const salt = randomBytes(16).toString('hex');
    const combined = `${authKeyHash}:${salt}:${Date.now()}`;
    _masterToken = createHash('sha256').update(combined).digest('hex');
    
    return _masterToken;
};

// ══════════════════════════════════════════════════════════════════════════════
// CHECKPOINT CREATION
// ══════════════════════════════════════════════════════════════════════════════

export const createCheckpoint = (checkpointId) => {
    if (!_masterToken) {
        _instantKill('Security not initialized', 'NO_MASTER_TOKEN');
        return null;
    }
    
    const token = createHash('sha256')
        .update(`${_masterToken}:${checkpointId}`)
        .digest('hex')
        .substring(0, 32);
    
    _checkpointTokens.set(checkpointId, token);
    return token;
};

// ══════════════════════════════════════════════════════════════════════════════
// CHECKPOINT VERIFICATION
// ══════════════════════════════════════════════════════════════════════════════

export const verifyCheckpoint = (checkpointId) => {
    // No master token = not initialized
    if (!_masterToken) {
        _failedCheckpoints++;
        if (_failedCheckpoints >= _MAX_FAILURES) {
            _instantKill('Too many checkpoint failures', 'MAX_FAILURES');
        }
        return false;
    }
    
    // Check if checkpoint exists
    if (!_checkpointTokens.has(checkpointId)) {
        // Auto-create checkpoint if it doesn't exist (first call)
        createCheckpoint(checkpointId);
    }
    
    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// QUICK CHECK (For embedding in code paths)
// ══════════════════════════════════════════════════════════════════════════════

export const quickCheck = (id) => {
    if (!_masterToken) {
        _instantKill(`Security check failed: ${id}`, 'QUICK_CHECK_FAILED');
        return false;
    }
    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION CHECK (More thorough)
// ══════════════════════════════════════════════════════════════════════════════

export const validateSecurityState = () => {
    // Check master token
    if (!_masterToken || typeof _masterToken !== 'string' || _masterToken.length !== 64) {
        return false;
    }
    
    // Check failure count
    if (_failedCheckpoints >= _MAX_FAILURES) {
        return false;
    }
    
    return true;
};

// ══════════════════════════════════════════════════════════════════════════════
// TERMINATION TRIGGER (For critical failures)
// ══════════════════════════════════════════════════════════════════════════════

export const triggerSecurityLockout = (reason) => {
    _instantKill(reason, 'MANUAL_LOCKOUT');
};

// ══════════════════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════════════════

export const getSecurityState = () => {
    return {
        initialized: !!_masterToken,
        checkpoints: _checkpointTokens.size,
        failedChecks: _failedCheckpoints,
        maxFailures: _MAX_FAILURES
    };
};

export default {
    initializeMasterToken,
    createCheckpoint,
    verifyCheckpoint,
    quickCheck,
    validateSecurityState,
    triggerSecurityLockout,
    getSecurityState
};
