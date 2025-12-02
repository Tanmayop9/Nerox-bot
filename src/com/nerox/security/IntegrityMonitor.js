/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Runtime Integrity Monitor with Anti-Tamper Detection
 * WARNING: Modification will trigger security lockout
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ══════════════════════════════════════════════════════════════════════════════
// RUNTIME STATE
// ══════════════════════════════════════════════════════════════════════════════

let _fileHashes = new Map();
let _lastCheck = 0;
let _checkCount = 0;
let _initialized = false;

// ══════════════════════════════════════════════════════════════════════════════
// FILE HASHING
// ══════════════════════════════════════════════════════════════════════════════

const _hashFile = (filePath) => {
    try {
        const content = readFileSync(filePath, 'utf8');
        return createHash('sha256').update(content).digest('hex');
    } catch {
        return null;
    }
};

const _getSecurityFiles = (securityDir) => {
    const files = [];
    try {
        if (!existsSync(securityDir)) return files;
        
        const items = readdirSync(securityDir);
        for (const item of items) {
            if (item.endsWith('.js')) {
                files.push(join(securityDir, item));
            }
        }
    } catch {
        // Ignore
    }
    return files;
};

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

export const initializeIntegrityMonitor = (projectRoot) => {
    if (_initialized) return true;
    
    const securityDir = resolve(projectRoot, 'src/com/nerox/security');
    const bootstrapDir = resolve(projectRoot, 'src/com/nerox/core/bootstrap');
    
    // Hash all security files
    const securityFiles = _getSecurityFiles(securityDir);
    for (const file of securityFiles) {
        const hash = _hashFile(file);
        if (hash) {
            _fileHashes.set(file, hash);
        }
    }
    
    // Hash bootstrap files
    const bootstrapFiles = _getSecurityFiles(bootstrapDir);
    for (const file of bootstrapFiles) {
        const hash = _hashFile(file);
        if (hash) {
            _fileHashes.set(file, hash);
        }
    }
    
    _lastCheck = Date.now();
    _initialized = true;
    
    return _fileHashes.size > 0;
};

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRITY VERIFICATION
// ══════════════════════════════════════════════════════════════════════════════

export const verifyIntegrity = () => {
    if (!_initialized) {
        return { valid: false, reason: 'NOT_INITIALIZED' };
    }
    
    _checkCount++;
    
    for (const [file, expectedHash] of _fileHashes) {
        const currentHash = _hashFile(file);
        
        if (!currentHash) {
            return { valid: false, reason: 'FILE_MISSING', file };
        }
        
        if (currentHash !== expectedHash) {
            return { valid: false, reason: 'FILE_MODIFIED', file };
        }
    }
    
    _lastCheck = Date.now();
    return { valid: true };
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTINUOUS MONITORING
// ══════════════════════════════════════════════════════════════════════════════

let _monitorInterval = null;
let _onTamperCallback = null;

export const startContinuousMonitoring = (intervalMs = 30000, onTamper = null) => {
    if (_monitorInterval) {
        clearInterval(_monitorInterval);
    }
    
    _onTamperCallback = onTamper;
    
    _monitorInterval = setInterval(() => {
        const result = verifyIntegrity();
        if (!result.valid && _onTamperCallback) {
            _onTamperCallback(result);
        }
    }, intervalMs);
    
    // Don't prevent process exit
    _monitorInterval.unref();
    
    return true;
};

export const stopMonitoring = () => {
    if (_monitorInterval) {
        clearInterval(_monitorInterval);
        _monitorInterval = null;
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════════════════

export const getMonitorStatus = () => {
    return {
        initialized: _initialized,
        filesMonitored: _fileHashes.size,
        checkCount: _checkCount,
        lastCheck: _lastCheck,
        monitoring: !!_monitorInterval
    };
};

export default {
    initializeIntegrityMonitor,
    verifyIntegrity,
    startContinuousMonitoring,
    stopMonitoring,
    getMonitorStatus
};
