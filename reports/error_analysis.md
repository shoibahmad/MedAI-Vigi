# Adverse Drug Reaction Error Analysis & Per-Class Breakdown

**Evaluation Sample Size**: 200 records

| ADR Risk Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Acute Kidney Injury** | 0.000 | 0.000 | 0.000 | 4 |
| **Bleeding/Hemorrhage** | 0.000 | 0.000 | 0.000 | 3 |
| **Bradycardia** | 0.000 | 0.000 | 0.000 | 2 |
| **Cardiovascular Event (Arrhythmia)** | 0.000 | 0.000 | 0.000 | 4 |
| **Cholestasis** | 0.000 | 0.000 | 0.000 | 0 |
| **Confusion/Delirium** | 0.000 | 0.000 | 0.000 | 2 |
| **Drug-Drug Interaction** | 0.000 | 0.000 | 0.000 | 3 |
| **Electrolyte Imbalance** | 0.000 | 0.000 | 0.000 | 1 |
| **Elevated Liver Enzymes** | 0.000 | 0.000 | 0.000 | 4 |
| **Fatigue/Weakness** | 0.000 | 0.000 | 0.000 | 4 |
| **Gastrointestinal (Nausea/Vomiting)** | 1.000 | 0.100 | 0.182 | 10 |
| **Headache/Dizziness** | 0.000 | 0.000 | 0.000 | 4 |
| **Hepatotoxicity** | 0.500 | 0.857 | 0.632 | 7 |
| **Hypersensitivity** | 0.000 | 0.000 | 0.000 | 1 |
| **Nephrotoxicity** | 0.000 | 0.000 | 0.000 | 3 |
| **No ADR** | 0.800 | 0.972 | 0.878 | 144 |
| **QT Prolongation** | 0.000 | 0.000 | 0.000 | 4 |
| **macro avg** | 0.135 | 0.113 | 0.099 | 200 |
| **weighted avg** | 0.643 | 0.735 | 0.663 | 200 |

_Per-class figures above are from this training run. Any ablation or subgroup claim must be produced by scripts/run_ablation.py and cited to its output._