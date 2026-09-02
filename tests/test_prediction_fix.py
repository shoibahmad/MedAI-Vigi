"""Test to verify the prediction endpoint works with missing CBC fields"""
import requests
import json

# Test data WITHOUT the CBC fields (simulating frontend request)
test_patient_data = {
    'age': 65,
    'sex': 'M',
    'ethnicity': 'White',
    'height': 175,
    'weight': 80,
    'bmi': 26.1,
    'creatinine': 1.5,
    'egfr': 55,
    'ast_alt': 45,
    'bilirubin': 1.2,
    'albumin': 4.0,
    'temperature': 98.6,
    'ind_value': 1.0,
    'atpp_value': 30.0,
    # CBC fields intentionally missing to test defaults
    'diabetes': 1,
    'liver_disease': 0,
    'ckd': 1,
    'cardiac_disease': 1,
    'medication_name': 'Warfarin',
    'index_drug_dose': 5,
    'concomitant_drugs_count': 8,
    'cyp2c9': 'Poor',
    'cyp2d6': 'EM',
    'bp_systolic': 145,
    'bp_diastolic': 90,
    'heart_rate': 78,
    'time_since_start_days': 60,
    'cyp_inhibitors_flag': 1,
    'qt_prolonging_flag': 0,
    'hla_risk_allele_flag': 0,
    'inpatient_flag': 0,
    'prior_adr_history': 0
}

print("=" * 60)
print("Testing Prediction Endpoint with Missing CBC Fields")
print("=" * 60)

# Test locally (assuming server is running on port 5000)
url = "http://localhost:5000/predict"

try:
    print("\n📤 Sending prediction request...")
    print(f"   Patient: {test_patient_data['age']}yo {test_patient_data['sex']}")
    print(f"   Medication: {test_patient_data['medication_name']}")
    print(f"   Note: CBC fields (hemoglobin, hematocrit, etc.) are NOT included")
    
    response = requests.post(url, json=test_patient_data, timeout=10)
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS! Prediction completed")
        print(f"\n📊 Results:")
        print(f"   Predicted ADR: {result.get('predicted_adr_type', 'N/A')}")
        print(f"   Risk Level: {result.get('risk_level', 'N/A')}")
        print(f"   No ADR Probability: {result.get('no_adr_probability', 'N/A')}%")
        
        print(f"\n🎯 Top 3 ADR Risks:")
        top_risks = result.get('top_specific_adr_risks', {})
        for i, (adr, prob) in enumerate(list(top_risks.items())[:3], 1):
            print(f"   {i}. {adr}: {prob}%")
        
        print("\n" + "=" * 60)
        print("✅ Fix verified! Server handles missing CBC fields correctly")
        print("=" * 60)
    else:
        print(f"\n❌ ERROR: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n⚠️  Server not running. Start the server with:")
    print("   python app.py")
    print("\nThen run this test again.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
