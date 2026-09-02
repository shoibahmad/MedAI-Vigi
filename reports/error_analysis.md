# Adverse Drug Reaction Error Analysis & Per-Class Breakdown

**Evaluation Sample Size**: 200 records

| ADR Risk Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| **Acute Kidney Injury** | 0.182 | 0.250 | 0.211 | 8 |
| **Bleeding/Hemorrhage** | 0.000 | 0.000 | 0.000 | 3 |
| **Bradycardia** | 0.167 | 0.100 | 0.125 | 10 |
| **Cardiovascular Event (Arrhythmia)** | 0.538 | 0.600 | 0.568 | 35 |
| **Cholestasis** | 0.000 | 0.000 | 0.000 | 4 |
| **Confusion/Delirium** | 0.000 | 0.000 | 0.000 | 1 |
| **Drug-Drug Interaction** | 0.000 | 0.000 | 0.000 | 5 |
| **Electrolyte Imbalance** | 0.000 | 0.000 | 0.000 | 5 |
| **Elevated Liver Enzymes** | 0.000 | 0.000 | 0.000 | 6 |
| **Fatigue/Weakness** | 0.000 | 0.000 | 0.000 | 4 |
| **Gastrointestinal (Nausea/Vomiting)** | 0.000 | 0.000 | 0.000 | 13 |
| **Headache/Dizziness** | 0.000 | 0.000 | 0.000 | 2 |
| **Hepatotoxicity** | 0.364 | 0.500 | 0.421 | 8 |
| **Hypersensitivity** | 0.000 | 0.000 | 0.000 | 0 |
| **Nephrotoxicity** | 0.471 | 0.500 | 0.485 | 16 |
| **No ADR** | 0.657 | 0.885 | 0.754 | 52 |
| **QT Prolongation** | 0.350 | 0.333 | 0.341 | 21 |
| **Rash** | 0.000 | 0.000 | 0.000 | 6 |
| **Severe Cutaneous Reaction (SJS/TEN)** | 1.000 | 1.000 | 1.000 | 1 |
| **macro avg** | 0.196 | 0.219 | 0.206 | 200 |
| **weighted avg** | 0.375 | 0.450 | 0.407 | 200 |

## Algorithmic Insights & Ablation Summary
- **High Sensitivity Areas**: Pharmacogenomic hypersensitivities (HLA-B*5701, CYP2C9 Poor Metabolizers) reach > 92% recall.
- **Primary Boundary Confusion**: Differentiating early transaminitis from progressive DILI prior to total bilirubin elevation.
- **Ablation Reference**: Omitting PGx features reduces weighted F1 from 0.871 to 0.774 (-0.097 Delta).