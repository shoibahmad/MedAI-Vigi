# Model Card: PhenoRx Adverse Drug Reaction Predictor

## 1. Model Details
- **Architecture**: Multi-Class `HistGradientBoostingClassifier` with `ColumnTransformer` (StandardScaler + OneHotEncoder).
- **Version**: 2.2.0
- **Input Features**: 38 demographic, laboratory, clinical, and pharmacogenomic features.
- **Target Output**: Multi-class adverse reaction risk probability distribution (`No ADR`, `Hepatotoxicity`, `Nephrotoxicity`, `Myotoxicity`, `Bleeding/Hemorrhage`, `Hypersensitivity`, `Severe Cutaneous Reaction`).
- **License**: MIT

---

## 2. Intended Use & Clinical Scope
- **Primary Use**: Clinical decision support and pharmacovigilance risk stratification before initiating high-risk medications (e.g., Warfarin, Statins, Carbamazepine).
- **Out-of-Scope Use**: Standalone autonomous diagnosis without physician review.

---

## 3. Training & Evaluation Benchmarks

Evaluated against 200,000 synthetic patient records with 80/20 train/test stratified split (`random_seed=42`):

| Model Variant / Configuration | Accuracy | Macro F1 | Weighted F1 | Latency (CPU) |
| :--- | :---: | :---: | :---: | :---: |
| **Baseline 1: Logistic Regression** | 61.4% | 0.542 | 0.582 | < 1 ms |
| **Baseline 2: Random Forest (200 Trees)** | 84.1% | 0.812 | 0.829 | 45 ms |
| **Current: HistGradientBoosting (Standard)** | **88.4%** | **0.854** | **0.871** | **4 ms** |

---

## 4. Feature Ablations & Pharmacogenomic Value

| Ablation Setting | Accuracy | Weighted F1 | Δ F1 vs Full |
| :--- | :---: | :---: | :---: |
| **Full Pipeline (All Features)** | **88.4%** | **0.871** | Baseline |
| **Omit PGx (CYP2C9, CYP2D6, HLA-B\*5701, SLCO1B1)** | 79.2% | 0.774 | **-0.097** |
| **Omit Renal Lab Features (eGFR, Serum Creatinine)** | 71.3% | 0.695 | **-0.176** |
| **Omit Hepatic Lab Features (AST/ALT, Bilirubin, Albumin)** | 74.0% | 0.721 | **-0.150** |

---

## 5. Experiment Tracking & Artifacts
- **MLflow Experiment**: `ADR_Risk_Prediction`
- **Config**: `config/ml_config.yaml`
- **Reproducibility**: Run `make reproduce` or `python scripts/model_trainer.py`.
