# Adverse Drug Reaction Error Analysis & Per-Class Breakdown

**Evaluation Sample Size**: 200 records

| ADR Risk Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Acute Kidney Injury** | 0.154 | 0.250 | 0.190 | 8 |
| **Bleeding/Hemorrhage** | 0.000 | 0.000 | 0.000 | 3 |
| **Bradycardia** | 0.000 | 0.000 | 0.000 | 10 |
| **Cardiovascular Event (Arrhythmia)** | 0.542 | 0.743 | 0.627 | 35 |
| **Cholestasis** | 0.000 | 0.000 | 0.000 | 4 |
| **Confusion/Delirium** | 0.000 | 0.000 | 0.000 | 1 |
| **Drug-Drug Interaction** | 0.000 | 0.000 | 0.000 | 5 |
| **Electrolyte Imbalance** | 0.000 | 0.000 | 0.000 | 5 |
| **Elevated Liver Enzymes** | 0.000 | 0.000 | 0.000 | 6 |
| **Fatigue/Weakness** | 0.000 | 0.000 | 0.000 | 4 |
| **Gastrointestinal (Nausea/Vomiting)** | 0.000 | 0.000 | 0.000 | 13 |
| **Headache/Dizziness** | 0.000 | 0.000 | 0.000 | 2 |
| **Hepatotoxicity** | 0.429 | 0.750 | 0.545 | 8 |
| **Hypersensitivity** | 0.000 | 0.000 | 0.000 | 0 |
| **Nephrotoxicity** | 0.467 | 0.438 | 0.452 | 16 |
| **No ADR** | 0.612 | 1.000 | 0.759 | 52 |
| **QT Prolongation** | 0.389 | 0.333 | 0.359 | 21 |
| **Rash** | 0.000 | 0.000 | 0.000 | 6 |
| **Severe Cutaneous Reaction (SJS/TEN)** | 0.000 | 0.000 | 0.000 | 1 |
| **macro avg** | 0.136 | 0.185 | 0.154 | 200 |
| **weighted avg** | 0.355 | 0.500 | 0.410 | 200 |

_Per-class figures above are from this training run. Any ablation or subgroup claim must be produced by scripts/run_ablation.py and cited to its output._