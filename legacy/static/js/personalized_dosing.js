/**
 * Personalized Dosing System - Main Entrypoint
 * Bridges medication reference database with real-time dosing calculation handlers.
 */

import { medicationDatabase, getMedicationInfo } from './dosing/database.js';
import { calculatePersonalizedDose, bindDosingEvents } from './dosing/calculator.js';

export {
    medicationDatabase,
    getMedicationInfo,
    calculatePersonalizedDose,
    bindDosingEvents
};

document.addEventListener('DOMContentLoaded', () => {
    bindDosingEvents();
});
