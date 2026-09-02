#!/usr/bin/env python3
"""
Diagnostic script to check Gemini API configuration
"""

import os

from dotenv import load_dotenv
from google import genai

print("🔍 Gemini API Diagnostic Tool")
print("=" * 60)

# Load environment variables
load_dotenv()

# Check API keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_KEY_DRUG = os.getenv("GEMINI_API_KEY_DRUG_INTERACTIONS")

print("\n📋 Environment Variables:")
print(
    f"GEMINI_API_KEY: {GEMINI_API_KEY[:20]}...{GEMINI_API_KEY[-4:] if GEMINI_API_KEY else 'NOT FOUND'}"
)
print(
    f"GEMINI_API_KEY_DRUG_INTERACTIONS: {GEMINI_API_KEY_DRUG[:20]}...{GEMINI_API_KEY_DRUG[-4:] if GEMINI_API_KEY_DRUG else 'NOT FOUND'}"
)

print("\n🧪 Testing Primary API Key...")
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp", contents="Say 'Primary key works'"
    )
    print("✅ Primary Key Status: WORKING")
    print(f"   Response: {response.text[:50]}")
except Exception as e:
    print("❌ Primary Key Status: FAILED")
    print(f"   Error: {str(e)}")

print("\n🧪 Testing Drug Interactions API Key...")
try:
    client_drug = genai.Client(api_key=GEMINI_API_KEY_DRUG)
    response = client_drug.models.generate_content(
        model="gemini-2.0-flash-exp", contents="Say 'Drug key works'"
    )
    print("✅ Drug Key Status: WORKING")
    print(f"   Response: {response.text[:50]}")
except Exception as e:
    print("❌ Drug Key Status: FAILED")
    print(f"   Error: {str(e)}")

print("\n📊 Available Models (Top 5 Gemini):")
try:
    # This listing might differ in the new SDK, assuming standard list if available or skipping
    # The new SDK standardizes around client.models.list() but let's check basic connectivity mostly.
    # We'll just try to list if supported, else skip.
    # Note: google-genai 1.0 might need specific call structure.
    # For now, we'll skip detailed listing to avoid guessing the V1 API surface area for listing.
    print("   (Skipping model listing in this diagnostic version)")
except Exception as e:
    print(f"   Error listing models: {str(e)}")

print("\n" + "=" * 60)
print("✅ Diagnostic complete!")
