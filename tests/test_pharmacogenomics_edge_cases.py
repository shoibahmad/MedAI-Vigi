"""
Unit Tests for Pharmacogenomics Edge Cases, Unknown Genotypes, and Malformed Inputs
"""

from services.pharmacogenomics import PharmacogenomicsEngine


def test_unknown_cyp_genotypes_fallback_to_default() -> None:
    """Test that unseen/custom genotype strings default to normal activity score 1.0"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "cyp2c9": "UNKNOWN_MUTATION_*99",
        "cyp2d6": "RARE_ALLELE",
        "cyp3a4": "NonExistentVariant",
        "cyp1a2": None,
    }
    result = engine.analyze_expanded_cyp_profile(patient_data)
    assert "individual_enzymes" in result
    assert result["composite_metabolism_score"] == 1.0
    assert result["individual_enzymes"]["CYP2C9"]["activity_score"] == 1.0


def test_empty_or_malformed_hla_typing_handles_gracefully() -> None:
    """Test HLA screening handles empty lists, None, or string values gracefully"""
    engine = PharmacogenomicsEngine()

    # Empty dictionary
    res1 = engine.analyze_hla_hypersensitivity_risk({}, "Warfarin")
    assert res1["overall_hypersensitivity_risk"] == "Low"
    assert len(res1["high_risk_alleles_present"]) == 0

    # String typing instead of list
    res2 = engine.analyze_hla_hypersensitivity_risk({"hla_b_typing": "HLA-B*5701"}, "Abacavir")
    assert res2["overall_hypersensitivity_risk"] == "Critical"
    assert len(res2["high_risk_alleles_present"]) == 1


def test_transporter_unknown_genotype_defaults() -> None:
    """Test drug transporters default to low risk for uncataloged alleles"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "slco1b1_genotype": "UNKNOWN_POLYMORPHISM",
        "abcb1_genotype": "UNKNOWN",
    }
    result = engine.analyze_transporter_genetics(patient_data)
    assert result["drug_disposition_risk"] == "Low - Normal transporter kinetics"
    assert result["transporter_profiles"]["SLCO1B1"]["risk_category"] == "Low"


def test_non_cyp_unknown_genotype_defaults() -> None:
    """Test non-CYP (TPMT, DPYD, VKORC1) default to normal on unrecognized genotypes"""
    engine = PharmacogenomicsEngine()
    patient_data = {
        "tpmt_genotype": "NOVEL_ALLELE",
        "dpyd_genotype": "UNIDENTIFIED",
        "vkorc1_genotype": "UNTESTED",
    }
    result = engine.analyze_non_cyp_enzymes(patient_data)
    assert result["high_risk_non_cyp"] is False
    assert result["non_cyp_profiles"]["TPMT"]["risk_category"] == "Normal"
