import { LOG_PREFIX } from '../shared/constants.js';
import { initMonacoDetector } from './monaco-detector.js';

/**
 * Content script entry point
 * Initializes Monaco detection and highlighting
 */

// Content script initialization
console.log(`${LOG_PREFIX} Content script loaded`);

// Initialize Monaco detection
initMonacoDetector();
