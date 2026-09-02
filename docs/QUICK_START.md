# Quick Start Guide - PhenoRx

## ✅ System Status

**Model**: Gemini 2.5 Flash  
**API Status**: ✅ Verified Working  
**Configuration**: Environment Variables (.env)

## 🚀 Quick Start

### 1. Test API Connection
```bash
python test_api_key.py
```
Expected output: `✅ ALL TESTS PASSED`

### 2. Start the Application
```bash
python app.py
```

### 3. Access the Application
- **Main Interface**: http://localhost:5000
- **Assessment Page**: http://localhost:5000/assessment
- **Drug Interactions**: http://localhost:5000/drug-interactions
- **Clinical Support**: http://localhost:5000/clinical-decision-support
- **Health Check**: http://localhost:5000/health

## 🔑 API Keys

API keys are stored in `.env` file:
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_DRUG_INTERACTIONS=your_gemini_api_key_here
```

Get your API keys from: https://aistudio.google.com/app/apikey

⚠️ **Never commit .env file to version control!**

## 🧪 Testing

### Quick API Test
```bash
python test_api_key.py
```

### Full Test Suite
```bash
pytest tests/
```

### Test Specific Features
```bash
# Test drug interactions
curl http://localhost:5000/test-ai-insights

# Test health endpoint
curl http://localhost:5000/health
```

## 📊 Features

### 1. ADR Risk Prediction
- Machine learning-based risk assessment
- Personalized dosing recommendations
- Pharmacogenomic analysis

### 2. Drug Interaction Checker
- AI-powered interaction analysis
- Severity classification
- Clinical recommendations

### 3. Clinical Decision Support
- Evidence-based recommendations
- Patient-specific guidance
- Monitoring protocols

### 4. Advanced Pharmacogenomics
- CYP enzyme analysis (6 enzymes)
- Transporter genetics (SLCO1B1, ABCB1, ABCG2)
- HLA hypersensitivity risk assessment
- Personalized dosing algorithms

## 🔧 Troubleshooting

### API Key Issues
If you see "API key expired":
1. Check `.env` file exists
2. Verify API keys are correct
3. Run `python test_api_key.py`

### Model Issues
If Gemini 2.5 Flash fails:
- Application automatically falls back to Gemini 1.5 models
- Rule-based analysis used if all AI models fail

### Port Issues
If port 5000 is in use:
```bash
# Change the port with the PORT env var:
PORT=5001 python app.py
```

## 📝 Development

### File Structure
```
app.py                   # Main application (Flask API + serves the SPA)
app.py                   # Alternative entry point
test_api_key.py          # Quick API verification
tests/                   # Full test suite
.env                     # API keys (DO NOT COMMIT)
requirements.txt         # Python dependencies
```

### Key Dependencies
- Flask (web framework)
- google-generativeai (Gemini API)
- joblib (model loading)
- pandas, numpy (data processing)
- python-dotenv (environment variables)

## 🎯 Next Steps

1. ✅ API verified - Ready to use!
2. Start the application: `python app.py`
3. Test all features through the web interface
4. Review `GEMINI_2.5_FLASH_CONFIG.md` for detailed configuration

## 📚 Documentation

- **Configuration Details**: `GEMINI_2.5_FLASH_CONFIG.md`
- **Model Improvements**: `MODEL_IMPROVEMENTS.md`
- **Project Overview**: `PROJECT_OVERVIEW.md`
- **Toast Notifications**: `TOAST_NOTIFICATIONS.md`

## 🆘 Support

If you encounter issues:
1. Check `.env` file configuration
2. Run `python test_api_key.py`
3. Check logs in terminal output
4. Review error messages in browser console

---
**Last Updated**: November 24, 2025  
**Model**: Gemini 2.5 Flash  
**Status**: ✅ Production Ready
