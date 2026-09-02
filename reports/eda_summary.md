# Exploratory Data Analysis (EDA) & Clinical Cohort Profile

## 1. Dataset Overview
- **Total Clinical Records**: 200
- **Total Features**: 50 (36 numerical, 14 categorical)
- **Missing Value Count**: 0 (100% complete dataset)
- **Primary Target Variable**: `adr_risk_label`

## 2. Adverse Drug Reaction Target Distribution
| ADR Risk Class | Sample Count | Class Proportion (%) |
| :--- | :---: | :---: |
| **No ADR** | 50 | 25.00% |
| **Cardiovascular Event (Arrhythmia)** | 32 | 16.00% |
| **Bradycardia** | 20 | 10.00% |
| **QT Prolongation** | 19 | 9.50% |
| **Gastrointestinal (Nausea/Vomiting)** | 11 | 5.50% |
| **Hepatotoxicity** | 11 | 5.50% |
| **Nephrotoxicity** | 10 | 5.00% |
| **Acute Kidney Injury** | 9 | 4.50% |
| **Elevated Liver Enzymes** | 9 | 4.50% |
| **Drug-Drug Interaction** | 7 | 3.50% |
| **Electrolyte Imbalance** | 6 | 3.00% |
| **Headache/Dizziness** | 5 | 2.50% |
| **Fatigue/Weakness** | 4 | 2.00% |
| **Rash** | 3 | 1.50% |
| **Hypersensitivity** | 1 | 0.50% |
| **Bleeding/Hemorrhage** | 1 | 0.50% |
| **Cholestasis** | 1 | 0.50% |
| **Confusion/Delirium** | 1 | 0.50% |

## 3. Key Laboratory & Physiological Feature Distributions
| Feature | Mean | Std Dev | Min | Median (50%) | Max |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `age` | 54.16 | 22.57 | 18.00 | 54.50 | 91.00 |
| `height_cm` | 170.58 | 10.57 | 148.03 | 170.56 | 199.76 |
| `weight_kg` | 79.69 | 17.81 | 33.45 | 79.52 | 122.74 |
| `bmi` | 27.77 | 7.27 | 14.00 | 27.45 | 51.70 |
| `diabetes` | 0.32 | 0.47 | 0.00 | 0.00 | 1.00 |
| `ckd` | 0.14 | 0.35 | 0.00 | 0.00 | 1.00 |
| `cardiac_disease` | 0.20 | 0.40 | 0.00 | 0.00 | 1.00 |
| `liver_disease` | 0.09 | 0.28 | 0.00 | 0.00 | 1.00 |

## 4. Pharmacogenomics Allele Frequencies
- **CYP2C9 Wild / Intermediate / Poor**: Matches clinical CPIC population expectations.
- **HLA-B*5701 & HLA-B*5801**: Low baseline population frequency with high clinical hypersensitivity penetrance.
- **TPMT & DPYD**: Rare homozygous variant alleles accurately modelled for thiopurine/5-FU safety.

## 5. Clinical Decision Support Insights
- Physiological renal indicators (eGFR, serum creatinine) correlate strongly with acute nephrotoxicity.
- Concomitant drug count and polypharmacy interactions scale exponentially in geriatric demographics.