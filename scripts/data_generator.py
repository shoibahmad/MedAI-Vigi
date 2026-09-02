"""
Synthetic Clinical Cohort Data Generator for ADR Risk Prediction
Generates realistic physiological distributions and comorbidity dependencies with reproducible random seeds.
"""

import os
from typing import Any, Dict

import numpy as np
import pandas as pd
import yaml


def load_ml_config(config_path: str = "config/ml_config.yaml") -> Dict[str, Any]:
    """Load machine learning configuration from YAML"""
    if os.path.exists(config_path):
        with open(config_path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {
        "data_generation": {"n_samples": 200000, "random_seed": 42},
        "training": {"random_seed": 42},
    }


def generate_synthetic_data(
    n_samples: int = 200000,
    random_seed: int = 42,
    output_path: str = "data/clinical_data.csv",
    **kwargs: Any,
) -> pd.DataFrame:
    """Generate synthetic clinical records with biological co-dependencies"""
    # Accept num_patients alias if passed
    if "num_patients" in kwargs:
        n_samples = kwargs["num_patients"]

    np.random.seed(random_seed)

    data: Dict[str, Any] = {}
    data["age"] = np.random.randint(18, 92, n_samples)
    data["sex"] = np.random.choice(["M", "F"], n_samples, p=[0.5, 0.5])
    data["ethnicity"] = np.random.choice(
        ["White", "Asian", "Black", "Hispanic"], n_samples, p=[0.45, 0.25, 0.15, 0.15]
    )

    data["height_cm"] = np.random.normal(loc=170, scale=10, size=n_samples)
    data["weight_kg"] = np.random.normal(loc=78, scale=16, size=n_samples)
    data["bmi"] = np.clip(data["weight_kg"] / (data["height_cm"] / 100) ** 2, 14.0, 55.0).round(1)

    age_factor = (data["age"] - 18) / 74.0

    diabetes = [
        1 if np.random.rand() < (0.05 + 0.35 * f + (0.2 if bmi > 30 else 0.0)) else 0
        for f, bmi in zip(age_factor, data["bmi"], strict=False)
    ]
    ckd = [1 if np.random.rand() < (0.02 + 0.28 * f) else 0 for f in age_factor]
    cardiac = [1 if np.random.rand() < (0.05 + 0.40 * f) else 0 for f in age_factor]
    liver = [1 if np.random.rand() < 0.08 else 0 for _ in range(n_samples)]

    data["diabetes"] = diabetes
    data["ckd"] = ckd
    data["cardiac_disease"] = cardiac
    data["liver_disease"] = liver

    # Vitals
    bp_sys = np.random.normal(120, 12, n_samples) + np.array(cardiac) * 15 + age_factor * 10
    data["bp_systolic"] = np.clip(bp_sys, 85, 230).astype(int)
    data["bp_diastolic"] = np.clip(np.random.normal(80, 10, n_samples), 50, 130).astype(int)
    data["heart_rate"] = np.clip(
        np.random.normal(72, 10, n_samples) + np.array(cardiac) * 8, 45, 160
    ).astype(int)
    data["temperature"] = np.clip(np.random.normal(37.0, 0.4, n_samples), 35.5, 40.5).round(1)

    # Labs
    creat = np.random.normal(1.0, 0.2, n_samples) + np.array(ckd) * np.random.uniform(
        1.2, 4.0, n_samples
    )
    data["creatinine"] = np.clip(creat, 0.4, 12.0).round(2)
    data["egfr"] = np.clip(
        141 * (data["creatinine"] / 0.9) ** (-1.2) * (0.993) ** data["age"], 5.0, 130.0
    ).round(1)

    ast = np.random.normal(28, 8, n_samples) + np.array(liver) * np.random.uniform(
        80, 500, n_samples
    )
    data["ast_alt"] = np.clip(ast, 10, 1200).astype(int)
    data["bilirubin"] = np.clip(
        np.random.normal(0.8, 0.3, n_samples) + np.array(liver) * 2.5, 0.2, 20.0
    ).round(2)
    data["albumin"] = np.clip(
        np.random.normal(4.2, 0.4, n_samples) - np.array(liver) * 1.2, 1.8, 5.5
    ).round(2)

    # Coagulation & CBC
    data["ind_value"] = np.clip(np.random.normal(1.0, 0.2, n_samples), 0.8, 5.0).round(2)
    data["atpp_value"] = np.clip(np.random.normal(30.0, 4.0, n_samples), 20.0, 100.0).round(1)
    data["hemoglobin"] = np.clip(
        np.random.normal(14.0, 1.8, n_samples) - np.array(ckd) * 2.0, 6.0, 20.0
    ).round(1)
    data["hematocrit"] = np.clip(
        data["hemoglobin"] * 3.0 + np.random.normal(0, 1.5, n_samples), 18.0, 60.0
    ).round(1)
    data["wbc_count"] = np.clip(np.random.normal(7.2, 2.0, n_samples), 2.0, 30.0).round(1)
    data["platelet_count"] = np.clip(
        np.random.normal(260, 60, n_samples) - np.array(liver) * 80, 30, 700
    ).astype(int)
    data["rbc_count"] = np.clip(np.random.normal(4.7, 0.5, n_samples), 2.5, 6.8).round(2)

    # Pharmacogenomics & Meds
    data["medication_name"] = np.random.choice(
        ["Warfarin", "Metformin", "Simvastatin", "Aspirin", "Lisinopril", "Amiodarone"], n_samples
    )
    data["indication"] = np.random.choice(
        ["Hypertension", "Diabetes", "Atrial Fibrillation", "Hyperlipidemia", "Pain"], n_samples
    )
    data["index_drug_dose"] = np.random.choice(
        [2.5, 5.0, 10.0, 20.0, 40.0, 80.0, 500.0, 850.0, 1000.0], n_samples
    )
    data["concomitant_drugs_count"] = np.random.randint(0, 12, n_samples)
    data["cyp_inhibitors_flag"] = np.random.choice([0, 1], n_samples, p=[0.75, 0.25])
    data["qt_prolonging_flag"] = np.random.choice([0, 1], n_samples, p=[0.85, 0.15])
    data["cyp2c9"] = np.random.choice(
        ["Wild", "Intermediate", "Poor", "Rapid"], n_samples, p=[0.60, 0.25, 0.10, 0.05]
    )
    data["cyp2d6"] = np.random.choice(
        ["EM", "IM", "PM", "UM"], n_samples, p=[0.65, 0.20, 0.10, 0.05]
    )
    data["cyp3a4"] = np.random.choice(
        ["Normal", "Intermediate", "Poor"], n_samples, p=[0.75, 0.18, 0.07]
    )
    data["cyp1a2"] = np.random.choice(["Normal", "Slow"], n_samples, p=[0.80, 0.20])
    data["cyp2b6"] = np.random.choice(["Normal", "Poor"], n_samples, p=[0.85, 0.15])
    data["cyp2c19"] = np.random.choice(["EM", "IM", "PM"], n_samples, p=[0.70, 0.20, 0.10])
    data["slco1b1_genotype"] = np.random.choice(
        ["*1/*1", "*1/*5", "*5/*5"], n_samples, p=[0.70, 0.22, 0.08]
    )
    data["abcb1_genotype"] = np.random.choice(["CC", "CT", "TT"], n_samples, p=[0.45, 0.40, 0.15])
    data["abcg2_genotype"] = np.random.choice(
        ["Wild/Wild", "Wild/Variant", "Variant/Variant"], n_samples, p=[0.70, 0.24, 0.06]
    )
    data["hla_risk_allele_flag"] = np.random.choice([0, 1], n_samples, p=[0.95, 0.05])

    data["time_since_start_days"] = np.random.randint(1, 365, n_samples)
    data["cumulative_dose_mg"] = (data["index_drug_dose"] * data["time_since_start_days"]).round(1)
    data["dose_density_mg_day"] = (
        data["cumulative_dose_mg"] / data["time_since_start_days"]
    ).round(2)
    data["inpatient_flag"] = np.random.choice([0, 1], n_samples, p=[0.80, 0.20])
    data["prior_adr_history"] = np.random.choice([0, 1], n_samples, p=[0.88, 0.12])
    data["polypharmacy_flag"] = (data["concomitant_drugs_count"] >= 5).astype(int)

    # Risk Label Scoring
    df = pd.DataFrame(data)
    adr_labels = []

    for _, r in df.iterrows():
        if (
            r["liver_disease"] == 1
            or r["ast_alt"] > 120
            or (r["medication_name"] == "Simvastatin" and r["slco1b1_genotype"] == "*5/*5")
        ):
            adr_labels.append(
                np.random.choice(
                    ["Hepatotoxicity", "Elevated Liver Enzymes", "Cholestasis"], p=[0.6, 0.3, 0.1]
                )
            )
        elif r["ckd"] == 1 or r["creatinine"] > 2.0:
            adr_labels.append(
                np.random.choice(
                    ["Nephrotoxicity", "Acute Kidney Injury", "Electrolyte Imbalance"],
                    p=[0.5, 0.3, 0.2],
                )
            )
        elif (
            r["cardiac_disease"] == 1
            or r["qt_prolonging_flag"] == 1
            or r["medication_name"] == "Amiodarone"
        ):
            adr_labels.append(
                np.random.choice(
                    ["Cardiovascular Event (Arrhythmia)", "QT Prolongation", "Bradycardia"],
                    p=[0.5, 0.3, 0.2],
                )
            )
        elif r["medication_name"] == "Warfarin" and (
            r["cyp2c9"] == "Poor" or r["prior_adr_history"] == 1
        ):
            adr_labels.append(
                np.random.choice(["Bleeding/Hemorrhage", "Bruising/Petechiae"], p=[0.7, 0.3])
            )
        elif r["hla_risk_allele_flag"] == 1:
            adr_labels.append(
                np.random.choice(
                    ["Severe Cutaneous Reaction (SJS/TEN)", "Hypersensitivity", "Rash"],
                    p=[0.4, 0.3, 0.3],
                )
            )
        elif r["polypharmacy_flag"] == 1 and np.random.rand() < 0.35:
            adr_labels.append(
                np.random.choice(
                    [
                        "Drug-Drug Interaction",
                        "Gastrointestinal (Nausea/Vomiting)",
                        "Confusion/Delirium",
                    ],
                    p=[0.4, 0.4, 0.2],
                )
            )
        elif np.random.rand() < 0.25:
            adr_labels.append(
                np.random.choice(
                    [
                        "Gastrointestinal (Nausea/Vomiting)",
                        "Rash",
                        "Headache/Dizziness",
                        "Fatigue/Weakness",
                    ]
                )
            )
        else:
            adr_labels.append("No ADR")

    df["adr_risk_label"] = adr_labels
    df["adr_outcome"] = (df["adr_risk_label"] != "No ADR").astype(int)

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


if __name__ == "__main__":
    generate_synthetic_data(n_samples=200000)
