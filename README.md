# PhenoRx: An Intelligent System for Automated ADR Identification 🏥🧠

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0.3-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/shoibahmad/PhenoRx/workflows/CI%20Pipeline/badge.svg)](https://github.com/shoibahmad/PhenoRx/actions)
[![Code Coverage](https://img.shields.io/badge/coverage-91%25-brightgreen.svg)](https://github.com/shoibahmad/PhenoRx)

A comprehensive web-based clinical decision support system for predicting Adverse Drug Reaction (ADR) risks using machine learning, AI-powered clinical reports, and personalized medication dosing.

---

## 🚀 Quick Start

### From Fresh Clone to Running Application

```bash
# 1. Clone repository
git clone https://github.com/shoibahmad/PhenoRx.git
cd PhenoRx

# 2. Install dependencies
make install
# or: pip install -r requirements.txt

# 3. Set up environment (create .env with your API keys)
cp .env.example .env
# Edit .env and add GEMINI_API_KEY

# 4. Build model (first time only)
make build
# or: python data_generator.py && python model_trainer.py

# 5. Run tests
make test
# or: pytest -v

# 6. Start application
make run
# or: python app.py
```

**Access:** http://localhost:5000

**Full Installation Guide:** See [INSTALLATION.md](INSTALLATION.md)

---

## ✨ Features

- **Machine Learning Prediction**: Advanced ML model for multi-class ADR risk assessment
- **Clinical Decision Support**: Evidence-based risk stratification (Low/Medium/High)
- **AI-Powered Reports**: Comprehensive clinical reports generated using Google Gemini AI
- **Pharmacogenomics**: CYP enzyme, transporter, and HLA analysis for personalized dosing
- **Drug Interactions**: Real-time interaction checking with severity assessment
- **Responsive Design**: Beautiful, medical-grade UI optimized for clinical workflows
- **Real-time Assessment**: Instant risk calculations with detailed probability breakdowns
- **Comprehensive Input**: Demographics, lab values, comorbidities, medications, and genetics
- **Health Monitoring**: Built-in health check endpoints for production monitoring
- **Docker Support**: Containerized deployment with Docker Compose

---

## 🏗️ Technology Stack

### Backend
- **Flask 3.0**: Python web framework
- **Scikit-learn 1.3**: Machine learning model
- **XGBoost 2.0**: Gradient boosting for predictions
- **Google Gemini AI 0.3**: Clinical report generation
- **Pandas/NumPy**: Data processing

### Frontend
- **HTML5/CSS3**: Responsive medical UI
- **JavaScript ES6**: Interactive form handling
- **Font Awesome 6**: Medical icons
- **Google Fonts**: Professional typography

### DevOps
- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **pytest**: Testing framework
- **Ruff/Black**: Code linting and formatting
- **Gunicorn**: Production WSGI server

---

## 📦 Installation

### Prerequisites

- Python 3.9+ (3.11 recommended)
- pip (Python package installer)
- Git
- Docker (optional)

### Method 1: Using Make (Recommended)

```bash
# Complete setup from scratch
make setup

# Individual commands
make install        # Install dependencies
make build          # Generate model and data
make test           # Run tests
make run            # Start application
make dev            # Run in development mode with hot-reload
```

### Method 2: Manual Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Generate model
python data_generator.py
python model_trainer.py

# Run application
python app.py
```

### Method 3: Docker

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t phenorx .
docker run -p 5000:5000 -e GEMINI_API_KEY=your_key phenorx
```

**Detailed Instructions:** See [INSTALLATION.md](INSTALLATION.md)

---

## 🧪 Testing

### Run All Tests (Fully Offline & Hermetic)

The test suite runs 100% offline without requiring external API keys or cloud dependencies:

```bash
# Canonical offline verification (Linux / macOS)
unset GEMINI_API_KEY && pytest -v

# Windows PowerShell
$env:GEMINI_API_KEY="" ; pytest -v

# Run full multi-language test suite (Python + JavaScript)
make test
```

### Run with Coverage Gate (>= 80%)

```bash
pytest --cov=. --cov-report=html --cov-report=term-missing --cov-fail-under=80
```

### Run Specific Tests

```bash
pytest tests/test_health_endpoint.py -v
pytest tests/test_model_training.py -v
pytest tests/test_request_validation.py -v
```

### View Coverage Report

```bash
# Generate HTML coverage report
pytest --cov=. --cov-report=html

# Open in browser
open htmlcov/index.html  # Mac
xdg-open htmlcov/index.html  # Linux
start htmlcov\index.html  # Windows
```

---

## 📊 Reproducing Reported Metrics & Empirical Ablation

The complete ML training, evaluation, and multi-seed feature ablation pipeline can be reproduced deterministically with a single command:

```bash
make reproduce
# or manually:
python scripts/data_generator.py
python scripts/model_trainer.py
python scripts/run_ablation.py
python scripts/eda_report.py
```

### Generated Artifacts
- **Model Checkpoints**: `models/adr_model.pkl` and `models/adr_preprocessor.pkl`
- **Multi-Seed Metrics**: [reports/experiment_metrics.json](reports/experiment_metrics.json) (seeds: 42, 7, 123)
- **Detailed Error Analysis**: [reports/error_analysis.md](reports/error_analysis.md)
- **Exploratory Data Analysis**: [reports/eda_summary.md](reports/eda_summary.md)

---

## 🔬 Model Evaluation & Pharmacogenomics Ablation Analysis

Empirical multi-seed ablation benchmarks evaluate the statistical significance of incorporating Pharmacogenomic (PGx) features into ADR prediction:

| Pipeline Variant | Mean Accuracy | Mean F1 (Weighted) | F1 Variance ($\sigma$) |
| :--- | :---: | :---: | :---: |
| **Baseline (With PGx Features)** | **0.865** | **0.871** | $\pm 0.008$ |
| **Ablated (Without PGx Features)** | **0.782** | **0.789** | $\pm 0.012$ |
| **Empirical Delta ($\Delta$)** | **+0.083** | **+0.082** | Statistically Significant ($p < 0.01$) |

For per-class precision, recall, and confusion matrix distributions across distinct seed iterations, see the complete [reports/error_analysis.md](reports/error_analysis.md).

## 🔧 Development

### Setup Development Environment

```bash
# Install with dev dependencies
make install-dev

# Or manually
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Code Quality

```bash
# Format code
make format

# Run linting
make lint

# Security scan
make security
```

### Development Workflow

1. **Create branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit code
3. **Run tests**: `make test`
4. **Format code**: `make format`
5. **Commit**: `git commit -m "feat: add new feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Create PR**: On GitHub

**Contributing Guide:** See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📚 Project Structure

```
PhenoRx/
│
├── app.py                       # Flask app factory - serves the JSON API and the built SPA
├── config.py                    # Environment configuration
├── schemas.py                   # Pydantic request/response validation
│
├── routes/                      # API blueprints
│   ├── views.py                 #   serves client/dist + the remaining Jinja pages
│   ├── predict.py               #   /predict, /sample_data, /mitigation_strategies
│   ├── report.py                #   /generate_report, /api/chat, AI drug insights
│   ├── clinical.py              #   lab interpretation, assessments, counselling
│   └── health.py                #   /health, /ready, /live, /metrics
│
├── services/                    # Business logic
│   ├── ml_service.py            #   model loading + inference (singleton)
│   ├── gemini_service.py        #   AI narratives, with offline fallbacks
│   ├── clinical_service.py      #   lab reference ranges + interpretation
│   └── pharmacogenomics/        #   CYP / transporter / HLA rule engines
│
├── utils/                       # Record store, logging, model loading, errors
│
├── client/                      # React 19 + Vite SPA  ← the frontend
│   ├── src/
│   │   ├── pages/               #   one file per route (+ assessment/Sections.jsx)
│   │   ├── components/
│   │   │   ├── ui/              #     shadcn/ui primitives
│   │   │   ├── layout/          #     AppShell, TopBar, Footer
│   │   │   └── clinical/        #     RiskMeter, LabInput, SignaturePad, ...
│   │   ├── lib/                 #   api client, zod schemas, clinical + dosing logic
│   │   ├── hooks/               #   one TanStack Query hook per endpoint
│   │   ├── context/             #   AssessmentContext (sessionStorage-backed)
│   │   └── index.css            #   Tailwind v4 theme (light-only medical palette)
│   └── dist/                    #   build output - Flask serves this
│
├── templates/                   # Jinja pages not yet migrated (about, docs, legal)
├── static/                      # Assets for those Jinja pages only
│
├── models/                      # Trained artifacts (adr_model.pkl, preprocessor)
├── data/                        # Datasets + saved assessments
├── config/                      # ml_config.yaml
│
├── scripts/                     # Ops + ML pipeline (build.sh, model_trainer.py, ...)
├── tests/                       # pytest suite + tests/js (node --test)
├── docs/                        # Documentation
│
├── requirements.txt             # Production dependencies
├── requirements-dev.txt         # Development dependencies
├── package.json                 # Runs the JS unit tests (node --test)
├── Dockerfile / docker-compose.yml
├── Procfile / render.yaml       # Both run `gunicorn app:app`
├── Makefile / pyproject.toml / pytest.ini / dvc.yaml
└── legacy/                      # Pre-migration frontend, archived (safe to delete)
```

### How the two halves fit together

- **Development**: run `python app.py` (port 5000) and `cd client && npm run dev` (port 5173).
  Vite proxies API calls to Flask, so the browser only ever talks to one origin.
- **Production**: `cd client && npm run build` emits `client/dist/`, which `routes/views.py`
  serves. A single `gunicorn app:app` process serves both the API and the frontend.
## 🔌 API Endpoints

### Health & Status

- **GET /health** - Health check endpoint
- **GET /status** - Detailed system status
- **GET /ready** - Kubernetes readiness probe
- **GET /live** - Kubernetes liveness probe

### Core Functionality

- **POST /predict** - Predict ADR risk for a patient
- **POST /generate_report** - Generate AI-powered clinical report
- **POST /drug-interactions** - Check drug-drug interactions
- **POST /calculate-dose** - Calculate personalized dosing

### Example: Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "components": {
    "model_loaded": true,
    "preprocessor_loaded": true,
    "ai_client_configured": true
  },
  "timestamp": "2025-01-20T10:30:00"
}
```

### Example: Predict ADR Risk

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 65,
    "sex": "M",
    "ethnicity": "White",
    "bmi": 28.5,
    "creatinine": 1.2,
    "egfr": 75,
    "ast_alt": 35,
    "diabetes": 1,
    "ckd": 1
  }'
```

---

## 📊 Model Information

### Training Data
- **200,000 synthetic patient records**
- **Realistic clinical dependencies**
- **16 different ADR types**
- **50+ clinical features**

### Model Performance
- **Algorithm**: XGBoost Classifier
- **Accuracy**: ~87%
- **F1 Score**: ~84%
- **Features**: Demographics, labs, comorbidities, medications, genomics
- **Validation**: Stratified train-test split

### Supported ADR Types
- Hepatotoxicity
- Nephrotoxicity
- Cardiovascular Events (Arrhythmia)
- Severe Cutaneous Reactions
- Gastrointestinal Effects
- Hypersensitivity Reactions
- And more...

---

## 🔒 Configuration

### Environment Variables

Create `.env` file:

```env
# API Keys (Required)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_DRUG_INTERACTIONS=your_gemini_api_key_here

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1

# Application Settings
SECRET_KEY=your_secret_key_here

# Optional
LOG_LEVEL=INFO
```

Get Gemini API key: https://aistudio.google.com/app/apikey

---

## 🚢 Deployment

### Production with Gunicorn

```bash
gunicorn --bind 0.0.0.0:5000 \
         --workers 4 \
         --timeout 120 \
         --access-logfile - \
         --error-logfile - \
         app:app
```

### Docker Production

```bash
docker-compose up -d
```

### Environment Variables for Production

```env
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=<strong-random-secret>
GEMINI_API_KEY=<production-key>
LOG_LEVEL=WARNING
```

---

## ⚠️ Clinical Considerations

### Important Disclaimers
- **For Research/Educational Use Only**
- **Not for Clinical Decision Making**
- **Requires Clinical Validation**
- **Synthetic Training Data**

### Best Practices
- Always validate predictions with clinical judgment
- Consider patient-specific factors not captured in the model
- Use as a decision support tool, not replacement for clinical expertise
- Regular model updates with real-world data recommended

---

## 📖 Documentation

- **[Installation Guide](INSTALLATION.md)** - Complete setup instructions
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Medical Student Guide](MEDICAL_STUDENT_GUIDE.md)** - Educational content
- **[Quick Reference](QUICK_REFERENCE_CARD.md)** - Quick reference card
- **[Project Overview](PROJECT_OVERVIEW.md)** - Architecture and features

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Fork and clone repository
git clone https://github.com/YOUR_USERNAME/PhenoRx.git

# Install dev dependencies
make install-dev

# Create branch
git checkout -b feature/my-feature

# Make changes and test
make test
make lint

# Submit PR
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Issues**: https://github.com/shoibahmad/PhenoRx/issues
- **Discussions**: https://github.com/shoibahmad/PhenoRx/discussions
- **Documentation**: See `docs/` directory

---

## 🎓 Citation

If you use this project in your research or education, please cite:

```bibtex
@software{medai_vigi_2025,
  title={PhenoRx: An Intelligent System for Automated ADR Identification},
  author={Ahmad, Shoib and Contributors},
  year={2025},
  url={https://github.com/shoibahmad/PhenoRx}
}
```

---

## 🌟 Acknowledgments

- Google Gemini AI for natural language processing
- Scikit-learn and XGBoost communities
- Flask framework developers
- All contributors and users

---

**Built with ❤️ for healthcare innovation**

**Status:** Production Ready ✅ | **Version:** 2.0.0 | **Last Updated:** January 2025


## New Medication Safety Features

### Medication Interaction Checker
The system now includes a medication interaction checker that can identify potential drug-drug interactions:
- High severity interactions (contraindicated)
- Moderate severity interactions (requires monitoring)
- Comprehensive interaction database

### Dosage Calculator
Advanced dosage calculation capabilities:
- Weight-based dosing for common medications
- Renal function adjustments
- Automatic dose recommendations



## Patient Risk Assessment System

### Risk Scoring
Advanced patient risk assessment capabilities:
- Multi-factor risk calculation (age, gender, comorbidities)
- Medication count impact analysis
- Risk level categorization (low/moderate/high/critical)

### Alert Management
Comprehensive alert system for patient safety:
- Real-time alert creation and tracking
- Severity-based alert prioritization
- Alert acknowledgment workflow
- Critical alert monitoring

