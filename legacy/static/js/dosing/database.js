/**
 * Medication Reference Database
 * Comprehensive dosing guidelines across cardiovascular, metabolic, and antibiotic classes.
 */

export const medicationDatabase = {
    // Cardiovascular
    'Aspirin': { standardDose: 81, unit: 'mg', frequency: 'once daily', category: 'Antiplatelet' },
    'Atorvastatin': { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'Statin' },
    'Lisinopril': { standardDose: 10, unit: 'mg', frequency: 'once daily', category: 'ACE Inhibitor' },
    'Metoprolol': { standardDose: 50, unit: 'mg', frequency: 'twice daily', category: 'Beta Blocker' },
    'Amlodipine': { standardDose: 5, unit: 'mg', frequency: 'once daily', category: 'Calcium Channel Blocker' },
    'Warfarin': { standardDose: 5, unit: 'mg', frequency: 'once daily', category: 'Anticoagulant' },
    'Clopidogrel': { standardDose: 75, unit: 'mg', frequency: 'once daily', category: 'Antiplatelet' },

    // Metabolic & Diabetes
    'Metformin': { standardDose: 500, unit: 'mg', frequency: 'twice daily', category: 'Antidiabetic' },
    'Insulin': { standardDose: 10, unit: 'units', frequency: 'as directed', category: 'Insulin' },
    'Glipizide': { standardDose: 5, unit: 'mg', frequency: 'once daily', category: 'Sulfonylurea' },
    'Sitagliptin': { standardDose: 100, unit: 'mg', frequency: 'once daily', category: 'DPP-4 Inhibitor' },

    // Anti-infectives
    'Amoxicillin': { standardDose: 500, unit: 'mg', frequency: 'three times daily', category: 'Antibiotic' },
    'Ciprofloxacin': { standardDose: 500, unit: 'mg', frequency: 'twice daily', category: 'Antibiotic' },
    'Azithromycin': { standardDose: 250, unit: 'mg', frequency: 'once daily', category: 'Antibiotic' },

    // Analgesics & Anti-inflammatory
    'Ibuprofen': { standardDose: 400, unit: 'mg', frequency: 'every 6 hours', category: 'NSAID' },
    'Acetaminophen': { standardDose: 650, unit: 'mg', frequency: 'every 6 hours', category: 'Analgesic' },
    'Tramadol': { standardDose: 50, unit: 'mg', frequency: 'every 6 hours', category: 'Opioid' },

    // Neuro-Psychiatric
    'Sertraline': { standardDose: 50, unit: 'mg', frequency: 'once daily', category: 'SSRI' },
    'Fluoxetine': { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'SSRI' },
    'Lorazepam': { standardDose: 1, unit: 'mg', frequency: 'twice daily', category: 'Benzodiazepine' },

    // Other
    'Omeprazole': { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'PPI' },
    'Furosemide': { standardDose: 40, unit: 'mg', frequency: 'once daily', category: 'Diuretic' },
    'Digoxin': { standardDose: 0.25, unit: 'mg', frequency: 'once daily', category: 'Cardiac Glycoside' }
};

export function getMedicationInfo(name) {
    return medicationDatabase[name] || null;
}
