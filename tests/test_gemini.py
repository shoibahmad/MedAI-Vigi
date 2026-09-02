#!/usr/bin/env python3
"""
Test script to check Gemini API functionality
"""

from google import genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test if Gemini API is working"""
    
    # Configure Gemini API from environment
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY not found in environment variables")
        print("Please set it in your .env file")
        return False
    
    try:
        print("🧪 Testing Gemini API...")
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Simple test
        test_prompt = "Generate a simple test response: Hello, this is a test of the Gemini API."
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp', # or gemini-1.5-flash
            contents=test_prompt
        )
        
        print("✅ Gemini API is working!")
        print(f"Response: {response.text[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return False

def test_medical_prompt():
    """Test with a medical prompt similar to what we use"""
    
    # Configure Gemini API from environment
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        print("❌ Error: GEMINI_API_KEY not found in environment variables")
        print("Please set it in your .env file")
        return False
    
    try:
        print("\n🏥 Testing medical prompt...")
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        medical_prompt = """
        As a clinical pharmacologist, generate a brief ADR risk assessment for:
        
        Patient: 65-year-old male
        Condition: Hypertension
        Risk Level: Medium
        
        Provide a short clinical recommendation.
        """
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=medical_prompt
        )
        
        print("✅ Medical prompt working!")
        print(f"Response length: {len(response.text)} characters")
        print(f"Sample: {response.text[:300]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Medical prompt error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Gemini API Test Suite")
    print("=" * 40)
    
    # Test basic API
    basic_test = test_gemini_api()
    
    # Test medical prompt
    medical_test = test_medical_prompt()
    
    print("\n📊 Test Results:")
    print(f"Basic API Test: {'✅ PASS' if basic_test else '❌ FAIL'}")
    print(f"Medical Prompt Test: {'✅ PASS' if medical_test else '❌ FAIL'}")
    
    if basic_test and medical_test:
        print("\n🎉 All tests passed! Gemini API is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check your API key and internet connection.")