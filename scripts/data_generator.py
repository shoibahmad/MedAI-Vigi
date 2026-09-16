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

    # ----------------------------------------------------------- risk model
    #
    # Each patient's reaction risk is a continuous function of their clinical
    # picture, not a lookup from a handful of categories.
    #
    # Two earlier designs both failed, in opposite directions:
    #
    #   Deterministic branches - matching the renal condition guaranteed a
    #   reaction. A model trained on that learns P(ADR | CKD) = 1.0 and reports
    #   ~100% risk for anyone with any comorbidity. Useless at the bedside,
    #   because almost every patient being assessed has something.
    #
    #   Branches with a fixed incidence - clinically plausible, but only seven
    #   distinct risk values existed across the whole cohort, so every CKD
    #   patient looked identical regardless of eGFR, age or regimen. That caps
    #   discrimination at roughly AUC 0.72 no matter how good the model is.
    #
    # A log-odds sum over the individual risk factors fixes both: risk rises
    # smoothly with severity, two patients sharing a diagnosis differ according
    # to everything else about them, and the overall reaction rate stays in a
    # plausible range. Coefficients are ordered to reflect the relative weight
    # clinical pharmacology gives each factor - HLA-linked hypersensitivity and
    # anticoagulation with a poor-metaboliser genotype dominate, background
    # exposure contributes least - but they are illustrative, not fitted to any
    # real cohort.
    df = pd.DataFrame(data)
    adr_labels = []

    def _num(value, default=0.0):
        try:
            v = float(value)
            return default if np.isnan(v) else v
        except (TypeError, ValueError):
            return default

    NEPHROTOXIC = {"Vancomycin", "Gentamicin", "Ibuprofen", "Lisinopril"}
    HEPATOTOXIC = {"Simvastatin", "Amiodarone", "Methotrexate", "Isoniazid"}

    for _, r in df.iterrows():
        age = _num(r.get("age"), 50.0)
        egfr = _num(r.get("egfr"), 90.0)
        ast = _num(r.get("ast_alt"), 25.0)
        bili = _num(r.get("bilirubin"), 0.8)
        alb = _num(r.get("albumin"), 4.2)
        ndrugs = _num(r.get("concomitant_drugs_count"), 0.0)
        drug = r.get("medication_name", "")

        ckd = int(_num(r.get("ckd")))
        liver = int(_num(r.get("liver_disease")))
        cardiac = int(_num(r.get("cardiac_disease")))
        diabetes = int(_num(r.get("diabetes")))
        hla = int(_num(r.get("hla_risk_allele_flag")))
        prior = int(_num(r.get("prior_adr_history")))
        qt = int(_num(r.get("qt_prolonging_flag")))
        cyp2c9_poor = r.get("cyp2c9") == "Poor"
        cyp2d6_poor = r.get("cyp2d6") == "Poor"

        # Organ-system pressures, each graded by how deranged the patient is.
        renal = 0.50 * ckd + 1.15 * max(0.0, (60.0 - egfr) / 30.0)
        hepatic = 0.55 * liver + 0.85 * max(0.0, (ast - 40.0) / 60.0) \
            + 0.35 * max(0.0, (bili - 1.2) / 1.5) + 0.30 * max(0.0, (3.5 - alb) / 1.0)
        cardio = 0.55 * cardiac + 0.60 * qt
        immune = 1.45 * hla
        haem = 0.85 * (cyp2c9_poor and drug == "Warfarin") + 0.40 * (drug == "Warfarin")
        general = 0.13 * ndrugs + 0.019 * (age - 50.0) + 0.25 * diabetes \
            + 0.55 * prior + 0.45 * cyp2c9_poor + 0.30 * cyp2d6_poor

        # Drug-organ interactions: a nephrotoxic agent matters far more in a
        # kidney that is already struggling.
        if drug in NEPHROTOXIC:
            renal += 0.35 + 0.55 * max(0.0, (60.0 - egfr) / 30.0)
        if drug in HEPATOTOXIC:
            hepatic += 0.35 + 0.45 * liver

        logit = -3.15 + renal + hepatic + cardio + immune + haem + general
        p_adr = 1.0 / (1.0 + np.exp(-logit))

        if np.random.rand() >= p_adr:
            adr_labels.append("No ADR")
            continue

        # Which reaction: the organ system under most pressure is most likely,
        # so the type is learnable from the same features that drove the risk.
        systems = {
            "renal": renal,
            "hepatic": hepatic,
            "cardio": cardio,
            "immune": immune,
            "haem": haem,
            "general": 0.35 + 0.10 * ndrugs,
        }
        weights = np.array([max(v, 0.02) for v in systems.values()], dtype=float)
        weights = weights / weights.sum()
        system = np.random.choice(list(systems), p=weights)

        REACTIONS = {
            "renal": (["Nephrotoxicity", "Acute Kidney Injury", "Electrolyte Imbalance"],
                      [0.5, 0.3, 0.2]),
            "hepatic": (["Hepatotoxicity", "Elevated Liver Enzymes", "Cholestasis"],
                        [0.6, 0.3, 0.1]),
            "cardio": (["Cardiovascular Event (Arrhythmia)", "QT Prolongation", "Bradycardia"],
                       [0.5, 0.3, 0.2]),
            "immune": (["Severe Cutaneous Reaction (SJS/TEN)", "Hypersensitivity", "Rash"],
                       [0.4, 0.3, 0.3]),
            "haem": (["Bleeding/Hemorrhage", "Bruising/Petechiae"], [0.7, 0.3]),
            "general": (["Gastrointestinal (Nausea/Vomiting)", "Headache/Dizziness",
                         "Fatigue/Weakness", "Drug-Drug Interaction", "Confusion/Delirium"],
                        [0.35, 0.22, 0.18, 0.15, 0.10]),
        }
        types, mix = REACTIONS[system]
        adr_labels.append(np.random.choice(types, p=mix))

    df["adr_risk_label"] = adr_labels
    df["adr_outcome"] = (df["adr_risk_label"] != "No ADR").astype(int)

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    df.to_csv(output_path, index=False)
    return df


if __name__ == "__main__":
    generate_synthetic_data(n_samples=200000)
