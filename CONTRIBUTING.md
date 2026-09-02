# Contributing to PhenoRx

Thank you for your interest in contributing to PhenoRx! This document provides guidelines for contributing to the project.

---

## Code of Conduct

Be respectful, professional, and constructive in all interactions.

---

## How to Contribute

### 1. Report Bugs

**Before submitting:**
- Check existing issues
- Verify bug with latest version
- Collect relevant information

**Bug Report Should Include:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Python version, etc.)

**Template:**
```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: Ubuntu 22.04
- Python: 3.11.0
- Browser: Chrome 120

**Additional Context:**
Any other relevant information
```

### 2. Suggest Features

**Feature Request Should Include:**
- Clear use case
- Proposed solution
- Alternative solutions considered
- Impact on existing features

### 3. Submit Pull Requests

#### Setup Development Environment

```bash
# Fork repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/PhenoRx.git
cd PhenoRx

# Add upstream remote
git remote add upstream https://github.com/shoibahmad/PhenoRx.git

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install development dependencies
make install-dev
# or
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Generate model
make build
```

#### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Run tests
make test

# Format code
make format

# Run linting
make lint

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

#### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(api): add request validation for predict endpoint

fix(model): correct probability calculation for edge cases

docs(readme): update installation instructions

test(health): add tests for health check endpoint
```

#### Atomic Commit & Test Pairing Rule

All contributors must pair code changes with their corresponding test specs in the **same atomic commit**:
- Feature additions (`feat:`) must include corresponding unit/integration tests in `tests/test_*.py` or `tests/js/*.test.js`.
- Bug fixes (`fix:`) must include a regression test proving the fix.
- Pre-commit hooks (`.pre-commit-config.yaml`) enforce Conventional Commits, Ruff, Black, and Mypy on every local commit.

#### Pull Request Guidelines

**Before Submitting:**
- [ ] Tests pass (`make test` runs Python pytest + JS test runner)
- [ ] Code is formatted (`make lint`)
- [ ] Static typing passes (`make typecheck`)
- [ ] Dependency security audit passes (`make audit`)
- [ ] All commits follow Conventional Commits format
- [ ] Branch is up-to-date with `main`

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe test approach

## Checklist
- [ ] Tests pass
- [ ] Code formatted
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
Add screenshots here
```

---

## Development Guidelines

### Code Style

**Python:**
- Follow PEP 8
- Use Black for formatting (line length: 100)
- Use type hints where appropriate
- Write docstrings for functions/classes

**Example:**
```python
def calculate_risk_score(
    age: int, comorbidities: List[str], medications: Dict[str, float]
) -> float:
    """
    Calculate patient ADR risk score.

    Args:
        age: Patient age in years
        comorbidities: List of comorbidity conditions
        medications: Dictionary of medication names and doses

    Returns:
        Risk score between 0.0 and 1.0

    Raises:
        ValueError: If age is negative or medications empty
    """
    if age < 0:
        raise ValueError("Age cannot be negative")

    # Implementation
    return risk_score
```

### Testing

**Write Tests For:**
- New features
- Bug fixes
- Edge cases
- API endpoints

**Test Structure:**
```python
def test_function_name_scenario():
    """Test description"""
    # Arrange
    input_data = {...}
    
    # Act
    result = function_under_test(input_data)
    
    # Assert
    assert result == expected_value
```

**Run Tests:**
```bash
# All tests
pytest -v

# Specific test file
pytest tests/test_health_endpoint.py -v

# With coverage
pytest --cov=. --cov-report=html
```

### Documentation

**Update Documentation When:**
- Adding new features
- Changing API endpoints
- Modifying configuration
- Adding dependencies

**Documentation Files:**
- `README.md` - Project overview
- `INSTALLATION.md` - Setup instructions
- `PROJECT_OVERVIEW.md` - Architecture details
- `MEDICAL_STUDENT_GUIDE.md` - Educational content
- API documentation in code docstrings

### Performance

**Consider:**
- Response time for API endpoints
- Memory usage for model loading
- Database query optimization
- Caching strategies

**Profiling:**
```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Code to profile
result = expensive_function()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats("cumtime")
stats.print_stats(10)
```

### Security

**Never Commit:**
- API keys
- Passwords
- Secret keys
- Personal data
- `.env` files

**Security Checklist:**
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens (if needed)
- [ ] Rate limiting considered
- [ ] Error messages don't leak info

---

## Project Structure

```
PhenoRx/
├── app.py                      # Main Flask application
├── client/                     # React + Vite frontend (SPA)
├── schemas.py                  # Request validation schemas
├── data_generator.py           # Training data generation
├── model_trainer.py            # ML model training
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── pyproject.toml             # Tool configuration
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker orchestration
├── Makefile                   # Build automation
│
├── routes/                    # API route blueprints
│   └── health.py             # Health check endpoints
│
├── utils/                     # Utility modules
│   ├── medication_interaction.py
│   ├── dosage_calculator.py
│   └── ...
│
├── models/                    # Trained ML models
│   ├── adr_model.pkl
│   └── adr_preprocessor.pkl
│
├── templates/                 # HTML templates
│   ├── index.html
│   ├── about.html
│   └── ...
│
├── static/                    # Static assets
│   ├── css/
│   └── js/
│
├── tests/                     # Test files
│   ├── test_health_endpoint.py
│   ├── test_model_training.py
│   └── test_request_validation.py
│
└── docs/                      # Documentation
    ├── MEDICAL_STUDENT_GUIDE.md
    ├── INSTALLATION.md
    └── ...
```

---

## Adding New Features

### Example: Adding New Endpoint

1. **Create route handler:**
```python
# In routes/new_feature.py
from flask import Blueprint, jsonify, request

new_feature_bp = Blueprint("new_feature", __name__)


@new_feature_bp.route("/api/new-feature", methods=["POST"])
def new_feature_endpoint():
    """
    New feature endpoint
    """
    data = request.get_json()
    # Implementation
    return jsonify({"result": "success"})
```

2. **Register blueprint:**
```python
# In app.py
from routes.new_feature import new_feature_bp

app.register_blueprint(new_feature_bp)
```

3. **Add tests:**
```python
# In tests/test_new_feature.py
def test_new_feature_endpoint(client):
    """Test new feature endpoint"""
    response = client.post("/api/new-feature", json={"data": "test"})
    assert response.status_code == 200
```

4. **Update documentation:**
```markdown
# In README.md or API_REFERENCE.md
### POST /api/new-feature
Description of new feature endpoint
```

---

## Common Tasks

### Adding New Dependency

```bash
# Add to requirements.txt with version
echo "new-package==1.0.0" >> requirements.txt

# Install
pip install new-package==1.0.0

# Update lockfile (if using pip-tools)
pip freeze > requirements.txt

# Commit both files
git add requirements.txt requirements-dev.txt
git commit -m "chore: add new-package dependency"
```

### Updating Model

```bash
# Modify data_generator.py or model_trainer.py

# Regenerate data and retrain
python data_generator.py
python model_trainer.py

# Test new model
pytest tests/test_model_training.py

# Document changes in commit
git commit -m "feat(model): improve accuracy with new features"
```

### Adding Test

```bash
# Create test file
touch tests/test_new_feature.py

# Write tests following AAA pattern
# Arrange, Act, Assert

# Run tests
pytest tests/test_new_feature.py -v

# Check coverage
pytest --cov=. --cov-report=term-missing
```

---

## Release Process

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes

**Example:** `2.1.3`

### Creating Release

```bash
# Update version in relevant files
# Update CHANGELOG.md

# Create tag
git tag -a v2.1.0 -m "Release version 2.1.0"

# Push tag
git push origin v2.1.0

# Create GitHub release with notes
```

---

## Getting Help

- **Documentation**: Check existing docs first
- **Issues**: Search existing issues
- **Discussions**: Ask questions in GitHub Discussions
- **Email**: Contact maintainers for sensitive issues

---

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Credited in release notes
- Mentioned in significant PRs

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to PhenoRx! 🚀**
