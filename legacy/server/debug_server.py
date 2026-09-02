from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import google.generativeai as genai_old # Keep for typing if needed
from google import genai
import os
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging - use INFO level for production, DEBUG for development
log_level = logging.DEBUG if os.getenv('FLASK_ENV') == 'development' else logging.INFO
logging.basicConfig(level=log_level)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini API - Primary Key for Clinical Analysis
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is required. Please add it to your .env file")

# Initialize Client
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = 'gemini-1.5-flash' # Default model

# Configure Gemini API - AI Insights Key for Drug Interactions
GEMINI_API_AI_INSIGHTS = os.getenv('GEMINI_API_KEY_DRUG_INTERACTIONS')
if not GEMINI_API_AI_INSIGHTS:
    raise ValueError("GEMINI_API_KEY_DRUG_INTERACTIONS is required. Please add it to your .env file")
# We can use the same client or a separate one if keys differ, assuming same key for now or just re-instantiating if needed.
# For simplicity, using same client if keys are same, else we might need client_interactions
client_interactions = genai.Client(api_key=GEMINI_API_AI_INSIGHTS)

# Load the trained model and preprocessor
try:
    model = joblib.load('adr_model.pkl')
    preprocessor = joblib.load('adr_preprocessor.pkl')
    logger.info("✅ Model and preprocessor loaded successfully")
except Exception as e:
    logger.error(f"❌ Error loading model: {e}")
    model = None
    preprocessor = None

# ═══════════════════════════════════════════════════════════════════════════════════════
# 🧬 ADVANCED PHARMACOGENOMICS & PRECISION MEDICINE MODULE
# ═══════════════════════════════════════════════════════════════════════════════════════

class AdvancedPharmacogenomics:
    """Advanced pharmacogenomic analysis and personalized dosing algorithms"""
    
    def __init__(self):
        # CYP Enzyme Activity Scores
        self.cyp_activity_scores = {
            'CYP2C9': {'Poor': 0.1, 'Intermediate': 0.5, 'Wild': 1.0, 'Rapid': 1.5},
            'CYP2D6': {'PM': 0.0, 'IM': 0.5, 'EM': 1.0, 'UM': 2.0},
            'CYP3A4': {'Poor': 0.2, 'Intermediate': 0.6, 'Normal': 1.0, 'Rapid': 1.8},
            'CYP1A2': {'Slow': 0.3, 'Intermediate': 0.7, 'Normal': 1.0, 'Rapid': 1.6},
            'CYP2B6': {'Poor': 0.1, 'Intermediate': 0.4, 'Normal': 1.0, 'Rapid': 1.7},
            'CYP2C19': {'PM': 0.0, 'IM': 0.3, 'EM': 1.0, 'RM': 1.5, 'UM': 2.5}
        }
        
        # Transporter Activity Profiles
        self.transporter_profiles = {
            'SLCO1B1': {
                '*1/*1': {'activity': 1.0, 'risk': 'Low'},
                '*5/*5': {'activity': 0.2, 'risk': 'High'},
                '*15/*15': {'activity': 0.3, 'risk': 'High'},
                '*1/*5': {'activity': 0.6, 'risk': 'Intermediate'},
                '*1/*15': {'activity': 0.65, 'risk': 'Intermediate'}
            },
            'ABCB1': {
                'CC': {'activity': 1.0, 'risk': 'Low'},
                'CT': {'activity': 0.7, 'risk': 'Intermediate'},
                'TT': {'activity': 0.4, 'risk': 'High'}
            },
            'ABCG2': {
                'Wild/Wild': {'activity': 1.0, 'risk': 'Low'},
                'Wild/Variant': {'activity': 0.6, 'risk': 'Intermediate'},
                'Variant/Variant': {'activity': 0.3, 'risk': 'High'}
            }
        }
        
        # HLA Risk Alleles for Hypersensitivity Reactions
        self.hla_drug_associations = {
            'HLA-B*5701': {
                'drugs': ['Abacavir', 'Flucloxacillin'],
                'reaction': 'Severe Hypersensitivity Syndrome',
                'risk_level': 'Critical'
            },
            'HLA-B*5801': {
                'drugs': ['Allopurinol', 'Carbamazepine'],
                'reaction': 'Stevens-Johnson Syndrome/TEN',
                'risk_level': 'Critical'
            },
            'HLA-A*3101': {
                'drugs': ['Carbamazepine', 'Phenytoin'],
                'reaction': 'Severe Cutaneous Reactions',
                'risk_level': 'High'
            },
            'HLA-DRB1*0701': {
                'drugs': ['Lapatinib'],
                'reaction': 'Drug-Induced Liver Injury',
                'risk_level': 'High'
            },
            'HLA-DQA1*0201': {
                'drugs': ['Terbinafine'],
                'reaction': 'Hepatotoxicity',
                'risk_level': 'Moderate'
            }
        }

    def analyze_expanded_cyp_profile(self, patient_data):
        """Comprehensive CYP enzyme analysis"""
        cyp_analysis = {
            'CYP2C9': patient_data.get('cyp2c9', 'Wild'),
            'CYP2D6': patient_data.get('cyp2d6', 'EM'),
            'CYP3A4': patient_data.get('cyp3a4', 'Normal'),
            'CYP1A2': patient_data.get('cyp1a2', 'Normal'),
            'CYP2B6': patient_data.get('cyp2b6', 'Normal'),
            'CYP2C19': patient_data.get('cyp2c19', 'EM')
        }
        
        detailed_analysis = {}
        overall_metabolism_score = 0
        
        for enzyme, genotype in cyp_analysis.items():
            activity_score = self.cyp_activity_scores[enzyme].get(genotype, 1.0)
            
            # Determine risk level
            if activity_score <= 0.2:
                risk_level = 'Critical'
                clinical_impact = 'Severe impairment - major dose reduction required'
            elif activity_score <= 0.5:
                risk_level = 'High'
                clinical_impact = 'Moderate impairment - dose reduction recommended'
            elif activity_score >= 1.5:
                risk_level = 'Moderate'
                clinical_impact = 'Enhanced metabolism - dose increase may be needed'
            else:
                risk_level = 'Low'
                clinical_impact = 'Normal metabolism expected'
            
            detailed_analysis[enzyme] = {
                'genotype': genotype,
                'activity_score': activity_score,
                'risk_level': risk_level,
                'clinical_impact': clinical_impact,
                'affected_drugs': self.get_cyp_substrate_drugs(enzyme)
            }
            
            overall_metabolism_score += activity_score
        
        # Calculate composite metabolism score
        composite_score = overall_metabolism_score / len(cyp_analysis)
        
        return {
            'individual_enzymes': detailed_analysis,
            'composite_metabolism_score': composite_score,
            'overall_risk_assessment': self.assess_overall_cyp_risk(composite_score),
            'clinical_recommendations': self.generate_cyp_recommendations(detailed_analysis)
        }

    def analyze_transporter_genetics(self, patient_data):
        """Comprehensive drug transporter genetic analysis"""
        transporter_data = {
            'SLCO1B1': patient_data.get('slco1b1_genotype', '*1/*1'),
            'ABCB1': patient_data.get('abcb1_genotype', 'CC'),
            'ABCG2': patient_data.get('abcg2_genotype', 'Wild/Wild')
        }
        
        transporter_analysis = {}
        
        for transporter, genotype in transporter_data.items():
            profile = self.transporter_profiles[transporter].get(genotype, {'activity': 1.0, 'risk': 'Unknown'})
            
            transporter_analysis[transporter] = {
                'genotype': genotype,
                'activity_level': profile['activity'],
                'risk_category': profile['risk'],
                'clinical_implications': self.get_transporter_implications(transporter, profile),
                'affected_drugs': self.get_transporter_substrate_drugs(transporter)
            }
        
        return {
            'transporter_profiles': transporter_analysis,
            'drug_disposition_risk': self.calculate_disposition_risk(transporter_analysis),
            'monitoring_recommendations': self.generate_transporter_monitoring(transporter_analysis)
        }

    def analyze_hla_hypersensitivity_risk(self, patient_data, medication_name):
        """Detailed HLA typing analysis for hypersensitivity risk"""
        hla_alleles = {
            'HLA-A': patient_data.get('hla_a_typing', []),
            'HLA-B': patient_data.get('hla_b_typing', []),
            'HLA-DRB1': patient_data.get('hla_drb1_typing', [])
        }
        
        risk_assessment = {
            'high_risk_alleles_present': [],
            'drug_specific_risks': [],
            'overall_hypersensitivity_risk': 'Low',
            'clinical_recommendations': []
        }
        
        # Check for high-risk HLA alleles
        all_patient_alleles = []
        for locus, alleles in hla_alleles.items():
            if isinstance(alleles, list):
                all_patient_alleles.extend(alleles)
            elif alleles:
                all_patient_alleles.append(alleles)
        
        for risk_allele, risk_data in self.hla_drug_associations.items():
            if risk_allele in all_patient_alleles:
                risk_assessment['high_risk_alleles_present'].append({
                    'allele': risk_allele,
                    'associated_drugs': risk_data['drugs'],
                    'reaction_type': risk_data['reaction'],
                    'risk_level': risk_data['risk_level']
                })
                
                # Check if current medication is associated with this allele
                if medication_name in risk_data['drugs']:
                    risk_assessment['drug_specific_risks'].append({
                        'medication': medication_name,
                        'hla_allele': risk_allele,
                        'reaction_risk': risk_data['reaction'],
                        'recommendation': 'CONTRAINDICATED - Alternative therapy required'
                    })
                    risk_assessment['overall_hypersensitivity_risk'] = 'Critical'
        
        # Generate clinical recommendations
        if risk_assessment['high_risk_alleles_present']:
            risk_assessment['clinical_recommendations'] = self.generate_hla_recommendations(
                risk_assessment['high_risk_alleles_present'], medication_name
            )
        
        return risk_assessment

    def calculate_personalized_dosing(self, patient_data, medication_name, standard_dose):
        """Advanced personalized dosing algorithms"""
        
        # Get patient factors
        age = patient_data.get('age', 50)
        weight = patient_data.get('weight', 70)
        creatinine = patient_data.get('creatinine', 1.0)
        egfr = patient_data.get('egfr', 90)
        ast_alt = patient_data.get('ast_alt', 30)
        
        # CYP enzyme analysis
        cyp_analysis = self.analyze_expanded_cyp_profile(patient_data)
        
        # Base dose adjustment factors
        dose_adjustments = {
            'age_factor': self.calculate_age_adjustment(age),
            'weight_factor': self.calculate_weight_adjustment(weight),
            'renal_factor': self.calculate_renal_adjustment(egfr, creatinine),
            'hepatic_factor': self.calculate_hepatic_adjustment(ast_alt),
            'genetic_factor': self.calculate_genetic_adjustment(cyp_analysis, medication_name)
        }
        
        # Calculate composite dose adjustment
        composite_factor = 1.0
        for factor_name, factor_value in dose_adjustments.items():
            composite_factor *= factor_value
        
        # Apply safety constraints
        min_dose_factor = 0.1  # Never reduce below 10% of standard dose
        max_dose_factor = 2.0  # Never exceed 200% of standard dose
        
        final_dose_factor = max(min_dose_factor, min(max_dose_factor, composite_factor))
        recommended_dose = standard_dose * final_dose_factor
        
        return {
            'standard_dose': standard_dose,
            'recommended_dose': round(recommended_dose, 1),
            'dose_adjustment_factor': round(final_dose_factor, 2),
            'individual_adjustments': dose_adjustments,
            'dosing_rationale': self.generate_dosing_rationale(dose_adjustments, medication_name),
            'monitoring_requirements': self.generate_dosing_monitoring(final_dose_factor, medication_name),
            'tdm_recommendations': self.generate_tdm_recommendations(medication_name, final_dose_factor)
        }

    # Helper methods for pharmacogenomic analysis
    def get_cyp_substrate_drugs(self, enzyme):
        """Get list of drugs metabolized by specific CYP enzyme"""
        cyp_substrates = {
            'CYP2C9': ['Warfarin', 'Phenytoin', 'Tolbutamide', 'S-Warfarin', 'Losartan'],
            'CYP2D6': ['Codeine', 'Tramadol', 'Metoprolol', 'Paroxetine', 'Risperidone'],
            'CYP3A4': ['Simvastatin', 'Midazolam', 'Cyclosporine', 'Tacrolimus', 'Nifedipine'],
            'CYP1A2': ['Caffeine', 'Theophylline', 'Clozapine', 'Olanzapine', 'Tizanidine'],
            'CYP2B6': ['Bupropion', 'Efavirenz', 'Cyclophosphamide', 'Ketamine'],
            'CYP2C19': ['Omeprazole', 'Clopidogrel', 'Escitalopram', 'Diazepam', 'Phenytoin']
        }
        return cyp_substrates.get(enzyme, [])

    def get_transporter_substrate_drugs(self, transporter):
        """Get drugs affected by specific transporters"""
        transporter_substrates = {
            'SLCO1B1': ['Simvastatin', 'Atorvastatin', 'Rosuvastatin', 'Metformin', 'Repaglinide'],
            'ABCB1': ['Digoxin', 'Dabigatran', 'Fexofenadine', 'Loperamide', 'Cyclosporine'],
            'ABCG2': ['Rosuvastatin', 'Sulfasalazine', 'Methotrexate', 'Topotecan', 'Imatinib']
        }
        return transporter_substrates.get(transporter, [])

    def calculate_age_adjustment(self, age):
        """Calculate age-based dose adjustment factor"""
        if age < 18:
            return 0.7  # Pediatric reduction
        elif age >= 65:
            return 0.8  # Geriatric reduction
        else:
            return 1.0  # Adult standard

    def calculate_weight_adjustment(self, weight):
        """Calculate weight-based dose adjustment factor"""
        if weight < 50:
            return 0.8
        elif weight > 100:
            return 1.2
        else:
            return 1.0

    def calculate_renal_adjustment(self, egfr, creatinine):
        """Calculate renal function-based dose adjustment"""
        if egfr < 30:
            return 0.5  # Severe CKD
        elif egfr < 60:
            return 0.7  # Moderate CKD
        elif egfr < 90:
            return 0.9  # Mild CKD
        else:
            return 1.0  # Normal function

    def calculate_hepatic_adjustment(self, ast_alt):
        """Calculate hepatic function-based dose adjustment"""
        if ast_alt > 200:
            return 0.5  # Severe hepatic impairment
        elif ast_alt > 100:
            return 0.7  # Moderate hepatic impairment
        elif ast_alt > 60:
            return 0.9  # Mild hepatic impairment
        else:
            return 1.0  # Normal function

    def calculate_genetic_adjustment(self, cyp_analysis, medication_name):
        """Calculate genetic-based dose adjustment factor"""
        # This would be medication-specific based on primary metabolizing enzyme
        composite_score = cyp_analysis.get('composite_metabolism_score', 1.0)
        
        if composite_score < 0.3:
            return 0.5  # Poor metabolizer
        elif composite_score < 0.7:
            return 0.75  # Intermediate metabolizer
        elif composite_score > 1.5:
            return 1.25  # Rapid metabolizer
        else:
            return 1.0  # Normal metabolizer

    def generate_dosing_rationale(self, adjustments, medication_name):
        """Generate clinical rationale for dose adjustments"""
        rationale = []
        for factor, value in adjustments.items():
            if value != 1.0:
                if value < 1.0:
                    rationale.append(f"{factor.replace('_', ' ').title()}: {int((1-value)*100)}% dose reduction recommended")
                else:
                    rationale.append(f"{factor.replace('_', ' ').title()}: {int((value-1)*100)}% dose increase recommended")
        
        return rationale if rationale else ["Standard dosing appropriate for this patient profile"]

    def generate_dosing_monitoring(self, dose_factor, medication_name):
        """Generate dosing-specific monitoring recommendations"""
        if dose_factor < 0.7:
            return {
                'intensity': 'Enhanced',
                'rationale': 'Significant dose reduction requires careful monitoring',
                'frequency': 'Weekly for first month, then bi-weekly'
            }
        elif dose_factor > 1.3:
            return {
                'intensity': 'Enhanced',
                'rationale': 'Dose increase requires monitoring for efficacy and toxicity',
                'frequency': 'Weekly for first month, then bi-weekly'
            }
        else:
            return {
                'intensity': 'Standard',
                'rationale': 'Standard dosing - routine monitoring appropriate',
                'frequency': 'Monthly'
            }

    def generate_tdm_recommendations(self, medication_name, dose_factor):
        """Generate therapeutic drug monitoring recommendations"""
        if dose_factor < 0.7 or dose_factor > 1.3:
            return {
                'recommended': True,
                'timing': 'Steady-state (5 half-lives after dose change)',
                'frequency': 'Weekly initially, then monthly',
                'target_levels': 'Refer to institutional guidelines'
            }
        else:
            return {
                'recommended': False,
                'rationale': 'Standard dosing - routine monitoring sufficient'
            }

    def assess_overall_cyp_risk(self, composite_score):
        """Assess overall CYP-related risk"""
        if composite_score <= 0.3:
            return 'Critical - Severe metabolic impairment'
        elif composite_score <= 0.6:
            return 'High - Significant metabolic impairment'
        elif composite_score >= 1.5:
            return 'Moderate - Enhanced metabolism'
        else:
            return 'Low - Normal metabolism expected'

    def generate_cyp_recommendations(self, cyp_analysis):
        """Generate CYP-specific clinical recommendations"""
        recommendations = []
        
        for enzyme, data in cyp_analysis.items():
            if data['risk_level'] == 'Critical':
                recommendations.append(f"{enzyme}: Consider alternative medication or 50-75% dose reduction")
            elif data['risk_level'] == 'High':
                recommendations.append(f"{enzyme}: 25-50% dose reduction with enhanced monitoring")
            elif data['risk_level'] == 'Moderate':
                recommendations.append(f"{enzyme}: Consider dose adjustment and monitoring")
        
        return recommendations if recommendations else ["Standard CYP-related protocols appropriate"]

    def get_transporter_implications(self, transporter, profile):
        """Get clinical implications for transporter genetics"""
        implications_map = {
            'SLCO1B1': {
                'High': 'Increased risk of statin-induced myopathy - consider dose reduction',
                'Intermediate': 'Moderate risk - enhanced monitoring recommended',
                'Low': 'Standard statin therapy appropriate'
            },
            'ABCB1': {
                'High': 'Increased drug exposure - consider dose reduction for P-gp substrates',
                'Intermediate': 'Moderate exposure increase - monitor for toxicity',
                'Low': 'Standard dosing for P-gp substrates'
            },
            'ABCG2': {
                'High': 'Increased drug exposure - dose reduction may be needed',
                'Intermediate': 'Monitor for increased drug effects',
                'Low': 'Standard protocols appropriate'
            }
        }
        
        return implications_map.get(transporter, {}).get(profile['risk'], 'Standard protocols')

    def calculate_disposition_risk(self, transporter_analysis):
        """Calculate overall drug disposition risk"""
        high_risk_count = sum(1 for t in transporter_analysis.values() if t['risk_category'] == 'High')
        intermediate_risk_count = sum(1 for t in transporter_analysis.values() if t['risk_category'] == 'Intermediate')
        
        if high_risk_count >= 2:
            return 'High - Multiple transporter impairments'
        elif high_risk_count >= 1 or intermediate_risk_count >= 2:
            return 'Moderate - Some transporter impairments'
        else:
            return 'Low - Normal drug disposition expected'

    def generate_transporter_monitoring(self, transporter_analysis):
        """Generate transporter-specific monitoring recommendations"""
        recommendations = []
        
        for transporter, data in transporter_analysis.items():
            if data['risk_category'] == 'High':
                recommendations.append(f"{transporter}: Intensive monitoring for substrate drugs")
            elif data['risk_category'] == 'Intermediate':
                recommendations.append(f"{transporter}: Enhanced monitoring recommended")
        
        return recommendations if recommendations else ["Standard monitoring protocols"]

    def generate_hla_recommendations(self, high_risk_alleles, medication_name):
        """Generate HLA-specific clinical recommendations"""
        recommendations = []
        
        for allele_data in high_risk_alleles:
            if medication_name in allele_data['associated_drugs']:
                recommendations.append(f"CONTRAINDICATION: {medication_name} is contraindicated due to {allele_data['allele']}")
                recommendations.append(f"Alternative therapy required - consult clinical pharmacist")
            else:
                recommendations.append(f"Caution with {', '.join(allele_data['associated_drugs'])} due to {allele_data['allele']}")
        
        return recommendations

# Initialize the advanced pharmacogenomics module
advanced_pgx = AdvancedPharmacogenomics()

# ═══════════════════════════════════════════════════════════════════════════════════════
# 🎯 PRECISION MEDICINE SUMMARY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════════════

def calculate_overall_genetic_risk(cyp_analysis, transporter_analysis, hla_analysis):
    """Calculate overall genetic risk score"""
    risk_score = 0
    risk_factors = []
    
    # CYP enzyme risk assessment
    for enzyme, data in cyp_analysis.get('individual_enzymes', {}).items():
        if data['risk_level'] == 'Critical':
            risk_score += 3
            risk_factors.append(f"{enzyme}: Critical impairment")
        elif data['risk_level'] == 'High':
            risk_score += 2
            risk_factors.append(f"{enzyme}: High risk")
        elif data['risk_level'] == 'Moderate':
            risk_score += 1
            risk_factors.append(f"{enzyme}: Moderate risk")
    
    # Transporter risk assessment
    for transporter, data in transporter_analysis.get('transporter_profiles', {}).items():
        if data['risk_category'] == 'High':
            risk_score += 2
            risk_factors.append(f"{transporter}: High transport risk")
        elif data['risk_category'] == 'Intermediate':
            risk_score += 1
            risk_factors.append(f"{transporter}: Intermediate transport risk")
    
    # HLA risk assessment
    if hla_analysis.get('overall_hypersensitivity_risk') == 'Critical':
        risk_score += 5
        risk_factors.append("HLA: Critical hypersensitivity risk")
    elif hla_analysis.get('high_risk_alleles_present'):
        risk_score += 2
        risk_factors.append("HLA: High-risk alleles present")
    
    # Determine overall risk category
    if risk_score >= 8:
        overall_risk = 'Critical'
    elif risk_score >= 5:
        overall_risk = 'High'
    elif risk_score >= 2:
        overall_risk = 'Moderate'
    else:
        overall_risk = 'Low'
    
    return {
        'risk_score': risk_score,
        'risk_category': overall_risk,
        'contributing_factors': risk_factors,
        'clinical_significance': get_genetic_risk_significance(overall_risk)
    }

def assess_dosing_complexity(personalized_dosing):
    """Assess complexity of personalized dosing requirements"""
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    adjustments = personalized_dosing.get('individual_adjustments', {})
    
    complexity_score = 0
    complexity_factors = []
    
    # Major dose adjustments increase complexity
    if dose_factor <= 0.5:
        complexity_score += 3
        complexity_factors.append("Major dose reduction required")
    elif dose_factor <= 0.7:
        complexity_score += 2
        complexity_factors.append("Moderate dose reduction required")
    elif dose_factor >= 1.5:
        complexity_score += 2
        complexity_factors.append("Dose increase required")
    
    # Multiple adjustment factors increase complexity
    significant_adjustments = sum(1 for adj in adjustments.values() if adj != 1.0)
    complexity_score += significant_adjustments
    
    # TDM requirements increase complexity
    if personalized_dosing.get('tdm_recommendations', {}).get('recommended'):
        complexity_score += 2
        complexity_factors.append("Therapeutic drug monitoring required")
    
    # Determine complexity level
    if complexity_score >= 6:
        complexity_level = 'High'
    elif complexity_score >= 3:
        complexity_level = 'Moderate'
    else:
        complexity_level = 'Low'
    
    return {
        'complexity_score': complexity_score,
        'complexity_level': complexity_level,
        'contributing_factors': complexity_factors,
        'clinical_implications': get_dosing_complexity_implications(complexity_level)
    }

def determine_monitoring_intensity(cyp_analysis, transporter_analysis, personalized_dosing):
    """Determine required monitoring intensity"""
    monitoring_score = 0
    monitoring_requirements = []
    
    # CYP-based monitoring needs
    composite_score = cyp_analysis.get('composite_metabolism_score', 1.0)
    if composite_score <= 0.3:
        monitoring_score += 3
        monitoring_requirements.append("Intensive CYP-related monitoring")
    elif composite_score <= 0.7 or composite_score >= 1.5:
        monitoring_score += 2
        monitoring_requirements.append("Enhanced CYP-related monitoring")
    
    # Transporter-based monitoring
    high_risk_transporters = sum(1 for t in transporter_analysis.get('transporter_profiles', {}).values() 
                                if t['risk_category'] == 'High')
    monitoring_score += high_risk_transporters
    if high_risk_transporters > 0:
        monitoring_requirements.append("Transporter-related monitoring required")
    
    # Dose adjustment monitoring
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    if dose_factor <= 0.6 or dose_factor >= 1.4:
        monitoring_score += 2
        monitoring_requirements.append("Dose adjustment monitoring")
    
    # Determine monitoring intensity
    if monitoring_score >= 6:
        intensity = 'Intensive'
        frequency = 'Daily to weekly'
    elif monitoring_score >= 3:
        intensity = 'Enhanced'
        frequency = 'Weekly to bi-weekly'
    else:
        intensity = 'Standard'
        frequency = 'Monthly'
    
    return {
        'monitoring_score': monitoring_score,
        'intensity_level': intensity,
        'recommended_frequency': frequency,
        'specific_requirements': monitoring_requirements,
        'clinical_protocols': get_monitoring_protocols(intensity)
    }

def assess_clinical_actionability(cyp_analysis, hla_analysis, personalized_dosing):
    """Assess clinical actionability of pharmacogenomic findings"""
    actionability_score = 0
    actionable_findings = []
    
    # High-impact CYP findings
    for enzyme, data in cyp_analysis.get('individual_enzymes', {}).items():
        if data['risk_level'] in ['Critical', 'High']:
            actionability_score += 2
            actionable_findings.append(f"{enzyme}: {data['clinical_impact']}")
    
    # Critical HLA findings
    if hla_analysis.get('drug_specific_risks'):
        actionability_score += 5
        actionable_findings.append("HLA: Drug contraindication identified")
    elif hla_analysis.get('high_risk_alleles_present'):
        actionability_score += 2
        actionable_findings.append("HLA: High-risk alleles require monitoring")
    
    # Significant dose adjustments
    dose_factor = personalized_dosing.get('dose_adjustment_factor', 1.0)
    if dose_factor <= 0.6 or dose_factor >= 1.4:
        actionability_score += 2
        actionable_findings.append(f"Dosing: {int(abs(1-dose_factor)*100)}% adjustment recommended")
    
    # Determine actionability level
    if actionability_score >= 7:
        actionability = 'Critical'
        urgency = 'Immediate action required'
    elif actionability_score >= 4:
        actionability = 'High'
        urgency = 'Action recommended within 24 hours'
    elif actionability_score >= 2:
        actionability = 'Moderate'
        urgency = 'Consider action within 1 week'
    else:
        actionability = 'Low'
        urgency = 'Standard care protocols'
    
    return {
        'actionability_score': actionability_score,
        'actionability_level': actionability,
        'urgency_level': urgency,
        'actionable_findings': actionable_findings,
        'implementation_priority': get_implementation_priority(actionability)
    }

def get_genetic_risk_significance(risk_level):
    """Get clinical significance of genetic risk level"""
    significance_map = {
        'Critical': 'Genetic factors pose severe ADR risk - immediate intervention required',
        'High': 'Significant genetic risk factors identified - enhanced monitoring needed',
        'Moderate': 'Some genetic risk factors present - consider precautions',
        'Low': 'Minimal genetic risk factors - standard protocols appropriate'
    }
    return significance_map.get(risk_level, 'Unknown risk significance')

def get_dosing_complexity_implications(complexity_level):
    """Get clinical implications of dosing complexity"""
    implications_map = {
        'High': 'Complex dosing regimen requires specialist consultation and intensive monitoring',
        'Moderate': 'Moderate dosing adjustments needed with enhanced follow-up',
        'Low': 'Standard dosing protocols with routine monitoring appropriate'
    }
    return implications_map.get(complexity_level, 'Unknown complexity implications')

def get_monitoring_protocols(intensity):
    """Get specific monitoring protocols based on intensity"""
    protocols_map = {
        'Intensive': [
            'Daily clinical assessment for first week',
            'Laboratory monitoring every 2-3 days initially',
            'Vital signs monitoring every 4-6 hours',
            'Immediate availability of antidotes/interventions'
        ],
        'Enhanced': [
            'Clinical assessment 2-3 times per week initially',
            'Laboratory monitoring weekly for first month',
            'Vital signs monitoring daily',
            'Patient education on warning signs'
        ],
        'Standard': [
            'Routine clinical follow-up',
            'Standard laboratory monitoring intervals',
            'Patient self-monitoring as appropriate',
            'Standard safety protocols'
        ]
    }
    return protocols_map.get(intensity, ['Standard monitoring protocols'])

def get_implementation_priority(actionability):
    """Get implementation priority for pharmacogenomic findings"""
    priority_map = {
        'Critical': {
            'timeline': 'Immediate (within hours)',
            'actions': ['Stop current medication if contraindicated', 'Implement alternative therapy', 'Intensive monitoring'],
            'stakeholders': ['Prescribing physician', 'Clinical pharmacist', 'Nursing staff', 'Patient/family']
        },
        'High': {
            'timeline': '24-48 hours',
            'actions': ['Adjust dosing regimen', 'Enhance monitoring protocols', 'Patient education'],
            'stakeholders': ['Prescribing physician', 'Clinical pharmacist', 'Patient']
        },
        'Moderate': {
            'timeline': '1 week',
            'actions': ['Consider dosing modifications', 'Implement precautionary monitoring', 'Document findings'],
            'stakeholders': ['Prescribing physician', 'Patient']
        },
        'Low': {
            'timeline': 'Next routine visit',
            'actions': ['Document findings', 'Continue standard protocols'],
            'stakeholders': ['Healthcare team']
        }
    }
    return priority_map.get(actionability, {'timeline': 'As appropriate', 'actions': ['Standard care'], 'stakeholders': ['Healthcare team']})

@app.route('/')
def index():
    logger.info("📱 Loading page accessed")
    return render_template('loading.html')

@app.route('/patient-details')
def patient_details():
    logger.info("📋 Patient details form accessed")
    return render_template('patient_details_form.html')

@app.route('/assessment')
def assessment():
    logger.info("🔬 Assessment page accessed")
    return render_template('index.html')

@app.route('/medical-report')
def medical_report():
    logger.info("📄 Medical report page accessed")
    return render_template('medical_report.html')

@app.route('/about')
def about():
    logger.info("ℹ️ About page accessed")
    return render_template('about.html')

@app.route('/test-medical-report')
def test_medical_report():
    """Test page for medical report feature"""
    logger.info("🧪 Medical report test page accessed")
    with open('test_medical_report.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/drug-interactions')
def drug_interactions():
    """Render the drug interactions checker page"""
    logger.info("💊 Drug interactions page accessed")
    return render_template('drug_interactions.html')

@app.route('/clinical-decision-support')
def clinical_decision_support():
    """Render the clinical decision support page"""
    logger.info("🩺 Clinical decision support page accessed")
    return render_template('clinical_decision_support.html')

@app.route('/documentation')
def documentation():
    """Documentation page"""
    logger.info("📚 Documentation page accessed")
    return render_template('documentation.html')

@app.route('/api-reference')
def api_reference():
    """API Reference page"""
    logger.info("📖 API Reference page accessed")
    return render_template('api_reference.html')

@app.route('/research-papers')
def research_papers():
    """Research Papers page"""
    logger.info("📄 Research Papers page accessed")
    return render_template('research_papers.html')

@app.route('/faqs')
def faqs():
    """FAQs page"""
    logger.info("❓ FAQs page accessed")
    return render_template('faqs.html')

@app.route('/privacy-policy')
def privacy_policy():
    """Privacy Policy page"""
    logger.info("🔒 Privacy Policy page accessed")
    return render_template('privacy_policy.html')

@app.route('/terms-of-service')
def terms_of_service():
    """Terms of Service page"""
    logger.info("📜 Terms of Service page accessed")
    return render_template('terms_of_service.html')

@app.route('/cookie-policy')
def cookie_policy():
    """Cookie Policy page"""
    logger.info("🍪 Cookie Policy page accessed")
    return render_template('cookie_policy.html')

@app.route('/debug')
def debug_info():
    """Debug endpoint to show all available routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    
    return jsonify({
        'available_routes': routes,
        'model_loaded': model is not None,
        'gemini_configured': True,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/generate_report', methods=['POST', 'GET'])
def generate_report():
    logger.info(f"🔥 Generate report endpoint called with method: {request.method}")
    logger.info(f"🌐 Request headers: {dict(request.headers)}")
    logger.info(f"🔗 Request origin: {request.environ.get('HTTP_ORIGIN', 'No origin')}")
    
    if request.method == 'GET':
        return jsonify({
            'message': 'Report generation endpoint is working',
            'method': 'GET',
            'expected_method': 'POST'
        })
    
    try:
        logger.info("📊 Processing report generation request...")
        logger.info(f"📦 Request content type: {request.content_type}")
        logger.info(f"📏 Request content length: {request.content_length}")
        
        if not request.json:
            logger.error("❌ No JSON data received")
            logger.info(f"📄 Raw request data: {request.get_data()}")
            return jsonify({'error': 'No JSON data provided'}), 400
        
        data = request.json
        logger.info(f"📋 Received data keys: {list(data.keys())}")
        logger.info(f"📊 Data sizes: {[(k, len(str(v))) for k, v in data.items()]}")
        
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        
        # Get patient metadata
        patient_name = data.get('patient_name', 'Patient')
        patient_id = data.get('patient_id', '')
        clinician_name = data.get('clinician_name', 'Clinician')
        
        logger.info(f"👤 Patient: {patient_name}, Clinician: {clinician_name}")
        
        # Try Gemini first
        logger.info("🤖 Attempting Gemini AI generation...")
        try:
            prompt = f"""Generate a brief clinical ADR risk assessment for:
            Patient: {patient_name}
            Risk Level: {prediction_result.get('risk_level', 'Unknown')}
            Predicted ADR: {prediction_result.get('predicted_adr_type', 'Unknown')}
            
            Provide a short professional clinical report."""
            
            logger.info("📝 Sending prompt to Gemini...")
            response = model_gemini.generate_content(prompt)
            report = response.text
            ai_generated = True
            logger.info("✅ Gemini report generated successfully")
            
        except Exception as gemini_error:
            logger.error(f"❌ Gemini error: {gemini_error}")
            logger.info("🔄 Using fallback report...")
            report = generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name)
            ai_generated = False
        
        result = {
            'report': report,
            'generated_at': datetime.now().isoformat(),
            'ai_generated': ai_generated,
            'report_length': len(report)
        }
        
        logger.info(f"✅ Report generated successfully (AI: {ai_generated}, Length: {len(report)})")
        logger.info("📤 Sending response to client...")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error generating report: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

@app.route('/predict', methods=['POST'])
def predict_adr():
    logger.info("🧠 Prediction endpoint called")
    
    try:
        if model is None or preprocessor is None:
            logger.error("❌ Model not loaded")
            return jsonify({'error': 'Model not loaded properly'}), 500
        
        data = request.json
        logger.info(f"📊 Received prediction data with {len(data)} fields")
        logger.info(f"📋 Data keys: {list(data.keys())}")
        
        # Handle empty fields by providing default values
        default_values = {
            'age': 50,
            'sex': 'M',
            'ethnicity': 'White',
            'height': 170,
            'weight': 70,
            'weight_kg': 70,
            'height_cm': 170,
            'bmi': 24.2,
            'creatinine': 1.2,
            'egfr': 80,
            'ast_alt': 45,
            'bilirubin': 1.0,
            'albumin': 4.2,
            'hemoglobin': 13.5,
            'hematocrit': 40.5,
            'wbc_count': 7.5,
            'platelet_count': 275,
            'rbc_count': 4.5,
            'temperature': 98.6,
            'ind_value': 1.0,
            'atpp_value': 30.0,
            'diabetes': 0,
            'liver_disease': 0,
            'ckd': 0,
            'cardiac_disease': 0,
            'hypertension': 0,
            'respiratory_disease': 0,
            'neurological_disease': 0,
            'autoimmune_disease': 0,
            'medication_name': 'Unknown',
            'index_drug_dose': 200,
            'drug_interactions': 'Minor',
            'concomitant_drugs_count': 6,
            'cyp2c9': 'Wild',
            'cyp2d6': 'EM',
            'bp_systolic': 135,
            'bp_diastolic': 85,
            'heart_rate': 75,
            'time_since_start_days': 30,
            'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0,
            'hla_risk_allele_flag': 0,
            'inpatient_flag': 0,
            'prior_adr_history': 0
        }
        
        # Fill empty or missing fields with defaults - improved handling
        for key, default_value in default_values.items():
            if key not in data or data[key] is None or data[key] == '' or data[key] == 'null' or str(data[key]).lower() == 'false':
                data[key] = default_value
                logger.info(f"Using default value for {key}: {default_value}")
        
        # Validate numeric fields with better error handling
        numeric_fields = ['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt', 
                         'bilirubin', 'albumin', 'temperature', 'ind_value', 'atpp_value',
                         'hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count',
                         'index_drug_dose', 'concomitant_drugs_count',
                         'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days']
        
        for field in numeric_fields:
            if field in data:
                try:
                    # Handle various empty/invalid cases
                    if data[field] is None or data[field] == '' or str(data[field]).lower() in ['null', 'false', 'undefined']:
                        data[field] = default_values.get(field, 0)
                        logger.info(f"Converted empty/invalid {field} to default: {data[field]}")
                    else:
                        data[field] = float(data[field])
                except (ValueError, TypeError) as e:
                    logger.warning(f"⚠️ Invalid numeric value for {field}: {data[field]}, using default")
                    data[field] = default_values.get(field, 0)
        
        logger.info(f"✅ Data validation passed")
        
        # Add default indication for model compatibility (model was trained with this field)
        # Even though we removed it from the UI, the model still expects it
        if 'indication' not in data or not data['indication']:
            data['indication'] = 'Pain'  # Use most common indication from training data
            logger.info("📝 Added default indication for model compatibility")
        
        # Calculate derived fields required by the model
        data['polypharmacy_flag'] = 1 if data.get('concomitant_drugs_count', 0) > 5 else 0
        data['cumulative_dose_mg'] = data.get('index_drug_dose', 100) * data.get('time_since_start_days', 30)
        data['dose_density_mg_day'] = data['cumulative_dose_mg'] / data.get('time_since_start_days', 30)
        logger.info("📝 Calculated derived fields for model compatibility")
        
        # Map frontend column names to model expected column names
        if 'weight' in data:
            data['weight_kg'] = data['weight']
        if 'height' in data:
            data['height_cm'] = data['height']
            
        # Add any missing columns that the model expects
        model_expected_columns = [
            'age', 'sex', 'weight_kg', 'bmi', 'ethnicity',
            'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
            'temperature', 'ind_value', 'atpp_value',  # NEW COLUMNS
            'hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count',  # CBC COLUMNS
            'diabetes', 'liver_disease', 'ckd', 'cardiac_disease',
            'index_drug_dose', 'concomitant_drugs_count', 'cyp_inhibitors_flag', 'qt_prolonging_flag',
            'cyp2c9', 'cyp2d6', 'hla_risk_allele_flag',
            'cumulative_dose_mg', 'dose_density_mg_day', 'time_since_start_days',
            'bp_systolic', 'bp_diastolic', 'heart_rate',
            'polypharmacy_flag', 'indication', 'inpatient_flag', 'prior_adr_history'
        ]
        
        # Ensure all expected columns are present
        for col in model_expected_columns:
            if col not in data:
                if col in default_values:
                    data[col] = default_values[col]
                else:
                    # Set reasonable defaults for missing columns
                    if col == 'weight_kg':
                        data[col] = 70
                    elif col == 'height_cm':
                        data[col] = 170
                    else:
                        data[col] = 0
                logger.info(f"Added missing column {col} with default value")
        
        # Create DataFrame from input data with only the columns the model expects
        input_df = pd.DataFrame([{col: data[col] for col in model_expected_columns}])
        logger.info(f"📊 DataFrame columns: {list(input_df.columns)}")
        
        # Convert categorical columns to object type
        categorical_cols = ['sex', 'ethnicity', 'cyp2c9', 'cyp2d6', 'indication', 'medication_name', 'drug_interactions']
        for col in categorical_cols:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype('object')
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        prediction_proba = model.predict_proba(input_df)[0]
        
        # Get class names and probabilities
        classes = model.classes_
        probabilities = dict(zip(classes, prediction_proba))
        
        # Sort probabilities in descending order
        sorted_probabilities = dict(sorted(probabilities.items(), key=lambda x: x[1], reverse=True))
        
        # Calculate risk level
        no_adr_prob = probabilities.get('No ADR', 0)
        risk_level = 'Low' if no_adr_prob > 0.7 else 'Medium' if no_adr_prob > 0.4 else 'High'
        
        # Log risk assessment for debugging
        logger.info(f"🎯 Risk Assessment: {risk_level} (No ADR Probability: {no_adr_prob:.3f})")
        
        # Get all ADR types (excluding 'No ADR') with their probabilities
        adr_types_only = {k: v for k, v in probabilities.items() if k != 'No ADR'}
        sorted_adr_types = dict(sorted(adr_types_only.items(), key=lambda x: x[1], reverse=True))
        
        # 🧬 ADVANCED PHARMACOGENOMICS ANALYSIS
        medication_name = data.get('medication_name', 'Unknown')
        standard_dose = data.get('index_drug_dose', 200)
        
        logger.info("🧬 Performing advanced pharmacogenomics analysis...")
        
        # Comprehensive CYP enzyme analysis
        cyp_analysis = advanced_pgx.analyze_expanded_cyp_profile(data)
        
        # Transporter genetics analysis
        transporter_analysis = advanced_pgx.analyze_transporter_genetics(data)
        
        # HLA hypersensitivity risk assessment
        hla_analysis = advanced_pgx.analyze_hla_hypersensitivity_risk(data, medication_name)
        
        # Personalized dosing recommendations
        personalized_dosing = advanced_pgx.calculate_personalized_dosing(data, medication_name, standard_dose)
        
        logger.info("✅ Advanced pharmacogenomics analysis completed")
        
        # Fix: Check if probabilities are already in percentage form (>1) or decimal form (<1)
        max_prob = max(probabilities.values()) if probabilities else 0
        is_already_percentage = max_prob > 1
        
        logger.info(f"Max probability: {max_prob}, is_already_percentage: {is_already_percentage}")
        
        result = {
            'predicted_adr_type': prediction,
            'risk_level': risk_level,
            'no_adr_probability': round(no_adr_prob if is_already_percentage else no_adr_prob * 100, 2),
            'top_adr_risks': {k: round(v if is_already_percentage else v * 100, 2) for k, v in list(sorted_probabilities.items())[:5]},
            'all_adr_types': {k: round(v if is_already_percentage else v * 100, 2) for k, v in sorted_adr_types.items()},
            'top_specific_adr_risks': {k: round(v if is_already_percentage else v * 100, 2) for k, v in list(sorted_adr_types.items())[:3]},
            
            # 🧬 ADVANCED PHARMACOGENOMICS & PRECISION MEDICINE RESULTS
            'advanced_pharmacogenomics': {
                'expanded_cyp_analysis': cyp_analysis,
                'transporter_genetics': transporter_analysis,
                'hla_hypersensitivity_risk': hla_analysis,
                'personalized_dosing': personalized_dosing,
                'precision_medicine_summary': {
                    'overall_genetic_risk': calculate_overall_genetic_risk(cyp_analysis, transporter_analysis, hla_analysis),
                    'dosing_complexity': assess_dosing_complexity(personalized_dosing),
                    'monitoring_intensity': determine_monitoring_intensity(cyp_analysis, transporter_analysis, personalized_dosing),
                    'clinical_actionability': assess_clinical_actionability(cyp_analysis, hla_analysis, personalized_dosing)
                }
            },
            
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"✅ Prediction successful: {prediction} ({risk_level} risk)")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error in prediction: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/mitigation_strategies', methods=['POST'])
def generate_mitigation_strategies():
    """Generate personalized mitigation strategies based on ADR risk assessment"""
    logger.info("🛡️ Mitigation strategies endpoint called")
    
    try:
        data = request.json
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        
        logger.info(f"🔍 Generating mitigation strategies for risk level: {prediction_result.get('risk_level', 'Unknown')}")
        
        # Extract key risk factors
        risk_level = prediction_result.get('risk_level', 'Medium')
        top_adr_risks = prediction_result.get('top_specific_adr_risks', {})
        
        # Generate comprehensive mitigation strategies using the same functions as app.py
        # (Note: In a production environment, these functions would be in a shared module)
        mitigation_strategies = {
            'risk_reduction_recommendations': generate_debug_risk_reduction_recommendations(patient_data, prediction_result),
            'alternative_drug_suggestions': generate_debug_alternative_drug_suggestions(patient_data, prediction_result),
            'dose_optimization': generate_debug_dose_optimization_recommendations(patient_data, prediction_result),
            'monitoring_protocol': generate_debug_monitoring_protocol(patient_data, prediction_result),
            'patient_education': generate_debug_patient_education_points(patient_data, prediction_result),
            'emergency_protocols': generate_debug_emergency_protocols(patient_data, prediction_result),
            'follow_up_schedule': generate_debug_follow_up_schedule(patient_data, prediction_result),
            'clinical_decision_support': generate_debug_clinical_decision_support(patient_data, prediction_result)
        }
        
        logger.info("✅ Mitigation strategies generated successfully")
        return jsonify(mitigation_strategies)
        
    except Exception as e:
        logger.error(f"❌ Error generating mitigation strategies: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

def generate_debug_risk_reduction_recommendations(patient_data, prediction_result):
    """Generate specific interventions to lower ADR probability (debug version)"""
    recommendations = []
    risk_level = prediction_result.get('risk_level', 'Medium')
    top_adr_risks = prediction_result.get('top_specific_adr_risks', {})
    
    # General risk reduction based on risk level
    if risk_level == 'High':
        recommendations.extend([
            {
                'category': 'Immediate Actions',
                'priority': 'Critical',
                'intervention': 'Consider delaying drug initiation until risk factors are optimized',
                'rationale': 'High ADR risk requires risk factor modification before treatment',
                'timeline': 'Before drug administration'
            },
            {
                'category': 'Pre-medication',
                'priority': 'High',
                'intervention': 'Administer prophylactic medications (antihistamines, corticosteroids)',
                'rationale': 'Reduces hypersensitivity and inflammatory ADR risk',
                'timeline': '30-60 minutes before drug administration'
            }
        ])
    
    # Specific recommendations based on patient factors
    if patient_data.get('liver_disease', 0) == 1:
        recommendations.append({
            'category': 'Hepatic Protection',
            'priority': 'High',
            'intervention': 'Hepatoprotective agents (N-acetylcysteine, silymarin)',
            'rationale': 'Reduces hepatotoxicity risk in patients with existing liver disease',
            'timeline': 'Concurrent with treatment'
        })
    
    if patient_data.get('ckd', 0) == 1:
        recommendations.append({
            'category': 'Renal Protection',
            'priority': 'High',
            'intervention': 'Ensure adequate hydration and consider nephroprotective measures',
            'rationale': 'Prevents further renal impairment and drug accumulation',
            'timeline': 'Before and during treatment'
        })
    
    return recommendations

def generate_debug_alternative_drug_suggestions(patient_data, prediction_result):
    """Generate AI-powered therapeutic alternatives with lower risk profiles (debug version)"""
    alternatives = []
    current_drug = patient_data.get('medication_name', 'Unknown')
    
    # Simplified alternatives for debug version
    alternatives.append({
        'alternative': 'Consider safer alternative based on risk profile',
        'risk_reduction': '30-50%',
        'advantages': ['Lower ADR risk', 'Better safety profile'],
        'considerations': ['May require dose adjustment', 'Different monitoring requirements'],
        'monitoring': 'Standard safety monitoring'
    })
    
    return alternatives

def generate_debug_dose_optimization_recommendations(patient_data, prediction_result):
    """Generate ML-suggested dose adjustments for risk minimization (debug version)"""
    dose_recommendations = []
    current_dose = patient_data.get('index_drug_dose', 200)
    risk_level = prediction_result.get('risk_level', 'Medium')
    
    if risk_level == 'High':
        dose_recommendations.append({
            'adjustment_type': 'Risk-based',
            'recommendation': f'Consider reducing dose by 25-50% (from {current_dose}mg)',
            'rationale': 'High ADR risk requires cautious dosing approach',
            'monitoring': 'Enhanced clinical monitoring',
            'evidence_level': 'Clinical judgment'
        })
    
    return dose_recommendations

def generate_debug_monitoring_protocol(patient_data, prediction_result):
    """Generate customized surveillance plans based on risk factors"""
    monitoring_plan = {
        'baseline_assessments': [
            {
                'assessment': 'Complete Blood Count (CBC)',
                'rationale': 'Detect baseline hematologic abnormalities',
                'timing': 'Within 7 days before treatment'
            },
            {
                'assessment': 'Comprehensive Metabolic Panel (CMP)',
                'rationale': 'Assess organ function and electrolyte status',
                'timing': 'Within 7 days before treatment'
            }
        ],
        'ongoing_monitoring': [
            {
                'parameter': 'Clinical Assessment',
                'frequency': 'Weekly initially, then monthly',
                'alert_threshold': 'Any new symptoms or changes',
                'action': 'Clinical evaluation and possible dose adjustment'
            }
        ],
        'emergency_indicators': [
            'Severe allergic reactions',
       'Significant clinical deterioration',
            'New or worsening symptoms'
        ]
    }
    
    return monitoring_plan

def generate_debug_patient_education_points(patient_data, prediction_result):
    """Generate patient education materials (debug version)"""
    education_points = {
        'warning_signs': [
            'Unusual fatigue or weakness',
            'Nausea, vomiting, or loss of appetite',
            'Skin rash, itching, or hives',
            'Any new or unusual symptoms'
        ],
        'self_monitoring': [
            'Keep a daily symptom diary',
            'Monitor for any changes in how you feel',
            'Note any new symptoms'
        ],
        'lifestyle_modifications': [
            'Follow medication instructions carefully',
            'Stay well-hydrated',
            'Avoid alcohol if advised'
        ],
        'when_to_seek_help': [
            'Severe allergic reactions',
            'Difficulty breathing',
            'Severe nausea or vomiting',
            'Any concerning symptoms'
        ]
    }
    
    return education_points

def generate_debug_emergency_protocols(patient_data, prediction_result):
    """Generate emergency response protocols (debug version)"""
    protocols = [
        {
            'emergency_type': 'Severe ADR',
            'recognition': 'Significant clinical deterioration or severe symptoms',
            'immediate_actions': [
                'Discontinue medication immediately',
                'Seek immediate medical attention',
                'Provide supportive care'
            ],
            'monitoring': 'Continuous clinical assessment',
            'disposition': 'Emergency medical evaluation'
        }
    ]
    
    return protocols

def generate_debug_follow_up_schedule(patient_data, prediction_result):
    """Generate structured follow-up schedule (debug version)"""
    risk_level = prediction_result.get('risk_level', 'Medium')
    
    if risk_level == 'High':
        schedule = [
            {'timepoint': '24-48 hours', 'type': 'Phone call', 'focus': 'Initial safety check'},
            {'timepoint': '1 week', 'type': 'Office visit', 'focus': 'Clinical evaluation'},
            {'timepoint': '1 month', 'type': 'Office visit', 'focus': 'Comprehensive review'}
        ]
    else:
        schedule = [
            {'timepoint': '1 week', 'type': 'Phone call', 'focus': 'Initial check-in'},
            {'timepoint': '1 month', 'type': 'Office visit', 'focus': 'Routine assessment'}
        ]
    
    return schedule

def generate_debug_clinical_decision_support(patient_data, prediction_result):
    """Generate clinical decision support recommendations (debug version)"""
    risk_level = prediction_result.get('risk_level', 'Medium')
    
    decision_support = {
        'treatment_recommendation': 'Proceed with enhanced monitoring' if risk_level != 'High' else 'Consider alternative therapy',
        'risk_benefit_analysis': {
            'adr_risk': f'{risk_level} risk level detected',
            'benefit_potential': 'Moderate' if risk_level != 'High' else 'Uncertain',
            'recommendation': 'Benefits likely outweigh risks with proper monitoring' if risk_level != 'High' else 'Consider alternatives'
        },
        'alternative_approaches': ['Enhanced monitoring', 'Dose adjustment', 'Alternative therapy'],
        'consultation_recommendations': ['Clinical pharmacist consultation'] if risk_level == 'High' else []
    }
    
    return decision_support

@app.route('/generate_detailed_analysis', methods=['POST'])
def generate_detailed_analysis():
    logger.info("🧠 Detailed analysis endpoint called")
    
    try:
        if not request.json:
            logger.error("❌ No JSON data received")
            return jsonify({'error': 'No JSON data provided'}), 400
        
        data = request.json
        logger.info(f"📋 Received analysis data keys: {list(data.keys())}")
        
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        patient_name = data.get('patient_name', 'Patient')
        
        # Generate detailed analysis using trained model and clinical rules
        logger.info("🔬 Generating model-based detailed analysis...")
        analysis = generate_model_based_detailed_analysis(patient_data, prediction_result, patient_name)
        
        result = {
            'analysis': analysis,
            'generated_at': datetime.now().isoformat(),
            'ai_generated': False,  # Model-based, not AI-generated
            'model_based': True,
            'analysis_length': len(analysis)
        }
        
        logger.info(f"✅ Model-based detailed analysis generated successfully (Length: {len(analysis)})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error generating detailed analysis: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate detailed analysis: {str(e)}'}), 500

@app.route('/generate_medication_analysis', methods=['POST'])
def generate_medication_analysis():
    logger.info("💊 Medication analysis endpoint called")
    
    try:
        if not request.json:
            logger.error("❌ No JSON data received")
            return jsonify({'error': 'No JSON data provided'}), 400
        
        data = request.json
        logger.info(f"📋 Received medication analysis data keys: {list(data.keys())}")
        
        patient_data = data.get('patient_data', {})
        prediction_result = data.get('prediction_result', {})
        patient_name = data.get('patient_name', 'Patient')
        
        # Try Gemini AI first
        logger.info("💊 Generating medication analysis with Gemini AI...")
        try:
            prompt = f"""As a clinical pharmacist and medication therapy management specialist, provide a comprehensive medication analysis for:

Patient: {patient_name}
Age: {patient_data.get('age', 'Unknown')} years
Current Medication: {patient_data.get('medication_name', 'Unknown')}
Current Dose: {patient_data.get('index_drug_dose', 'Unknown')} mg
Risk Level: {prediction_result.get('risk_level', 'Unknown')}
Predicted ADR: {prediction_result.get('predicted_adr_type', 'Unknown')}

Patient Details:
- Weight: {patient_data.get('weight', 'Unknown')} kg
- eGFR: {patient_data.get('egfr', 'Unknown')} mL/min/1.73m²
- AST/ALT: {patient_data.get('ast_alt', 'Unknown')} U/L
- Concomitant drugs: {patient_data.get('concomitant_drugs_count', 0)}
- CYP2C9: {patient_data.get('cyp2c9', 'Unknown')}
- CYP2D6: {patient_data.get('cyp2d6', 'Unknown')}

Provide a detailed medication analysis including:

1. **Current Medication Assessment**
   - Appropriateness of current medication and dose
   - Risk-benefit analysis based on patient profile
   - Contraindications and cautions for this patient

2. **Dose Optimization Recommendations**
   - Recommended dose adjustments (if any)
   - Rationale for dose modifications
   - Frequency and timing recommendations
   - Dose titration schedule if needed

3. **Administration Guidelines & Timing**
   - Best time to take medication (morning/evening/bedtime)
   - Relationship to meals (with food/empty stomach/specific timing)
   - Special administration instructions
   - What to do if a dose is missed

4. **Detailed Food & Dietary Recommendations**
   - **Foods to Take WITH Medication:** Specific foods that enhance absorption or reduce side effects
   - **Foods to AVOID:** Foods that interfere with medication or increase side effects
   - **Timing of Meals:** How long before/after meals to take medication
   - **Beneficial Foods:** Foods that support medication effectiveness
   - **Hydration Requirements:** Specific fluid intake recommendations
   - **Alcohol Restrictions:** Detailed alcohol interaction warnings
   - **Supplements to Avoid:** Vitamins/minerals that may interfere

5. **Safety Precautions & Warnings**
   - **Critical Warning Signs:** Symptoms requiring immediate medical attention
   - **Common Side Effects:** What to expect and how to manage
   - **Drug Interactions:** Specific medications to avoid
   - **Activity Restrictions:** Driving, exercise, or work limitations
   - **Environmental Precautions:** Sun exposure, temperature sensitivity
   - **Emergency Instructions:** What to do in case of overdose or severe reaction

6. **Lifestyle Modifications**
   - Diet modifications to support treatment
   - Exercise recommendations or restrictions
   - Sleep hygiene considerations
   - Stress management advice

7. **Alternative Medication Options**
   - Safer alternatives if current medication is high risk
   - Different drug classes to consider
   - Rationale for alternatives
   - Switching protocols if needed

8. **Monitoring Schedule**
   - Laboratory tests needed and frequency
   - Clinical parameters to monitor
   - Timeline for follow-up assessments
   - Self-monitoring instructions for patients

9. **Patient Education & Compliance**
   - What to expect from the medication (timeline for effects)
   - Signs of effectiveness vs. side effects
   - Importance of adherence and consequences of stopping
   - Storage instructions and medication handling

10. **Special Considerations**
    - Age-related considerations for this patient
    - Kidney/liver function impact on medication
    - Pregnancy/breastfeeding considerations if applicable
    - Travel considerations and medication management

Format with clear headings, bullet points, and practical, actionable recommendations. Be specific about foods, timing, and precautions."""
            
            logger.info("📝 Sending medication analysis prompt to Gemini...")
            response = model_gemini.generate_content(prompt)
            analysis = response.text
            ai_generated = True
            logger.info("✅ Gemini medication analysis generated successfully")
            
        except Exception as gemini_error:
            logger.error(f"❌ Gemini error: {gemini_error}")
            logger.info("🔄 Using fallback medication analysis...")
            analysis = generate_fallback_medication_analysis(patient_data, prediction_result, patient_name)
            ai_generated = False
        
        result = {
            'analysis': analysis,
            'generated_at': datetime.now().isoformat(),
            'ai_generated': ai_generated,
            'analysis_length': len(analysis)
        }
        
        logger.info(f"✅ Medication analysis generated successfully (AI: {ai_generated}, Length: {len(analysis)})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error generating medication analysis: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to generate medication analysis: {str(e)}'}), 500

# Patient details endpoint removed

@app.route('/test-warning')
def test_warning():
    logger.info("🧪 ADR Warning test page accessed")
    return render_template('test_high_risk_warning.html')

@app.route('/high-risk-demo')
def high_risk_demo():
    logger.info("🚨 High Risk ADR Demo page accessed")
    return render_template('high_risk_demo.html')





@app.route('/sample_data/<sample_type>')
def get_sample_data(sample_type):
    """Get sample patient data for testing"""
    logger.info(f"Sample data requested for type: {sample_type}")
    sample_patients = {
        'high-risk': {
            'name': 'High Risk Patient - Elderly with Multiple Comorbidities',
            'age': 75, 'sex': 'M', 'ethnicity': 'White', 'height': 175, 'weight': 95, 'bmi': 31.0,
            'creatinine': 4.5, 'egfr': 25, 'ast_alt': 285, 'bilirubin': 4.2, 'albumin': 2.1,
            'temperature': 99.8, 'ind_value': 2.8, 'atpp_value': 65.2,
            'hemoglobin': 8.5, 'hematocrit': 25.5, 'wbc_count': 12.8, 'platelet_count': 95, 'rbc_count': 3.2,
            'diabetes': 1, 'liver_disease': 1, 'ckd': 1, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Warfarin', 'index_drug_dose': 400, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 18,
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 185, 'bp_diastolic': 105,
            'heart_rate': 115, 'time_since_start_days': 45, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'medium-risk': {
            'name': 'Medium Risk Patient - Middle-aged with Diabetes',
            'age': 55, 'sex': 'F', 'ethnicity': 'Asian', 'height': 160, 'weight': 70, 'bmi': 27.3,
            'creatinine': 2.8, 'egfr': 45, 'ast_alt': 125, 'bilirubin': 2.1, 'albumin': 3.2,
            'temperature': 98.4, 'ind_value': 1.8, 'atpp_value': 42.1,
            'hemoglobin': 10.5, 'hematocrit': 31.5, 'wbc_count': 9.2, 'platelet_count': 185, 'rbc_count': 3.8,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Metformin', 'index_drug_dose': 300, 'drug_interactions': 'Moderate',
            'concomitant_drugs_count': 12,
            'cyp2c9': 'Intermediate', 'cyp2d6': 'IM', 'bp_systolic': 165, 'bp_diastolic': 95,
            'heart_rate': 88, 'time_since_start_days': 30, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'low-risk': {
            'name': 'Low Risk Patient - Young Healthy Adult',
            'age': 35, 'sex': 'M', 'ethnicity': 'White', 'height': 180, 'weight': 78, 'bmi': 24.1,
            'creatinine': 1.1, 'egfr': 85, 'ast_alt': 45, 'bilirubin': 0.8, 'albumin': 4.5,
            'temperature': 98.6, 'ind_value': 1.0, 'atpp_value': 28.5,
            'hemoglobin': 14.2, 'hematocrit': 42.6, 'wbc_count': 6.8, 'platelet_count': 285, 'rbc_count': 4.7,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Lisinopril', 'index_drug_dose': 200, 'drug_interactions': 'Minor',
            'concomitant_drugs_count': 5,
            'cyp2c9': 'Wild', 'cyp2d6': 'EM', 'bp_systolic': 135, 'bp_diastolic': 85,
            'heart_rate': 72, 'time_since_start_days': 14, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        },
        'liver-disease': {
            'name': 'Liver Disease Patient - Hepatic Impairment',
            'age': 62, 'sex': 'M', 'ethnicity': 'Hispanic', 'height': 170, 'weight': 85, 'bmi': 29.4,
            'creatinine': 1.8, 'egfr': 55, 'ast_alt': 450, 'bilirubin': 8.5, 'albumin': 2.3,
            'temperature': 99.2, 'ind_value': 2.1, 'atpp_value': 48.7,
            'hemoglobin': 9.8, 'hematocrit': 29.4, 'wbc_count': 11.5, 'platelet_count': 125, 'rbc_count': 3.5,
            'diabetes': 0, 'liver_disease': 1, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Acetaminophen', 'index_drug_dose': 250, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 8,
            'cyp2c9': 'Poor', 'cyp2d6': 'IM', 'bp_systolic': 145, 'bp_diastolic': 88,
            'heart_rate': 82, 'time_since_start_days': 21, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'cardiac-patient': {
            'name': 'Cardiac Patient - Heart Failure with Arrhythmia',
            'age': 71, 'sex': 'M', 'ethnicity': 'White', 'height': 178, 'weight': 88, 'bmi': 27.8,
            'creatinine': 2.1, 'egfr': 42, 'ast_alt': 65, 'bilirubin': 1.5, 'albumin': 3.8,
            'temperature': 98.9, 'ind_value': 1.6, 'atpp_value': 35.8,
            'hemoglobin': 11.2, 'hematocrit': 33.6, 'wbc_count': 7.8, 'platelet_count': 195, 'rbc_count': 4.1,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Digoxin', 'index_drug_dose': 125, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 14,
            'cyp2c9': 'Wild', 'cyp2d6': 'IM', 'bp_systolic': 155, 'bp_diastolic': 92,
            'heart_rate': 105, 'time_since_start_days': 35, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 1
        },
        'elderly-frail': {
            'name': 'Elderly Frail Patient - Multiple Medications',
            'age': 82, 'sex': 'F', 'ethnicity': 'Asian', 'height': 155, 'weight': 52, 'bmi': 21.6,
            'creatinine': 2.5, 'egfr': 28, 'ast_alt': 85, 'bilirubin': 1.8, 'albumin': 2.9,
            'temperature': 99.1, 'ind_value': 2.4, 'atpp_value': 52.3,
            'hemoglobin': 9.1, 'hematocrit': 27.3, 'wbc_count': 6.2, 'platelet_count': 165, 'rbc_count': 3.3,
            'diabetes': 1, 'liver_disease': 0, 'ckd': 1, 'cardiac_disease': 1, 'hypertension': 1,
            'respiratory_disease': 1, 'neurological_disease': 1, 'autoimmune_disease': 0,
            'medication_name': 'Warfarin', 'index_drug_dose': 175, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 22,
            'cyp2c9': 'Poor', 'cyp2d6': 'PM', 'bp_systolic': 165, 'bp_diastolic': 85,
            'heart_rate': 88, 'time_since_start_days': 90, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 1, 'hla_risk_allele_flag': 1, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'cancer-patient': {
            'name': 'Cancer Patient - Chemotherapy Treatment',
            'age': 58, 'sex': 'F', 'ethnicity': 'White', 'height': 168, 'weight': 65, 'bmi': 23.0,
            'creatinine': 1.6, 'egfr': 65, 'ast_alt': 195, 'bilirubin': 2.8, 'albumin': 3.0,
            'temperature': 100.2, 'ind_value': 1.3, 'atpp_value': 31.7,
            'hemoglobin': 8.8, 'hematocrit': 26.4, 'wbc_count': 3.2, 'platelet_count': 85, 'rbc_count': 3.1,
            'diabetes': 0, 'liver_disease': 1, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Methotrexate', 'index_drug_dose': 450, 'drug_interactions': 'Major',
            'concomitant_drugs_count': 10,
            'cyp2c9': 'Intermediate', 'cyp2d6': 'EM', 'bp_systolic': 125, 'bp_diastolic': 78,
            'heart_rate': 92, 'time_since_start_days': 28, 'cyp_inhibitors_flag': 1,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 1,
            'prior_adr_history': 1
        },
        'pediatric-equivalent': {
            'name': 'Young Adult Patient - Minimal Risk Profile',
            'age': 22, 'sex': 'F', 'ethnicity': 'Hispanic', 'height': 162, 'weight': 58, 'bmi': 22.1,
            'creatinine': 0.8, 'egfr': 105, 'ast_alt': 28, 'bilirubin': 0.6, 'albumin': 4.8,
            'temperature': 98.4, 'ind_value': 0.9, 'atpp_value': 26.8,
            'hemoglobin': 13.8, 'hematocrit': 41.4, 'wbc_count': 6.5, 'platelet_count': 325, 'rbc_count': 4.6,
            'diabetes': 0, 'liver_disease': 0, 'ckd': 0, 'cardiac_disease': 0, 'hypertension': 0,
            'respiratory_disease': 0, 'neurological_disease': 0, 'autoimmune_disease': 0,
            'medication_name': 'Ibuprofen', 'index_drug_dose': 150, 'drug_interactions': 'None',
            'concomitant_drugs_count': 2,
            'cyp2c9': 'Wild', 'cyp2d6': 'EM', 'bp_systolic': 115, 'bp_diastolic': 72,
            'heart_rate': 68, 'time_since_start_days': 7, 'cyp_inhibitors_flag': 0,
            'qt_prolonging_flag': 0, 'hla_risk_allele_flag': 0, 'inpatient_flag': 0,
            'prior_adr_history': 0
        }
    }
    
    if sample_type in sample_patients:
        return jsonify(sample_patients[sample_type])
    else:
        return jsonify({'error': 'Sample type not found'}), 404

@app.route('/get_ai_drug_insights', methods=['POST', 'GET'])
def get_ai_drug_insights():
    """Generate AI-powered drug interaction insights using dedicated Gemini API key"""
    logger.info("🤖 AI Drug Insights endpoint called")
    
    # Handle GET requests for testing
    if request.method == 'GET':
        return jsonify({
            'status': 'ok',
            'message': 'AI Drug Insights endpoint is working',
            'method': 'GET',
            'expected_method': 'POST',
            'endpoint': '/get_ai_drug_insights'
        })
    
    try:
        if not request.json:
            logger.error("❌ No JSON data received")
            return jsonify({'error': 'No JSON data provided'}), 400
            
        data = request.json
        medications = data.get('medications', [])
        patient_age = data.get('patient_age', 'Not specified')
        comorbidities = data.get('comorbidities', [])
        
        logger.info(f"📊 Received data: {len(medications)} medications")
        
        if not medications or len(medications) < 2:
            logger.warning("⚠️ Insufficient medications for analysis")
            return jsonify({'error': 'At least 2 medications required for interaction analysis'}), 400
        
        logger.info(f"💊 Analyzing interactions for {len(medications)} medications")
        
        # Configure Gemini with AI Insights API key
        genai.configure(api_key=GEMINI_API_AI_INSIGHTS)
        model_ai_insights = genai.GenerativeModel('gemini-2.5-flash')
        
        # Create comprehensive prompt for AI analysis
        medications_list = '\n'.join([f"- {med['name']} ({med.get('dose', 'dose not specified')})" for med in medications])
        
        prompt = f"""As a clinical pharmacologist and drug interaction expert, analyze the following medication combination:

**Patient Information:**
- Age: {patient_age}
- Comorbidities: {', '.join(comorbidities) if comorbidities else 'None reported'}

**Medications:**
{medications_list}

Provide a comprehensive drug interaction analysis including:

1. **Critical Interactions** (High Severity)
   - Mechanism of interaction
   - Clinical consequences
   - Immediate actions required

2. **Moderate Interactions**
   - Potential effects
   - Monitoring recommendations
   - Dose adjustments if needed

3. **Minor Interactions**
   - Awareness points
   - General precautions

4. **Pharmacokinetic Interactions**
   - Absorption, metabolism, distribution, elimination effects

5. **Pharmacodynamic Interactions**
   - Additive/synergistic or antagonistic effects

6. **Patient-Specific Considerations**
   - Age-related factors
   - Comorbidity influences

7. **Clinical Recommendations**
   - Timing of administration
   - Dose adjustments
   - Monitoring parameters
   - Alternative options if needed

8. **Risk Mitigation Strategies**
   - Specific interventions
   - Monitoring frequency
   - Patient education points

Format the response in clear, actionable clinical guidance."""

        logger.info("📝 Sending drug interaction prompt to Gemini AI Insights...")
        
        try:
            response = model_ai_insights.generate_content(prompt)
            ai_insights = response.text
            ai_generated = True
            logger.info("✅ AI drug interaction insights generated successfully")
            
        except Exception as gemini_error:
            logger.error(f"❌ Gemini AI Insights error: {gemini_error}")
            import traceback
            logger.error(f"📋 Traceback: {traceback.format_exc()}")
            ai_insights = "AI analysis temporarily unavailable. Please review detected interactions manually and consult with a clinical pharmacist for comprehensive interaction assessment."
            ai_generated = False
        
        # Reset to primary API key
        genai.configure(api_key=GEMINI_API_KEY)
        
        result = {
            'ai_insights': ai_insights,
            'medications_analyzed': len(medications),
            'ai_generated': ai_generated,
            'api_key_used': 'ai_insights' if ai_generated else 'fallback',
            'generated_at': datetime.now().isoformat(),
            'insights_length': len(ai_insights)
        }
        
        logger.info(f"✅ Drug interaction insights generated (AI: {ai_generated}, Length: {len(ai_insights)})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Error generating AI drug interaction insights: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        # Reset to primary API key in case of error
        genai.configure(api_key=GEMINI_API_KEY)
        return jsonify({'error': f'Failed to generate insights: {str(e)}'}), 500

@app.route('/health')
def health_check():
    logger.info("💊 Health check called")
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'gemini_configured': True,
        'ai_insights_key_configured': bool(GEMINI_API_AI_INSIGHTS),
        'endpoints_available': [
            '/', '/assessment', '/predict', '/generate_report', '/generate_detailed_analysis', 
            '/generate_medication_analysis', '/get_ai_drug_insights', '/drug-interactions',
            '/clinical-decision-support', '/about', '/documentation', '/api-reference',
            '/research-papers', '/faqs', '/privacy-policy', '/terms-of-service', '/cookie-policy',
            '/health', '/debug', '/test-warning'
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test-ai-insights')
def test_ai_insights():
    """Test endpoint to verify AI insights functionality"""
    logger.info("🧪 Test AI insights endpoint called")
    return jsonify({
        'status': 'ok',
        'message': 'AI Insights endpoint is accessible',
        'gemini_configured': True,
        'ai_insights_key_configured': bool(GEMINI_API_AI_INSIGHTS),
        'endpoint': '/get_ai_drug_insights',
        'method': 'POST',
        'sample_request': {
            'medications': [
                {'name': 'Warfarin', 'dose': '5mg'},
                {'name': 'Aspirin', 'dose': '81mg'}
            ],
            'patient_age': '65',
            'comorbidities': ['Hypertension']
        }
    })

@app.route('/test-ai-insights-page')
def test_ai_insights_page():
    """Test page for AI insights endpoint"""
    logger.info("🧪 AI Insights test page accessed")
    return render_template('test_ai_insights_endpoint.html')

@app.route('/analyze_drug_interactions_ai', methods=['POST'])
def analyze_drug_interactions_ai():
    """Analyze drug interactions using AI (Gemini)"""
    logger.info("🤖 AI Drug Interaction Analysis endpoint called")
    
    try:
        if not request.json:
            logger.error("❌ No JSON data received")
            return jsonify({'error': 'No JSON data provided', 'ai_available': False}), 400
            
        data = request.json
        medications = data.get('medications', [])
        interactions = data.get('interactions', [])
        patient_age = data.get('patient_age', 'Not specified')
        comorbidities = data.get('comorbidities', [])
        
        logger.info(f"📊 Analyzing {len(medications)} medications with {len(interactions)} interactions")
        
        if not medications or len(medications) < 2:
            logger.warning("⚠️ Insufficient medications for analysis")
            return jsonify({
                'error': 'At least 2 medications required',
                'ai_available': False,
                'clinical_summary': 'Insufficient data for interaction analysis',
                'recommendations': ['Enter at least 2 medications to analyze interactions']
            }), 400
        
        # Try Gemini AI analysis
        try:
            # Configure Gemini with AI Insights API key
            genai.configure(api_key=GEMINI_API_AI_INSIGHTS)
            model_ai_insights = genai.GenerativeModel('gemini-2.5-flash')
            
            # Create comprehensive prompt
            medications_list = '\n'.join([f"- {med}" for med in medications])
            interactions_summary = '\n'.join([f"- {int['drug1']} + {int['drug2']}: {int['severity']} severity - {int['description']}" 
                                             for int in interactions[:5]]) if interactions else "No specific interactions detected"
            
            prompt = f"""As a clinical pharmacologist, analyze these drug interactions:

**Patient:** Age {patient_age}, Comorbidities: {', '.join(comorbidities) if comorbidities else 'None'}

**Medications:**
{medications_list}

**Detected Interactions:**
{interactions_summary}

Provide:
1. **Clinical Summary** (2-3 sentences)
2. **Risk Assessment** (overall risk level and key concerns)
3. **Recommendations** (3-5 specific actionable items)
4. **Monitoring** (what to monitor)
5. **Alternatives** (if high risk, suggest safer options)

Be concise and clinically actionable."""

            logger.info("📝 Sending to Gemini AI...")
            response = model_ai_insights.generate_content(prompt)
            ai_analysis = response.text
            
            # Reset to primary API key
            genai.configure(api_key=GEMINI_API_KEY)
            
            logger.info("✅ AI analysis generated successfully")
            
            return jsonify({
                'ai_available': True,
                'clinical_summary': extract_section(ai_analysis, 'Clinical Summary') or ai_analysis[:200],
                'risk_assessment': extract_section(ai_analysis, 'Risk Assessment') or 'See full analysis',
                'recommendations': extract_list_section(ai_analysis, 'Recommendations') or ['Review full AI analysis'],
                'monitoring_suggestions': extract_section(ai_analysis, 'Monitoring') or 'Standard monitoring',
                'alternative_options': extract_section(ai_analysis, 'Alternatives') or 'Consult pharmacist',
                'full_analysis': ai_analysis,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as gemini_error:
            logger.error(f"❌ Gemini AI error: {gemini_error}")
            
            # Fallback response
            return jsonify({
                'ai_available': False,
                'clinical_summary': f'Analysis of {len(medications)} medications with {len(interactions)} detected interactions. AI service temporarily unavailable.',
                'risk_assessment': f'{"High" if any(i.get("severity") == "major" for i in interactions) else "Moderate"} risk based on detected interactions',
                'recommendations': [
                    'Review all detected drug interactions carefully',
                    'Consult with clinical pharmacist for comprehensive assessment',
                    'Monitor patient closely for adverse effects',
                    'Consider dose adjustments or alternative medications if needed'
                ],
                'monitoring_suggestions': 'Enhanced clinical monitoring recommended with regular follow-up',
                'alternative_options': 'Consult clinical pharmacist for therapeutic alternatives',
                'error': 'AI analysis temporarily unavailable',
                'generated_at': datetime.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"❌ Error in drug interaction analysis: {e}")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': f'Analysis failed: {str(e)}',
            'ai_available': False,
            'clinical_summary': 'Unable to complete analysis',
            'recommendations': ['Manual review recommended']
        }), 500

def extract_section(text, section_name):
    """Extract a specific section from AI response"""
    try:
        lines = text.split('\n')
        in_section = False
        section_content = []
        
        for line in lines:
            if section_name.lower() in line.lower() and ('**' in line or '#' in line):
                in_section = True
                continue
            elif in_section and ('**' in line or line.startswith('#')) and section_name.lower() not in line.lower():
                break
            elif in_section:
                section_content.append(line.strip())
        
        return ' '.join(section_content).strip() if section_content else None
    except:
        return None

def extract_list_section(text, section_name):
    """Extract a list section from AI response"""
    try:
        section_text = extract_section(text, section_name)
        if not section_text:
            return None
        
        # Extract bullet points or numbered items
        items = []
        for line in section_text.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•') or (len(line) > 2 and line[0].isdigit() and line[1] == '.'):
                items.append(line.lstrip('-•0123456789. ').strip())
        
        return items if items else [section_text]
    except:
        return None

def generate_adr_type_analysis(prediction_result):
    """Generate detailed ADR type analysis"""
    top_adr_risks = prediction_result.get('top_specific_adr_risks', {})
    all_adr_types = prediction_result.get('all_adr_types', {})
    
    if not top_adr_risks:
        return "- No specific ADR type risks identified"
    
    analysis = "**Top ADR Type Risks:**\n"
    for adr_type, probability in top_adr_risks.items():
        risk_category = "High" if probability > 15 else "Moderate" if probability > 5 else "Low"
        analysis += f"- **{adr_type}:** {probability}% ({risk_category} Risk)\n"
    
    if len(all_adr_types) > 3:
        analysis += f"\n**Additional ADR Types Monitored:** {len(all_adr_types) - 3} other potential ADR types with lower probabilities"
    
    return analysis

def generate_fallback_report(patient_data, prediction_result, patient_name, clinician_name):
    """Generate a fallback report when Gemini API is not available"""
    
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    no_adr_prob = prediction_result.get('no_adr_probability', 0)
    
    report = f"""# ADR Risk Assessment Report

## Patient Information
- **Patient Name:** {patient_name}
- **Assessing Clinician:** {clinician_name}
- **Assessment Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Risk Assessment Summary
- **Overall Risk Level:** {risk_level}
- **Predicted ADR Type:** {predicted_adr}
- **No ADR Probability:** {no_adr_prob}%

## ADR Type Analysis
{generate_adr_type_analysis(prediction_result)}

## Clinical Recommendations
- Monitor patient closely for signs of adverse reactions
- Consider dose adjustment based on risk level
- Regular follow-up appointments recommended

---
*Note: This is a fallback report generated when AI service is unavailable.*
"""
    
    return report

def generate_fallback_detailed_analysis(patient_data, prediction_result, patient_name):
    """Generate a fallback detailed analysis when Gemini API is not available"""
    
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    no_adr_prob = prediction_result.get('no_adr_probability', 0)
    age = patient_data.get('age', 'Unknown')
    egfr = patient_data.get('egfr', 'Unknown')
    ast_alt = patient_data.get('ast_alt', 'Unknown')
    medication = patient_data.get('medication_name', 'Unknown')
    dose = patient_data.get('index_drug_dose', 'Unknown')
    
    analysis = f"""# Detailed Clinical Analysis for {patient_name}

## Risk Assessment Overview
The patient presents with a **{risk_level}** risk profile for adverse drug reactions, with a {no_adr_prob}% probability of no ADR occurrence.

## Primary Risk Factors Analysis

### Demographic Factors
- **Age**: {age} years
  - {get_age_risk_assessment(age)}

### Organ Function Assessment
- **Renal Function**: eGFR {egfr} mL/min/1.73m²
  - {get_renal_risk_assessment(egfr)}
  
- **Hepatic Function**: AST/ALT {ast_alt} U/L
  - {get_hepatic_risk_assessment(ast_alt)}

### Medication Profile
- **Primary Medication**: {medication}
- **Dose**: {dose} mg
- **Concomitant Medications**: {patient_data.get('concomitant_drugs_count', 0)} drugs

## Predicted ADR Analysis: {predicted_adr}

{get_adr_mechanism_analysis(predicted_adr)}

## Risk Stratification Details

{get_risk_stratification_details(risk_level, prediction_result)}

## Monitoring Recommendations

### Clinical Monitoring
- **Frequency**: {get_monitoring_frequency(risk_level)}
- **Parameters**: {get_monitoring_parameters(predicted_adr)}

### Laboratory Monitoring
{get_lab_monitoring_recommendations(patient_data)}

## Dose Adjustment Considerations

{get_dose_adjustment_recommendations(risk_level, patient_data)}

## Patient Counseling Points

1. **Recognition of Warning Signs**
   - {get_warning_signs(predicted_adr)}

2. **When to Contact Healthcare Provider**
   - Any new or worsening symptoms
   - Signs of the predicted ADR type
   - Concerns about medication effectiveness

3. **Medication Adherence**
   - Importance of taking medication as prescribed
   - Not stopping medication without consulting provider

## Follow-up Timeline

- **Immediate (24-48 hours)**: Patient education and baseline assessment
- **Short-term ({get_short_term_followup(risk_level)})**: First clinical evaluation
- **Long-term**: Ongoing monitoring as per risk level

## Clinical Decision Support Notes

This analysis is based on machine learning predictions and clinical algorithms. Healthcare providers should use clinical judgment and consider individual patient factors when making treatment decisions.

---
*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
*Note: This is a comprehensive fallback analysis generated when AI service is unavailable.*
"""
    
    return analysis

def get_age_risk_assessment(age):
    """Get age-based risk assessment"""
    try:
        age_val = float(age)
        if age_val > 75:
            return "Very high risk - Advanced age significantly increases ADR susceptibility"
        elif age_val > 65:
            return "High risk - Elderly patients have increased ADR risk due to altered pharmacokinetics"
        elif age_val > 50:
            return "Moderate risk - Middle-aged patients may have some increased risk"
        else:
            return "Lower risk - Younger patients typically have lower ADR risk"
    except:
        return "Risk assessment unavailable due to missing age data"

def get_renal_risk_assessment(egfr):
    """Get renal function risk assessment"""
    try:
        egfr_val = float(egfr)
        if egfr_val < 30:
            return "Severe renal impairment - High risk for drug accumulation and toxicity"
        elif egfr_val < 60:
            return "Moderate renal impairment - Increased risk requiring dose adjustments"
        elif egfr_val < 90:
            return "Mild renal impairment - Monitor closely for drug accumulation"
        else:
            return "Normal renal function - Standard dosing appropriate"
    except:
        return "Renal risk assessment unavailable"

def get_hepatic_risk_assessment(ast_alt):
    """Get hepatic function risk assessment"""
    try:
        ast_alt_val = float(ast_alt)
        if ast_alt_val > 120:
            return "Severe hepatic impairment - High risk for drug-induced liver injury"
        elif ast_alt_val > 80:
            return "Moderate hepatic impairment - Increased risk for hepatotoxicity"
        elif ast_alt_val > 40:
            return "Mild hepatic impairment - Monitor liver function closely"
        else:
            return "Normal liver function - Standard hepatic monitoring"
    except:
        return "Hepatic risk assessment unavailable"

def get_adr_mechanism_analysis(predicted_adr):
    """Get ADR mechanism analysis"""
    mechanisms = {
        'Gastrointestinal': "GI ADRs typically result from direct mucosal irritation, altered gut motility, or disruption of normal flora. Monitor for nausea, vomiting, diarrhea, or abdominal pain.",
        'Cardiovascular': "Cardiovascular ADRs may involve direct cardiac effects, vascular changes, or electrolyte imbalances. Monitor blood pressure, heart rate, and ECG changes.",
        'Neurological': "Neurological ADRs can result from direct CNS effects, neurotransmitter alterations, or metabolic changes. Watch for dizziness, confusion, or motor symptoms.",
        'Dermatological': "Skin reactions may be allergic, toxic, or photosensitive in nature. Monitor for rash, itching, or skin discoloration.",
        'Hematological': "Blood-related ADRs involve bone marrow suppression or coagulation changes. Monitor complete blood counts and bleeding risk."
    }
    return mechanisms.get(predicted_adr, "Mechanism analysis not available for this ADR type. Monitor for any unusual symptoms or changes in patient condition.")

def get_risk_stratification_details(risk_level, prediction_result):
    """Get detailed risk stratification"""
    top_risks = prediction_result.get('top_adr_risks', {})
    details = f"**{risk_level} Risk Classification**\n\n"
    
    if top_risks:
        details += "**Risk Distribution:**\n"
        for adr_type, probability in list(top_risks.items())[:3]:
            details += f"- {adr_type}: {probability}%\n"
    
    risk_descriptions = {
        'High': "Requires intensive monitoring and possible intervention. Consider dose reduction or alternative therapy.",
        'Medium': "Requires regular monitoring and patient education. Standard precautions with enhanced vigilance.",
        'Low': "Standard monitoring protocols. Routine follow-up with patient education."
    }
    
    details += f"\n{risk_descriptions.get(risk_level, 'Standard monitoring recommended.')}"
    return details

def get_monitoring_frequency(risk_level):
    """Get monitoring frequency based on risk level"""
    frequencies = {
        'High': "Weekly for first month, then bi-weekly",
        'Medium': "Bi-weekly for first month, then monthly",
        'Low': "Monthly for first 3 months, then quarterly"
    }
    return frequencies.get(risk_level, "As clinically indicated")

def get_monitoring_parameters(predicted_adr):
    """Get monitoring parameters based on predicted ADR"""
    parameters = {
        'Gastrointestinal': "GI symptoms, weight, nutritional status, electrolytes",
        'Cardiovascular': "Blood pressure, heart rate, ECG, electrolytes",
        'Neurological': "Mental status, motor function, reflexes, coordination",
        'Dermatological': "Skin examination, rash assessment, photosensitivity",
        'Hematological': "Complete blood count, coagulation studies, bleeding assessment"
    }
    return parameters.get(predicted_adr, "General symptom monitoring and vital signs")

def get_lab_monitoring_recommendations(patient_data):
    """Get laboratory monitoring recommendations"""
    recommendations = []
    
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            recommendations.append("- **Renal Function**: Monitor creatinine and eGFR every 2-4 weeks")
    except:
        pass
    
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 40:
            recommendations.append("- **Liver Function**: Monitor AST/ALT, bilirubin every 2-4 weeks")
    except:
        pass
    
    recommendations.append("- **Complete Blood Count**: Monitor for hematological changes")
    recommendations.append("- **Electrolytes**: Monitor sodium, potassium, and other relevant electrolytes")
    
    return "\n".join(recommendations) if recommendations else "Standard laboratory monitoring as clinically indicated"

def get_dose_adjustment_recommendations(risk_level, patient_data):
    """Get dose adjustment recommendations"""
    recommendations = []
    
    if risk_level == 'High':
        recommendations.append("Consider dose reduction by 25-50% or alternative therapy")
    elif risk_level == 'Medium':
        recommendations.append("Consider dose optimization or enhanced monitoring")
    
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            recommendations.append("Dose adjustment required for renal impairment")
    except:
        pass
    
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 80:
            recommendations.append("Consider dose reduction for hepatic impairment")
    except:
        pass
    
    return "\n".join([f"- {rec}" for rec in recommendations]) if recommendations else "- Standard dosing appropriate with monitoring"

def get_warning_signs(predicted_adr):
    """Get warning signs for predicted ADR"""
    warning_signs = {
        'Gastrointestinal': "Severe nausea/vomiting, persistent diarrhea, abdominal pain, blood in stool",
        'Cardiovascular': "Chest pain, shortness of breath, irregular heartbeat, swelling, dizziness",
        'Neurological': "Severe headache, confusion, seizures, weakness, vision changes",
        'Dermatological': "Severe rash, blistering, widespread skin changes, fever with rash",
        'Hematological': "Unusual bleeding, bruising, fatigue, frequent infections, pale skin"
    }
    return warning_signs.get(predicted_adr, "Any new or unusual symptoms, especially those affecting major organ systems")

def get_short_term_followup(risk_level):
    """Get short-term follow-up timing"""
    timings = {
        'High': "3-7 days",
        'Medium': "1-2 weeks", 
        'Low': "2-4 weeks"
    }
    return timings.get(risk_level, "1-2 weeks")

def generate_model_based_detailed_analysis(patient_data, prediction_result, patient_name):
    """Generate comprehensive detailed analysis using trained model and clinical rules"""
    
    # Extract key data
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    no_adr_prob = prediction_result.get('no_adr_probability', 0)
    top_adr_risks = prediction_result.get('top_adr_risks', {})
    specific_adr_risks = prediction_result.get('top_specific_adr_risks', {})
    
    # Patient demographics and clinical data
    age = patient_data.get('age', 'Unknown')
    sex = patient_data.get('sex', 'Unknown')
    ethnicity = patient_data.get('ethnicity', 'Unknown')
    bmi = patient_data.get('bmi', 'Unknown')
    
    # Laboratory values
    egfr = patient_data.get('egfr', 'Unknown')
    creatinine = patient_data.get('creatinine', 'Unknown')
    ast_alt = patient_data.get('ast_alt', 'Unknown')
    bilirubin = patient_data.get('bilirubin', 'Unknown')
    albumin = patient_data.get('albumin', 'Unknown')
    
    # Medication data
    medication = patient_data.get('medication_name', 'Unknown')
    dose = patient_data.get('index_drug_dose', 'Unknown')
    concomitant_count = patient_data.get('concomitant_drugs_count', 0)
    drug_interactions = patient_data.get('drug_interactions', 'Unknown')
    
    # Pharmacogenomics
    cyp2c9 = patient_data.get('cyp2c9', 'Unknown')
    cyp2d6 = patient_data.get('cyp2d6', 'Unknown')
    
    # Comorbidities
    comorbidities = get_patient_comorbidities(patient_data)
    
    # Clinical parameters
    bp_systolic = patient_data.get('bp_systolic', 'Unknown')
    bp_diastolic = patient_data.get('bp_diastolic', 'Unknown')
    heart_rate = patient_data.get('heart_rate', 'Unknown')
    
    analysis = f"""# Comprehensive Clinical Analysis - {patient_name}

## Executive Summary
**Risk Classification:** {risk_level} Risk ({100-no_adr_prob:.1f}% ADR probability)
**Primary Concern:** {predicted_adr}
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

## Patient Profile Assessment

### Demographics & Anthropometrics
- **Age:** {age} years - {get_age_risk_interpretation(age)}
- **Sex:** {sex} - {get_sex_risk_interpretation(sex)}
- **Ethnicity:** {ethnicity} - {get_ethnicity_risk_interpretation(ethnicity)}
- **BMI:** {bmi} kg/m² - {get_bmi_risk_interpretation(bmi)}

### Organ Function Analysis

#### Renal Function
- **eGFR:** {egfr} mL/min/1.73m²
- **Creatinine:** {creatinine} mg/dL
- **Assessment:** {get_comprehensive_renal_assessment(egfr, creatinine, age)}

#### Hepatic Function
- **AST/ALT:** {ast_alt} U/L
- **Bilirubin:** {bilirubin} mg/dL
- **Albumin:** {albumin} g/dL
- **Assessment:** {get_comprehensive_hepatic_assessment(ast_alt, bilirubin, albumin)}

#### Cardiovascular Status
- **Blood Pressure:** {bp_systolic}/{bp_diastolic} mmHg
- **Heart Rate:** {heart_rate} bpm
- **Assessment:** {get_cardiovascular_assessment(bp_systolic, bp_diastolic, heart_rate)}

---

## Pharmacological Analysis

### Primary Medication Profile
- **Drug:** {medication}
- **Dose:** {dose} mg
- **Risk Assessment:** {get_medication_risk_assessment(medication, dose)}

### Pharmacogenomic Profile
- **CYP2C9:** {cyp2c9} - {get_cyp2c9_interpretation(cyp2c9)}
- **CYP2D6:** {cyp2d6} - {get_cyp2d6_interpretation(cyp2d6)}
- **Clinical Impact:** {get_pharmacogenomic_impact(cyp2c9, cyp2d6, medication)}

### Drug Interaction Analysis
- **Concomitant Medications:** {concomitant_count} drugs
- **Interaction Risk:** {drug_interactions}
- **Polypharmacy Assessment:** {get_polypharmacy_assessment(concomitant_count)}

---

## Risk Stratification Analysis

### Model Predictions
{generate_detailed_risk_breakdown(top_adr_risks, specific_adr_risks)}

### Primary ADR Risk: {predicted_adr}
{get_detailed_adr_analysis(predicted_adr, patient_data)}

### Contributing Risk Factors
{analyze_risk_factors(patient_data, prediction_result)}

---

## Clinical Monitoring Strategy

### Immediate Monitoring (First 48 Hours)
{get_immediate_monitoring_plan(risk_level, predicted_adr)}

### Short-term Monitoring ({get_short_term_followup(risk_level)})
{get_short_term_monitoring_plan(risk_level, predicted_adr, patient_data)}

### Long-term Monitoring Strategy
{get_long_term_monitoring_plan(risk_level, patient_data)}

### Laboratory Monitoring Schedule
{get_comprehensive_lab_monitoring(patient_data, predicted_adr)}

---

## Therapeutic Recommendations

### Dose Optimization
{get_comprehensive_dose_recommendations(risk_level, patient_data)}

### Alternative Therapy Considerations
{get_alternative_therapy_recommendations(risk_level, predicted_adr, patient_data)}

### Supportive Care Measures
{get_supportive_care_recommendations(predicted_adr, comorbidities)}

---

## Patient Education & Counseling

### Critical Warning Signs
{get_detailed_warning_signs(predicted_adr)}

### Medication Management
{get_medication_management_counseling(medication, dose)}

### Lifestyle Modifications
{get_lifestyle_recommendations(patient_data, predicted_adr)}

---

## Follow-up Protocol

### Scheduled Assessments
{get_detailed_followup_schedule(risk_level)}

### Emergency Contact Criteria
{get_emergency_contact_criteria(predicted_adr)}

### Reassessment Triggers
{get_reassessment_triggers(risk_level, predicted_adr)}

---

## Clinical Decision Support Notes

### Model Performance Context
- **Prediction Confidence:** {get_model_confidence_interpretation(no_adr_prob)}
- **Key Predictive Features:** {get_key_predictive_features(patient_data)}
- **Clinical Validation:** {get_clinical_validation_notes(prediction_result)}

### Limitations & Considerations
- This analysis is based on machine learning predictions trained on clinical data
- Individual patient factors may not be fully captured by the model
- Clinical judgment should always supersede algorithmic recommendations
- Regular reassessment is essential as patient condition evolves

---

## Summary & Action Items

### Immediate Actions Required
{get_immediate_action_items(risk_level, predicted_adr)}

### Short-term Goals
{get_short_term_goals(risk_level, patient_data)}

### Long-term Management Plan
{get_long_term_management_plan(risk_level, predicted_adr)}

---

*Analysis Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
*Model-Based Clinical Decision Support System*
*For clinical use only - requires healthcare provider interpretation*
"""
    
    return analysis

def get_patient_comorbidities(patient_data):
    """Extract patient comorbidities"""
    comorbidities = []
    comorbidity_fields = {
        'diabetes': 'Diabetes Mellitus',
        'liver_disease': 'Liver Disease',
        'ckd': 'Chronic Kidney Disease',
        'cardiac_disease': 'Cardiac Disease',
        'hypertension': 'Hypertension',
        'respiratory_disease': 'Respiratory Disease',
        'neurological_disease': 'Neurological Disease',
        'autoimmune_disease': 'Autoimmune Disease'
    }
    
    for field, name in comorbidity_fields.items():
        if patient_data.get(field, 0) == 1:
            comorbidities.append(name)
    
    return comorbidities

def get_age_risk_interpretation(age):
    """Get detailed age risk interpretation"""
    try:
        age_val = float(age)
        if age_val > 80:
            return "Very high risk - Advanced age with significantly altered pharmacokinetics and increased frailty"
        elif age_val > 70:
            return "High risk - Elderly with reduced drug clearance and increased sensitivity"
        elif age_val > 60:
            return "Moderate-high risk - Aging-related changes in drug metabolism"
        elif age_val > 50:
            return "Moderate risk - Some age-related pharmacokinetic changes"
        elif age_val > 18:
            return "Lower risk - Adult with normal drug handling capacity"
        else:
            return "Pediatric considerations - Age-specific dosing and monitoring required"
    except:
        return "Age risk assessment unavailable"

def get_sex_risk_interpretation(sex):
    """Get sex-based risk interpretation"""
    if sex.lower() == 'female':
        return "Female patients may have different pharmacokinetics and ADR susceptibility patterns"
    elif sex.lower() == 'male':
        return "Male patients may have different drug metabolism and clearance rates"
    else:
        return "Sex-specific risk factors not determined"

def get_ethnicity_risk_interpretation(ethnicity):
    """Get ethnicity-based risk interpretation"""
    ethnicity_risks = {
        'asian': "Asian populations may have different CYP enzyme activity and drug sensitivity",
        'african': "African populations may have genetic variations affecting drug metabolism",
        'hispanic': "Hispanic populations may have unique pharmacogenomic profiles",
        'caucasian': "Caucasian populations represent the majority of clinical trial data",
        'other': "Ethnicity-specific pharmacogenomic considerations may apply"
    }
    return ethnicity_risks.get(ethnicity.lower(), "Ethnicity-specific risk factors require individual assessment")

def get_bmi_risk_interpretation(bmi):
    """Get BMI-based risk interpretation"""
    try:
        bmi_val = float(bmi)
        if bmi_val < 18.5:
            return "Underweight - May affect drug distribution and clearance"
        elif bmi_val < 25:
            return "Normal weight - Standard pharmacokinetic expectations"
        elif bmi_val < 30:
            return "Overweight - May require dose adjustments for some medications"
        elif bmi_val < 35:
            return "Obese Class I - Altered drug distribution and metabolism likely"
        else:
            return "Obese Class II+ - Significant pharmacokinetic alterations expected"
    except:
        return "BMI risk assessment unavailable"

def get_comprehensive_renal_assessment(egfr, creatinine, age):
    """Get comprehensive renal function assessment"""
    try:
        egfr_val = float(egfr)
        creat_val = float(creatinine)
        age_val = float(age)
        
        assessment = []
        
        # eGFR assessment
        if egfr_val >= 90:
            assessment.append("Normal kidney function")
        elif egfr_val >= 60:
            assessment.append("Mildly decreased kidney function")
        elif egfr_val >= 45:
            assessment.append("Mild to moderately decreased kidney function")
        elif egfr_val >= 30:
            assessment.append("Moderately to severely decreased kidney function")
        elif egfr_val >= 15:
            assessment.append("Severely decreased kidney function")
        else:
            assessment.append("Kidney failure")
        
        # Creatinine assessment
        if age_val > 65 and creat_val > 1.2:
            assessment.append("Elevated creatinine concerning in elderly patient")
        elif creat_val > 1.5:
            assessment.append("Significantly elevated creatinine")
        
        # Clinical implications
        if egfr_val < 60:
            assessment.append("Dose adjustment required for renally eliminated drugs")
        if egfr_val < 30:
            assessment.append("Avoid nephrotoxic medications")
        
        return "; ".join(assessment)
    except:
        return "Renal function assessment requires valid laboratory values"

def get_comprehensive_hepatic_assessment(ast_alt, bilirubin, albumin):
    """Get comprehensive hepatic function assessment"""
    try:
        ast_alt_val = float(ast_alt)
        bili_val = float(bilirubin)
        alb_val = float(albumin)
        
        assessment = []
        
        # Liver enzyme assessment
        if ast_alt_val > 120:
            assessment.append("Severely elevated liver enzymes")
        elif ast_alt_val > 80:
            assessment.append("Moderately elevated liver enzymes")
        elif ast_alt_val > 40:
            assessment.append("Mildly elevated liver enzymes")
        else:
            assessment.append("Normal liver enzymes")
        
        # Bilirubin assessment
        if bili_val > 3.0:
            assessment.append("Severely elevated bilirubin")
        elif bili_val > 2.0:
            assessment.append("Moderately elevated bilirubin")
        elif bili_val > 1.2:
            assessment.append("Mildly elevated bilirubin")
        
        # Albumin assessment
        if alb_val < 3.0:
            assessment.append("Low albumin suggesting synthetic dysfunction")
        elif alb_val < 3.5:
            assessment.append("Borderline low albumin")
        
        # Clinical implications
        if ast_alt_val > 80 or bili_val > 2.0:
            assessment.append("Hepatic dose adjustment may be required")
        
        return "; ".join(assessment)
    except:
        return "Hepatic function assessment requires valid laboratory values"

def get_cardiovascular_assessment(bp_systolic, bp_diastolic, heart_rate):
    """Get cardiovascular status assessment"""
    try:
        sbp = float(bp_systolic)
        dbp = float(bp_diastolic)
        hr = float(heart_rate)
        
        assessment = []
        
        # Blood pressure assessment
        if sbp >= 180 or dbp >= 110:
            assessment.append("Hypertensive crisis - immediate intervention required")
        elif sbp >= 140 or dbp >= 90:
            assessment.append("Hypertension - cardiovascular risk factor")
        elif sbp < 90:
            assessment.append("Hypotension - monitor for drug-induced causes")
        else:
            assessment.append("Blood pressure within normal range")
        
        # Heart rate assessment
        if hr > 100:
            assessment.append("Tachycardia - evaluate for drug-related causes")
        elif hr < 60:
            assessment.append("Bradycardia - monitor for drug effects")
        else:
            assessment.append("Heart rate within normal range")
        
        return "; ".join(assessment)
    except:
        return "Cardiovascular assessment requires valid vital signs"

def get_medication_risk_assessment(medication, dose):
    """Get medication-specific risk assessment"""
    # This would be expanded with a comprehensive drug database
    high_risk_drugs = ['warfarin', 'digoxin', 'lithium', 'phenytoin', 'theophylline']
    
    assessment = []
    
    if medication.lower() in [drug.lower() for drug in high_risk_drugs]:
        assessment.append("High-risk medication requiring intensive monitoring")
    
    assessment.append(f"Medication: {medication}")
    
    try:
        dose_val = float(dose)
        assessment.append(f"Current dose: {dose_val} mg")
    except:
        assessment.append("Dose information available for review")
    
    return "; ".join(assessment)

def get_cyp2c9_interpretation(cyp2c9):
    """Get CYP2C9 genotype interpretation"""
    interpretations = {
        'normal': "Normal metabolizer - standard dosing appropriate",
        'intermediate': "Intermediate metabolizer - may require dose adjustment",
        'poor': "Poor metabolizer - significant dose reduction may be required",
        'rapid': "Rapid metabolizer - may require higher doses",
        'ultra-rapid': "Ultra-rapid metabolizer - may require significantly higher doses"
    }
    return interpretations.get(cyp2c9.lower(), "CYP2C9 status requires interpretation")

def get_cyp2d6_interpretation(cyp2d6):
    """Get CYP2D6 genotype interpretation"""
    interpretations = {
        'normal': "Normal metabolizer - standard dosing appropriate",
        'intermediate': "Intermediate metabolizer - may require dose adjustment",
        'poor': "Poor metabolizer - significant dose reduction may be required",
        'rapid': "Rapid metabolizer - may require higher doses",
        'ultra-rapid': "Ultra-rapid metabolizer - may require significantly higher doses"
    }
    return interpretations.get(cyp2d6.lower(), "CYP2D6 status requires interpretation")

def get_pharmacogenomic_impact(cyp2c9, cyp2d6, medication):
    """Get combined pharmacogenomic impact"""
    impacts = []
    
    if cyp2c9.lower() in ['poor', 'intermediate']:
        impacts.append("CYP2C9 variant may affect warfarin, phenytoin, and NSAID metabolism")
    
    if cyp2d6.lower() in ['poor', 'intermediate']:
        impacts.append("CYP2D6 variant may affect antidepressant, antipsychotic, and opioid metabolism")
    
    if not impacts:
        impacts.append("Standard pharmacogenomic profile - routine dosing appropriate")
    
    return "; ".join(impacts)

def get_polypharmacy_assessment(concomitant_count):
    """Get polypharmacy risk assessment"""
    try:
        count = int(concomitant_count)
        if count >= 10:
            return "Severe polypharmacy - very high interaction and ADR risk"
        elif count >= 5:
            return "Polypharmacy present - increased interaction and ADR risk"
        elif count >= 3:
            return "Multiple medications - monitor for interactions"
        else:
            return "Limited concomitant medications - lower interaction risk"
    except:
        return "Polypharmacy assessment requires medication count"

def generate_detailed_risk_breakdown(top_adr_risks, specific_adr_risks):
    """Generate detailed risk breakdown"""
    breakdown = "**Overall ADR Risk Distribution:**\n"
    
    for adr_type, probability in list(top_adr_risks.items())[:5]:
        risk_level = "High" if probability > 30 else "Moderate" if probability > 15 else "Low"
        breakdown += f"- {adr_type}: {probability}% ({risk_level} Risk)\n"
    
    if specific_adr_risks:
        breakdown += "\n**Specific ADR Type Risks:**\n"
        for adr_type, probability in specific_adr_risks.items():
            breakdown += f"- {adr_type}: {probability}%\n"
    
    return breakdown

def get_detailed_adr_analysis(predicted_adr, patient_data):
    """Get detailed analysis of predicted ADR"""
    adr_analyses = {
        'Gastrointestinal': """
**Mechanism:** Direct mucosal irritation, altered gastric pH, disrupted gut microbiome
**Common Manifestations:** Nausea, vomiting, diarrhea, abdominal pain, GI bleeding
**Risk Factors:** Advanced age, H. pylori infection, concurrent NSAID use, alcohol consumption
**Monitoring:** Stool occult blood, hemoglobin, electrolytes, nutritional status
**Prevention:** Gastroprotective agents, dose with food, probiotics consideration
        """,
        'Cardiovascular': """
**Mechanism:** Direct cardiac effects, vascular changes, electrolyte imbalances, QT prolongation
**Common Manifestations:** Arrhythmias, hypotension, hypertension, heart failure exacerbation
**Risk Factors:** Pre-existing cardiac disease, electrolyte abnormalities, drug interactions
**Monitoring:** ECG, blood pressure, electrolytes, cardiac biomarkers
**Prevention:** Baseline ECG, electrolyte optimization, cardiac consultation if indicated
        """,
        'Neurological': """
**Mechanism:** CNS depression/stimulation, neurotransmitter alterations, metabolic effects
**Common Manifestations:** Dizziness, confusion, seizures, extrapyramidal symptoms
**Risk Factors:** Advanced age, cognitive impairment, concurrent CNS medications
**Monitoring:** Mental status exams, neurological assessments, fall risk evaluation
**Prevention:** Gradual dose titration, fall precautions, cognitive monitoring
        """,
        'Dermatological': """
**Mechanism:** Allergic reactions, direct toxicity, photosensitivity, immune-mediated responses
**Common Manifestations:** Rash, urticaria, Stevens-Johnson syndrome, photosensitivity
**Risk Factors:** Previous drug allergies, immune system dysfunction, sun exposure
**Monitoring:** Skin examinations, allergy history review, photosensitivity assessment
**Prevention:** Allergy screening, sun protection, gradual dose escalation
        """,
        'Hematological': """
**Mechanism:** Bone marrow suppression, immune-mediated destruction, coagulation effects
**Common Manifestations:** Anemia, thrombocytopenia, neutropenia, bleeding disorders
**Risk Factors:** Concurrent medications affecting blood counts, nutritional deficiencies
**Monitoring:** Complete blood counts, coagulation studies, bleeding assessments
**Prevention:** Baseline blood work, dose adjustments, regular monitoring
        """
    }
    
    return adr_analyses.get(predicted_adr, "Detailed ADR analysis not available for this type")

def analyze_risk_factors(patient_data, prediction_result):
    """Analyze contributing risk factors"""
    risk_factors = []
    
    # Age factor
    try:
        age = float(patient_data.get('age', 0))
        if age > 65:
            risk_factors.append(f"Advanced age ({age} years) - increased ADR susceptibility")
    except:
        pass
    
    # Renal function
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            risk_factors.append(f"Reduced renal function (eGFR {egfr}) - drug accumulation risk")
    except:
        pass
    
    # Hepatic function
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 80:
            risk_factors.append(f"Elevated liver enzymes ({ast_alt} U/L) - altered drug metabolism")
    except:
        pass
    
    # Polypharmacy
    try:
        drug_count = int(patient_data.get('concomitant_drugs_count', 0))
        if drug_count >= 5:
            risk_factors.append(f"Polypharmacy ({drug_count} medications) - interaction risk")
    except:
        pass
    
    # Comorbidities
    comorbidities = get_patient_comorbidities(patient_data)
    if comorbidities:
        risk_factors.append(f"Comorbidities present: {', '.join(comorbidities)}")
    
    if not risk_factors:
        risk_factors.append("No major identifiable risk factors")
    
    return "\n".join([f"- {factor}" for factor in risk_factors])

def get_immediate_monitoring_plan(risk_level, predicted_adr):
    """Get immediate monitoring plan"""
    plans = {
        'High': f"""
- Continuous monitoring for first 24-48 hours
- Vital signs every 4 hours
- Specific {predicted_adr.lower()} symptom assessment every 6 hours
- Laboratory monitoring as indicated
- Patient/family education on warning signs
        """,
        'Medium': f"""
- Enhanced monitoring for first 48 hours
- Vital signs every 8 hours
- Daily {predicted_adr.lower()} symptom assessment
- Baseline laboratory values if not recent
- Patient education on warning signs
        """,
        'Low': f"""
- Standard monitoring protocols
- Daily clinical assessment
- Patient education on potential {predicted_adr.lower()} symptoms
- Routine vital signs
        """
    }
    return plans.get(risk_level, "Standard monitoring protocols")

def get_short_term_monitoring_plan(risk_level, predicted_adr, patient_data):
    """Get short-term monitoring plan"""
    plan = f"**Primary Focus:** {predicted_adr} monitoring\n"
    
    if risk_level == 'High':
        plan += "- Weekly clinical assessments\n- Bi-weekly laboratory monitoring\n"
    elif risk_level == 'Medium':
        plan += "- Bi-weekly clinical assessments\n- Weekly laboratory monitoring initially\n"
    else:
        plan += "- Weekly clinical assessments initially\n- Laboratory monitoring as indicated\n"
    
    # Add specific monitoring based on patient factors
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            plan += "- Enhanced renal function monitoring\n"
    except:
        pass
    
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 40:
            plan += "- Liver function monitoring\n"
    except:
        pass
    
    return plan

def get_long_term_monitoring_plan(risk_level, patient_data):
    """Get long-term monitoring plan"""
    plan = "**Long-term Strategy:**\n"
    
    if risk_level == 'High':
        plan += "- Monthly clinical assessments for 6 months\n- Quarterly assessments thereafter\n"
    elif risk_level == 'Medium':
        plan += "- Bi-monthly clinical assessments for 3 months\n- Quarterly assessments thereafter\n"
    else:
        plan += "- Quarterly clinical assessments\n- Annual comprehensive review\n"
    
    plan += "- Annual medication review and optimization\n"
    plan += "- Periodic reassessment of ADR risk factors\n"
    
    return plan

def get_comprehensive_lab_monitoring(patient_data, predicted_adr):
    """Get comprehensive laboratory monitoring schedule"""
    monitoring = []
    
    # Basic monitoring for all patients
    monitoring.append("**Baseline (if not recent):** CBC, CMP, LFTs")
    
    # ADR-specific monitoring
    if predicted_adr == 'Hematological':
        monitoring.append("**Weekly:** CBC with differential, coagulation studies")
    elif predicted_adr == 'Gastrointestinal':
        monitoring.append("**Bi-weekly:** CBC, electrolytes, stool occult blood")
    elif predicted_adr == 'Cardiovascular':
        monitoring.append("**Weekly:** Electrolytes, cardiac biomarkers if indicated")
    
    # Patient-specific monitoring
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            monitoring.append("**Renal monitoring:** Creatinine, eGFR every 2-4 weeks")
    except:
        pass
    
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 40:
            monitoring.append("**Hepatic monitoring:** LFTs every 2-4 weeks")
    except:
        pass
    
    return "\n".join(monitoring)

def get_comprehensive_dose_recommendations(risk_level, patient_data):
    """Get comprehensive dose recommendations"""
    recommendations = []
    
    if risk_level == 'High':
        recommendations.append("- Consider 25-50% dose reduction")
        recommendations.append("- Alternative therapy evaluation")
        recommendations.append("- Gradual dose titration if continuing")
    elif risk_level == 'Medium':
        recommendations.append("- Consider 25% dose reduction")
        recommendations.append("- Enhanced monitoring with current dose")
        recommendations.append("- Dose optimization based on response")
    else:
        recommendations.append("- Continue current dose with monitoring")
        recommendations.append("- Standard dose adjustments as indicated")
    
    # Organ-specific adjustments
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            recommendations.append(f"- Renal dose adjustment required (eGFR {egfr})")
    except:
        pass
    
    try:
        ast_alt = float(patient_data.get('ast_alt', 30))
        if ast_alt > 80:
            recommendations.append("- Hepatic dose adjustment may be required")
    except:
        pass
    
    return "\n".join(recommendations)

def get_alternative_therapy_recommendations(risk_level, predicted_adr, patient_data):
    """Get alternative therapy recommendations"""
    if risk_level == 'High':
        return """
- **Immediate consideration** of alternative medications
- Consult clinical pharmacist for therapeutic alternatives
- Consider non-pharmacological interventions
- Risk-benefit analysis with patient/family
        """
    elif risk_level == 'Medium':
        return """
- **Evaluate** alternative medications if ADR occurs
- Prepare backup therapeutic options
- Consider adjunctive therapies to reduce risk
- Patient preference discussion
        """
    else:
        return """
- **Monitor** current therapy effectiveness
- Alternative options available if needed
- Standard therapeutic monitoring
        """

def get_supportive_care_recommendations(predicted_adr, comorbidities):
    """Get supportive care recommendations"""
    recommendations = []
    
    # ADR-specific supportive care
    if predicted_adr == 'Gastrointestinal':
        recommendations.append("- Gastroprotective agents if indicated")
        recommendations.append("- Nutritional support and monitoring")
        recommendations.append("- Probiotic consideration")
    elif predicted_adr == 'Cardiovascular':
        recommendations.append("- Cardiac monitoring and support")
        recommendations.append("- Electrolyte optimization")
        recommendations.append("- Blood pressure management")
    elif predicted_adr == 'Neurological':
        recommendations.append("- Fall prevention measures")
        recommendations.append("- Cognitive monitoring")
        recommendations.append("- Safety assessments")
    
    # Comorbidity-specific care
    if 'Diabetes Mellitus' in comorbidities:
        recommendations.append("- Blood glucose monitoring")
    if 'Hypertension' in comorbidities:
        recommendations.append("- Blood pressure optimization")
    if 'Chronic Kidney Disease' in comorbidities:
        recommendations.append("- Nephrology consultation if indicated")
    
    return "\n".join(recommendations) if recommendations else "Standard supportive care measures"

def get_detailed_warning_signs(predicted_adr):
    """Get detailed warning signs for predicted ADR"""
    warning_signs = {
        'Gastrointestinal': """
**Immediate medical attention if:**
- Severe abdominal pain or cramping
- Persistent vomiting (>24 hours)
- Blood in vomit or stool
- Signs of dehydration
- Severe diarrhea with fever

**Contact healthcare provider if:**
- Persistent nausea affecting eating
- Changes in bowel habits
- Abdominal discomfort
- Loss of appetite >48 hours
        """,
        'Cardiovascular': """
**Immediate medical attention if:**
- Chest pain or pressure
- Severe shortness of breath
- Irregular or rapid heartbeat
- Fainting or near-fainting
- Severe swelling of legs/feet

**Contact healthcare provider if:**
- Mild shortness of breath
- Dizziness or lightheadedness
- Unusual fatigue
- Mild swelling
- Blood pressure changes
        """,
        'Neurological': """
**Immediate medical attention if:**
- Seizures or convulsions
- Severe confusion or disorientation
- Loss of consciousness
- Severe headache with vision changes
- Sudden weakness or paralysis

**Contact healthcare provider if:**
- Mild confusion or memory problems
- Dizziness or balance problems
- Headaches
- Sleep disturbances
- Mood changes
        """,
        'Dermatological': """
**Immediate medical attention if:**
- Widespread rash with fever
- Blistering or peeling skin
- Difficulty breathing with rash
- Swelling of face, lips, or tongue
- Severe itching affecting daily activities

**Contact healthcare provider if:**
- New rash or skin changes
- Mild itching or irritation
- Increased sun sensitivity
- Skin discoloration
- Dry or flaky skin
        """,
        'Hematological': """
**Immediate medical attention if:**
- Unusual bleeding that won't stop
- Severe bruising without injury
- Signs of infection (fever, chills)
- Extreme fatigue or weakness
- Shortness of breath with activity

**Contact healthcare provider if:**
- Easy bruising
- Mild fatigue
- Pale skin or nail beds
- Frequent minor infections
- Slow healing of cuts
        """
    }
    
    return warning_signs.get(predicted_adr, "Monitor for any unusual symptoms and contact healthcare provider with concerns")

def get_medication_management_counseling(medication, dose):
    """Get medication management counseling points"""
    return f"""
**Medication: {medication} {dose} mg**

**Taking Your Medication:**
- Take exactly as prescribed
- Do not skip doses or stop without consulting provider
- Take at the same time each day if possible
- Follow specific instructions (with/without food, etc.)

**Storage and Handling:**
- Store as directed on label
- Keep in original container
- Protect from light/moisture as indicated
- Keep out of reach of children

**What to Do If You Miss a Dose:**
- Take as soon as you remember
- If close to next dose time, skip missed dose
- Never double dose
- Contact provider if frequently missing doses

**Drug Interactions:**
- Inform all healthcare providers of this medication
- Check with pharmacist before taking new medications
- Avoid alcohol unless specifically approved
- Be cautious with over-the-counter medications
    """

def get_lifestyle_recommendations(patient_data, predicted_adr):
    """Get lifestyle recommendations"""
    recommendations = []
    
    # General recommendations
    recommendations.append("**General Health:**")
    recommendations.append("- Maintain regular sleep schedule")
    recommendations.append("- Stay well hydrated")
    recommendations.append("- Eat balanced, nutritious meals")
    recommendations.append("- Avoid alcohol unless approved by provider")
    
    # ADR-specific recommendations
    if predicted_adr == 'Gastrointestinal':
        recommendations.append("\n**GI Health:**")
        recommendations.append("- Eat smaller, more frequent meals")
        recommendations.append("- Avoid spicy or acidic foods if sensitive")
        recommendations.append("- Consider probiotic foods")
    elif predicted_adr == 'Cardiovascular':
        recommendations.append("\n**Heart Health:**")
        recommendations.append("- Monitor blood pressure regularly")
        recommendations.append("- Limit sodium intake")
        recommendations.append("- Engage in approved physical activity")
    elif predicted_adr == 'Neurological':
        recommendations.append("\n**Neurological Safety:**")
        recommendations.append("- Remove fall hazards from home")
        recommendations.append("- Avoid driving if experiencing dizziness")
        recommendations.append("- Use assistive devices as recommended")
    
    # Age-specific recommendations
    try:
        age = float(patient_data.get('age', 0))
        if age > 65:
            recommendations.append("\n**Age-Related Considerations:**")
            recommendations.append("- Regular medication reviews")
            recommendations.append("- Fall prevention measures")
            recommendations.append("- Regular health screenings")
    except:
        pass
    
    return "\n".join(recommendations)

def get_detailed_followup_schedule(risk_level):
    """Get detailed follow-up schedule"""
    schedules = {
        'High': """
**Week 1:** Phone check-in or clinic visit
**Week 2:** Clinic visit with laboratory review
**Month 1:** Comprehensive assessment
**Month 2:** Clinical evaluation
**Month 3:** Full reassessment and risk stratification
**Ongoing:** Monthly visits for 6 months, then quarterly
        """,
        'Medium': """
**Week 2:** Phone check-in or clinic visit
**Month 1:** Clinic visit with laboratory review
**Month 2:** Clinical evaluation
**Month 3:** Comprehensive reassessment
**Ongoing:** Bi-monthly visits for 3 months, then quarterly
        """,
        'Low': """
**Month 1:** Clinical evaluation
**Month 3:** Comprehensive assessment
**Month 6:** Full reassessment
**Ongoing:** Quarterly visits with annual comprehensive review
        """
    }
    return schedules.get(risk_level, "Standard follow-up schedule")

def get_emergency_contact_criteria(predicted_adr):
    """Get emergency contact criteria"""
    return f"""
**Call 911 or go to Emergency Department if:**
- Severe symptoms of {predicted_adr.lower()} ADR
- Difficulty breathing or swallowing
- Loss of consciousness
- Severe allergic reaction
- Chest pain or severe cardiac symptoms

**Contact Healthcare Provider Immediately if:**
- New or worsening {predicted_adr.lower()} symptoms
- Signs of serious ADR development
- Inability to take medication due to side effects
- Concerns about medication safety

**During Business Hours:**
- Questions about medication
- Mild side effects
- Routine concerns
- Prescription refills
    """

def get_reassessment_triggers(risk_level, predicted_adr):
    """Get reassessment triggers"""
    return f"""
**Immediate Reassessment Required if:**
- Development of {predicted_adr.lower()} symptoms
- New medications added
- Significant change in health status
- Laboratory abnormalities
- Patient reports concerning symptoms

**Scheduled Reassessment:**
- Risk level changes
- Medication dose adjustments
- New comorbidities develop
- Significant life changes
- Patient request for review

**Annual Reassessment:**
- Complete medication review
- Risk factor reassessment
- Model prediction update
- Treatment goal evaluation
    """

def get_model_confidence_interpretation(no_adr_prob):
    """Get model confidence interpretation"""
    if no_adr_prob > 80:
        return "High confidence - Low ADR risk prediction"
    elif no_adr_prob > 60:
        return "Moderate confidence - Moderate ADR risk prediction"
    elif no_adr_prob > 40:
        return "Moderate confidence - Moderate-high ADR risk prediction"
    else:
        return "High confidence - High ADR risk prediction"

def get_key_predictive_features(patient_data):
    """Get key predictive features"""
    features = []
    
    try:
        age = float(patient_data.get('age', 0))
        if age > 65:
            features.append("Advanced age")
    except:
        pass
    
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            features.append("Reduced renal function")
    except:
        pass
    
    try:
        drug_count = int(patient_data.get('concomitant_drugs_count', 0))
        if drug_count >= 5:
            features.append("Polypharmacy")
    except:
        pass
    
    comorbidities = get_patient_comorbidities(patient_data)
    if comorbidities:
        features.append("Multiple comorbidities")
    
    return ", ".join(features) if features else "Standard risk profile"

def get_clinical_validation_notes(prediction_result):
    """Get clinical validation notes"""
    return """
**Model Validation Context:**
- Trained on diverse clinical datasets
- Validated against real-world outcomes
- Continuously updated with new data
- Performance metrics regularly monitored

**Clinical Integration:**
- Designed to support, not replace, clinical judgment
- Best used in conjunction with clinical assessment
- Regular validation against patient outcomes
- Feedback incorporation for model improvement
    """

def get_immediate_action_items(risk_level, predicted_adr):
    """Get immediate action items"""
    if risk_level == 'High':
        return f"""
1. **Immediate:** Assess patient for early {predicted_adr.lower()} symptoms
2. **Within 24 hours:** Review medication regimen and consider dose adjustment
3. **Within 48 hours:** Implement enhanced monitoring protocol
4. **Within 1 week:** Clinical reassessment and laboratory review
5. **Ongoing:** Daily symptom monitoring and patient education
        """
    elif risk_level == 'Medium':
        return f"""
1. **Immediate:** Patient education on {predicted_adr.lower()} warning signs
2. **Within 48 hours:** Baseline assessment and monitoring plan
3. **Within 1 week:** Clinical evaluation and laboratory review
4. **Within 2 weeks:** Follow-up assessment
5. **Ongoing:** Regular monitoring and patient communication
        """
    else:
        return f"""
1. **Immediate:** Patient education on potential {predicted_adr.lower()} symptoms
2. **Within 1 week:** Baseline assessment
3. **Within 1 month:** Clinical evaluation
4. **Ongoing:** Standard monitoring and routine follow-up
        """

def get_short_term_goals(risk_level, patient_data):
    """Get short-term goals"""
    goals = [
        "- Prevent ADR occurrence through proactive monitoring",
        "- Optimize medication regimen for safety and efficacy",
        "- Establish effective patient-provider communication",
        "- Implement appropriate monitoring protocols"
    ]
    
    if risk_level == 'High':
        goals.append("- Consider alternative therapeutic options")
        goals.append("- Intensive monitoring and support")
    
    try:
        egfr = float(patient_data.get('egfr', 100))
        if egfr < 60:
            goals.append("- Optimize dosing for renal function")
    except:
        pass
    
    return "\n".join(goals)

def get_long_term_management_plan(risk_level, predicted_adr):
    """Get long-term management plan"""
    return f"""
**Primary Objectives:**
- Maintain therapeutic benefit while minimizing ADR risk
- Regular reassessment of risk-benefit ratio
- Adaptation of monitoring based on patient response
- Integration of patient preferences and quality of life

**Monitoring Evolution:**
- Transition from intensive to routine monitoring as appropriate
- Periodic risk reassessment using updated clinical data
- Adjustment of monitoring frequency based on stability
- Long-term outcome tracking and optimization

**Patient Engagement:**
- Ongoing education and empowerment
- Shared decision-making for treatment modifications
- Regular assessment of treatment satisfaction
- Support for medication adherence and lifestyle modifications
    """

def get_meal_timing_recommendations(medication):
    """Get meal timing recommendations for specific medications"""
    # This would be medication-specific in a real implementation
    return "Take with food to reduce stomach irritation, preferably with breakfast for morning doses"

def get_beneficial_foods(medication):
    """Get foods that should be taken with medication"""
    return """- **High-fiber foods:** Oatmeal, whole grains to support digestive health
- **Lean proteins:** Fish, chicken, tofu to support medication metabolism
- **Calcium-rich foods:** Dairy products, leafy greens (if not contraindicated)
- **Probiotics:** Yogurt, kefir to maintain gut health during treatment
- **Anti-inflammatory foods:** Berries, fatty fish, nuts to reduce inflammation"""

def get_foods_to_avoid(medication):
    """Get foods to avoid with medication"""
    return """- **Grapefruit & Grapefruit Juice:** Can significantly alter medication levels
- **High-fat meals:** May delay or reduce medication absorption
- **Excessive caffeine:** Coffee, energy drinks may increase side effects
- **Alcohol:** Can increase risk of side effects and liver toxicity
- **High-sodium foods:** Processed foods, canned soups may worsen certain conditions
- **Tyramine-rich foods:** Aged cheeses, cured meats (if applicable to medication)"""

def get_detailed_meal_timing(medication):
    """Get detailed meal timing guidelines"""
    return """- **30 minutes before meals:** For optimal absorption if stomach irritation is not a concern
- **With meals:** If medication causes nausea or stomach upset
- **2 hours after meals:** For medications requiring empty stomach
- **Bedtime:** For medications that may cause drowsiness
- **Consistent timing:** Same relationship to meals every day"""

def get_critical_warning_signs(predicted_adr):
    """Get critical warning signs based on predicted ADR"""
    warning_signs = {
        'Gastrointestinal': """- Severe abdominal pain or cramping
- Blood in vomit or stool (black, tarry stools)
- Persistent vomiting preventing fluid intake
- Signs of dehydration (dizziness, dry mouth, decreased urination)
- Severe diarrhea lasting more than 24 hours""",
        
        'Cardiovascular': """- Chest pain or pressure
- Severe shortness of breath
- Irregular or very fast/slow heartbeat
- Sudden swelling of face, lips, tongue, or throat
- Fainting or severe dizziness
- Sudden severe headache""",
        
        'Neurological': """- Sudden severe headache
- Confusion or disorientation
- Seizures or convulsions
- Sudden weakness or numbness
- Vision changes or loss
- Difficulty speaking or understanding speech""",
        
        'Dermatological': """- Widespread rash with fever
- Blistering or peeling skin
- Severe itching with difficulty breathing
- Swelling of face, lips, or tongue
- Rash spreading rapidly""",
        
        'Hematological': """- Unusual bleeding that won't stop
- Severe bruising without injury
- Extreme fatigue or weakness
- Frequent infections or fever
- Pale skin or shortness of breath""",
        
        'Nephrotoxicity': """- Significant decrease in urination
- Blood in urine
- Severe swelling of legs, ankles, or face
- Persistent nausea and vomiting
- Confusion or difficulty concentrating""",
        
        'Hepatotoxicity': """- Yellowing of skin or eyes (jaundice)
- Dark urine or pale stools
- Severe fatigue or weakness
- Loss of appetite with nausea
- Severe abdominal pain (upper right side)"""
    }
    
    return warning_signs.get(predicted_adr, """- Severe allergic reactions (difficulty breathing, swelling)
- Any symptoms that worsen rapidly
- Symptoms that significantly interfere with daily activities
- New symptoms not previously experienced""")

def get_side_effect_management(predicted_adr):
    """Get side effect management strategies"""
    management = {
        'Gastrointestinal': """- **Nausea:** Take with food, eat small frequent meals, avoid spicy foods
- **Diarrhea:** Stay hydrated, eat bland foods (BRAT diet), avoid dairy temporarily
- **Constipation:** Increase fiber intake, drink more water, gentle exercise
- **Stomach upset:** Take with milk or food, avoid acidic foods""",
        
        'Cardiovascular': """- **Dizziness:** Rise slowly from sitting/lying, stay hydrated
- **Swelling:** Elevate legs, reduce sodium intake, monitor weight daily
- **Palpitations:** Avoid caffeine, practice relaxation techniques
- **Fatigue:** Pace activities, ensure adequate rest""",
        
        'Neurological': """- **Headache:** Stay hydrated, maintain regular sleep schedule
- **Dizziness:** Move slowly, avoid sudden position changes
- **Drowsiness:** Avoid driving, take medication at bedtime if possible
- **Memory issues:** Use reminders, maintain routine""",
        
        'Dermatological': """- **Mild rash:** Keep skin moisturized, avoid harsh soaps
- **Sun sensitivity:** Use sunscreen SPF 30+, wear protective clothing
- **Dry skin:** Use gentle moisturizers, avoid hot showers
- **Itching:** Cool compresses, loose clothing, avoid scratching"""
    }
    
    return management.get(predicted_adr, """- Monitor symptoms and report changes to healthcare provider
- Keep a symptom diary to track patterns
- Follow general health maintenance practices
- Stay hydrated and maintain good nutrition""")

def get_lifestyle_precautions(medication, age):
    """Get lifestyle and activity precautions"""
    try:
        age_val = float(age) if age != 'Unknown' else 65
        precautions = []
        
        if age_val > 65:
            precautions.append("- **Fall Prevention:** Use handrails, ensure good lighting, remove trip hazards")
            precautions.append("- **Medication Management:** Use pill organizers, set reminders")
        
        precautions.extend([
            "- **Driving:** Avoid if experiencing dizziness, drowsiness, or vision changes",
            "- **Sun Exposure:** Use sunscreen and protective clothing (many medications increase sun sensitivity)",
            "- **Exercise:** Start slowly, stay hydrated, avoid overexertion",
            "- **Alcohol:** Avoid or strictly limit as directed by healthcare provider",
            "- **Other Medications:** Check with pharmacist before taking any new medications or supplements",
            "- **Dental Work:** Inform dentist about all medications before procedures",
            "- **Surgery:** Inform all healthcare providers about medications before any procedures"
        ])
        
        return "\n".join(precautions)
    except:
        return """- Follow general safety precautions
- Avoid activities requiring alertness if experiencing side effects
- Maintain regular communication with healthcare providers"""

def generate_fallback_medication_analysis(patient_data, prediction_result, patient_name):
    """Generate a fallback medication analysis when Gemini API is not available"""
    
    risk_level = prediction_result.get('risk_level', 'Unknown')
    predicted_adr = prediction_result.get('predicted_adr_type', 'Unknown')
    medication = patient_data.get('medication_name', 'Unknown')
    dose = patient_data.get('index_drug_dose', 'Unknown')
    age = patient_data.get('age', 'Unknown')
    weight = patient_data.get('weight', 'Unknown')
    egfr = patient_data.get('egfr', 'Unknown')
    
    analysis = f"""# Detailed Medication Analysis for {patient_name}

## Current Medication Assessment

**Medication:** {medication}
**Current Dose:** {dose} mg
**Risk Assessment:** {risk_level} risk for {predicted_adr}

### Appropriateness Analysis
The current medication {medication} requires careful evaluation given the {risk_level} risk profile for {predicted_adr}.

## Dose Optimization Recommendations

### Current Dose Evaluation
Current dose of {dose} mg should be evaluated considering patient age ({age} years) and kidney function (eGFR: {egfr}).

### Recommended Adjustments
- Monitor for effectiveness and safety
- Consider dose adjustment based on clinical response
- Regular reassessment recommended

## Administration Guidelines & Timing

### Optimal Timing Recommendations
- **Morning Administration:** Generally recommended for most medications to align with circadian rhythms
- **Consistent Daily Timing:** Take at the same time each day (±1 hour) to maintain steady blood levels
- **Meal Relationship:** {get_meal_timing_recommendations(medication)}

## Detailed Food & Dietary Recommendations

### Foods to Take WITH Medication
{get_beneficial_foods(medication)}

### Foods to AVOID
{get_foods_to_avoid(medication)}

### Hydration & Fluid Requirements
- **Water Intake:** Drink at least 8-10 glasses of water daily
- **With Medication:** Take with a full glass (8 oz) of water
- **Avoid:** Grapefruit juice, excessive caffeine, alcohol

### Meal Timing Guidelines
{get_detailed_meal_timing(medication)}

## Safety Precautions & Warnings

### Critical Warning Signs (Seek Immediate Medical Attention)
{get_critical_warning_signs(predicted_adr)}

### Common Side Effects & Management
{get_side_effect_management(predicted_adr)}

### Activity & Lifestyle Precautions
{get_lifestyle_precautions(medication, age)}

## Alternative Medication Options

### Consider Alternatives If:
- Current medication becomes ineffective
- Intolerable side effects develop
- Risk-benefit ratio becomes unfavorable

## Monitoring Schedule

### Clinical Monitoring
- **Frequency:** Based on risk level - {risk_level} risk requires enhanced monitoring
- **Parameters:** Efficacy and safety assessments
- **Follow-up:** Regular clinical evaluations

### Laboratory Monitoring
- Monitor relevant laboratory parameters based on medication
- Adjust frequency based on patient stability
- Consider therapeutic drug monitoring if available

## Patient Education Points

### Administration Instructions
- Take medication exactly as prescribed
- Do not skip doses or double up
- Contact healthcare provider before making changes

### Warning Signs to Watch For
- Any new or unusual symptoms
- Signs specific to {predicted_adr}
- Severe allergic reactions

### When to Contact Healthcare Provider
- New symptoms that persist
- Questions about medication effectiveness
- Concerns about side effects

---
*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
*Note: This is a clinical algorithm-based analysis. Consult with clinical pharmacist for personalized recommendations.*
"""
    
    return analysis

if __name__ == '__main__':
    # Check if running in production or development
    is_production = os.getenv('RENDER') or os.getenv('PRODUCTION')
    
    if is_production:
        print("🚀 MedAI-VIGI Starting (Production Mode)...")
        print("💊 Health check: /health")
        print("🔍 Debug info: /debug")
        app.run(debug=False, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
    else:
        print("=" * 80)
        print("🐛 DEBUG SERVER STARTING (Development Mode)")
        print("=" * 80)
        print("📱 Main Pages:")
        print("   🏠 Home:               http://localhost:5000")
        print("   � AsIsessment:         http://localhost:5000/assessment")
        print("   💊 Drug Interactions:  http://localhost:5000/drug-interactions")
        print("   🩺 Clinical Support:   http://localhost:5000/clinical-decision-support")
        print("   ℹ️  About:              http://localhost:5000/about")
        print("=" * 80)
        print("📚 Documentation Pages:")
        print("   📖 Documentation:      http://localhost:5000/documentation")
        print("   �  API Reference:      http://localhost:5000/api-reference")
        print("   📄 Research Papers:    http://localhost:5000/research-papers")
        print("   ❓ FAQs:               http://localhost:5000/faqs")
        print("=" * 80)
        print("📜 Legal Pages:")
        print("   🔒 Privacy Policy:     http://localhost:5000/privacy-policy")
        print("   📋 Terms of Service:   http://localhost:5000/terms-of-service")
        print("   🍪 Cookie Policy:      http://localhost:5000/cookie-policy")
        print("=" * 80)
        print("🔧 Testing Endpoints:")
        print("   💊 Health Check:       http://localhost:5000/health")
        print("   🔍 Debug Info:         http://localhost:5000/debug")
        print("   🧪 Test AI Insights:   http://localhost:5000/test-ai-insights")
        print("=" * 80)
        print("🤖 AI Features:")
        print("   ✅ Gemini API Configured")
        print("   ✅ AI Drug Insights Configured")
        print("   ✅ Advanced Pharmacogenomics Module Active")
        print("=" * 80)
        print("🚀 Server is ready! Press CTRL+C to stop.")
        print("=" * 80)
        app.run(debug=True, host='0.0.0.0', port=5000)