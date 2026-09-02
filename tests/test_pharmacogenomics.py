"""
Unit Tests for Pharmacogenomics PGx Engine
"""

from services.pharmacogenomics import PharmacogenomicsEngine


def test_cyp_profile_analysis_normal() -> None:
    """Test standard normal metabolizer profile scoring"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "cyp2c9": "Wild",
        "cyp2d6": "EM",
        "cyp3a4": "Normal",
        "cyp1a2": "Normal",
        "cyp2b6": "Normal",
        "cyp2c19": "EM",
    }
    result = engine.analyze_expanded_cyp_profile(patient_data)
    assert result["composite_metabolism_score"] == 1.0
    assert "Low" in result["overall_risk_assessment"]


def test_cyp_profile_analysis_poor_metabolizer() -> None:
    """Test poor metabolizer profile scoring triggers high risk"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "cyp2c9": "Poor",
        "cyp2d6": "PM",
        "cyp3a4": "Poor",
        "cyp1a2": "Slow",
        "cyp2b6": "Poor",
        "cyp2c19": "PM",
    }
    result = engine.analyze_expanded_cyp_profile(patient_data)
    assert result["composite_metabolism_score"] < 0.3
    assert (
        "Critical" in result["overall_risk_assessment"]
        or "High" in result["overall_risk_assessment"]
    )


def test_transporter_genetics_analysis() -> None:
    """Test transporter risk categorization"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "slco1b1_genotype": "*5/*5",
        "abcb1_genotype": "TT",
        "abcg2_genotype": "Variant/Variant",
    }
    result = engine.analyze_transporter_genetics(patient_data)
    assert result["transporter_profiles"]["SLCO1B1"]["risk_category"] == "High"
    assert result["drug_disposition_risk"] == "High - Multiple transporter impairments"


def test_hla_hypersensitivity_matching() -> None:
    """Test HLA-B*5701 hypersensitivity matching for Abacavir"""
    engine = PharmacogenomicsEngine()
    patient_data = {"hla_b_typing": ["HLA-B*5701", "HLA-B*0801"]}
    result = engine.analyze_hla_hypersensitivity_risk(patient_data, medication_name="Abacavir")
    assert result["overall_hypersensitivity_risk"] == "Critical"
    assert len(result["high_risk_alleles_present"]) >= 1
    assert "CONTRAINDICATED" in result["drug_specific_risks"][0]["recommendation"]


def test_non_cyp_enzymes_analysis() -> None:
    """Test non-CYP genetic markers (TPMT, DPYD, VKORC1)"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "tpmt_genotype": "*3A/*3A",
        "dpyd_genotype": "*2A/*2A",
        "vkorc1_genotype": "AA",
    }
    result = engine.analyze_non_cyp_enzymes(patient_data)
    assert result["high_risk_non_cyp"] is True
    assert result["non_cyp_profiles"]["TPMT"]["risk_category"] == "Poor"
    assert result["non_cyp_profiles"]["DPYD"]["risk_category"] == "Poor"
    assert result["non_cyp_profiles"]["VKORC1"]["risk_category"] == "High Sensitivity"
