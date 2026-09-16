# PhenoRx Model Benchmark Report

## Overall Metrics
- **Validation Accuracy:** 0.5050 (50.50%)
- **Weighted F1-Score:** 0.3781
- **Sample Count:** 200 clinical records

## Classification Breakdown
```text
                                     precision    recall  f1-score   support

                Acute Kidney Injury       0.00      0.00      0.00         9
                Bleeding/Hemorrhage       1.00      1.00      1.00         1
                        Bradycardia       0.00      0.00      0.00        20
  Cardiovascular Event (Arrhythmia)       0.43      0.91      0.59        32
                        Cholestasis       0.00      0.00      0.00         1
                 Confusion/Delirium       0.00      0.00      0.00         1
              Drug-Drug Interaction       0.00      0.00      0.00         7
              Electrolyte Imbalance       0.00      0.00      0.00         6
             Elevated Liver Enzymes       0.50      0.11      0.18         9
                   Fatigue/Weakness       0.00      0.00      0.00         4
 Gastrointestinal (Nausea/Vomiting)       0.00      0.00      0.00        11
                 Headache/Dizziness       0.00      0.00      0.00         5
                     Hepatotoxicity       0.53      0.91      0.67        11
                   Hypersensitivity       0.00      0.00      0.00         1
                     Nephrotoxicity       0.36      0.80      0.50        10
                             No ADR       0.63      1.00      0.78        50
                    QT Prolongation       0.25      0.05      0.09        19
                               Rash       1.00      0.33      0.50         3
Severe Cutaneous Reaction (SJS/TEN)       0.00      0.00      0.00         0

                           accuracy                           0.51       200
                          macro avg       0.25      0.27      0.23       200
                       weighted avg       0.34      0.51      0.38       200

```
