# Heart Disease Prediction System

A comprehensive machine learning system for predicting cardiovascular disease risk using ensemble models, featuring a modern React frontend and FastAPI backend with continuous learning capabilities.

## 🌟 Features

- **Multi-Model Ensemble Predictions**: Combines Random Forest, Gradient Boosting, Logistic Regression, and Stacking Ensemble
- **Dual Prediction Modes**: 
  - Lifestyle-based predictions (cardio dataset)
  - Clinical feature predictions (heart dataset)
- **Model Comparison**: Compare predictions across all models to find the best confidence
- **Continuous Learning**: Collect new examination data and retrain models
- **Patient Management**: Full CRUD operations for patients, medical events, and documents
- **Treatment Planning**: Create and manage treatment plans
- **Real-time Dashboards**: Monitor model performance, system stats, and training data
- **CSV-Based Database**: Lightweight data storage without external database dependencies

## 📋 Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Model Information](#model-information)
- [Continuous Learning](#continuous-learning)
- [Troubleshooting](#troubleshooting)

## 🔧 Requirements

### System Requirements
- Python 3.8+ (recommended: 3.10)
- Node.js 16+ (recommended: 18)
- npm or yarn
- 4GB RAM minimum
- 2GB free disk space

### Optional
- Docker & Docker Compose (for containerized deployment)

## 📦 Installation

### Option 1: Automated Installation

```bash
# Clone the repository
git clone <repository-url>
cd heart_disease_ensemble_model

# Run installation script
chmod +x install.sh
./install.sh
```

### Option 2: Manual Installation

#### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🚀 Quick Start

### Development Mode

#### Option 1: Using Startup Script

```bash
chmod +x start.sh
./start.sh
```

The script will:
1. Activate virtual environment
2. Install dependencies (if needed)
3. Start backend on http://localhost:8000
4. Start frontend on http://localhost:5173

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 🐳 Docker Setup

### Quick Docker Start

```bash
chmod +x start-docker.sh
./start-docker.sh
```

### Manual Docker Commands

```bash
# Build and start services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Environment Configuration

1. Copy the environment template:
```bash
cp env_template.txt .env
```

2. Edit `.env` file as needed (default values should work for local development)

## 📚 API Documentation

### Prediction Endpoints

#### Lifestyle Prediction
```bash
POST /predict/lifestyle
Content-Type: application/json

{
  "patients": [
    {
      "gender": 1,
      "age_bin": 2,
      "BMI_Class": 1,
      "MAP_Class": 2,
      "cholesterol": 1,
      "gluc": 1,
      "smoke": 0,
      "alco": 0,
      "active": 1,
      "history": 0
    }
  ]
}
```

#### Clinical Prediction
```bash
POST /predict/clinical
Content-Type: application/json

{
  "patients": [
    {
      "Age": 55,
      "Sex": 1,
      "ChestPainType": 2,
      "RestingBP": 130,
      "Cholesterol": 250,
      "FastingBS": 0,
      "RestingECG": 0,
      "MaxHR": 150,
      "ExerciseAngina": 0,
      "Oldpeak": 1.5,
      "ST_Slope": 1
    }
  ]
}
```

#### Compare All Models
```bash
POST /predict/lifestyle/compare
POST /predict/clinical/compare
```

### Patient Management

```bash
GET    /patients                    # List all patients
GET    /patients/{patient_id}       # Get patient details
POST   /patients                    # Create patient
PUT    /patients/{patient_id}       # Update patient
DELETE /patients/{patient_id}       # Delete patient
GET    /patients/{patient_id}/history     # Get medical history
POST   /patients/{patient_id}/history     # Add medical event
GET    /patients/{patient_id}/documents   # Get documents
```

### Admin & Metrics

```bash
GET /admin/metrics               # Model performance metrics
GET /admin/models                # List all models with status
GET /admin/confusion?model=X     # Confusion matrix for model
GET /admin/stats                 # System statistics
```

### Continuous Learning

```bash
POST /examinations/lifestyle              # Create lifestyle exam
PUT  /examinations/lifestyle/{id}/diagnosis   # Update diagnosis
GET  /examinations/lifestyle/stats        # Training statistics
POST /examinations/lifestyle/mark-trained # Mark as trained

# Similar endpoints for clinical examinations
```

## 📁 Project Structure

```
heart_disease_ensemble_model/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── model_loader.py         # Model loading logic
│   ├── database.py             # CSV database operations
│   ├── schemas.py              # Pydantic models
│   ├── requirements.txt        # Python dependencies
│   ├── retrain_models.py       # Continuous learning script
│   └── data/                   # CSV database files
│       ├── patients.csv
│       ├── medical_events.csv
│       ├── documents.csv
│       ├── treatment_plans.csv
│       ├── lifestyle_examinations.csv
│       └── clinical_examinations.csv
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/              # React pages
│   │   ├── components/         # Reusable components
│   │   └── services/
│   │       └── api.js          # API client
│   ├── package.json
│   └── vite.config.js
├── models/                     # Trained ML models (.pkl files)
│   ├── scaler.pkl
│   ├── ensemble_randomforest.pkl
│   ├── ensemble_stacking.pkl
│   ├── heart_*.pkl
│   └── ...
├── data/                       # Training datasets
│   ├── cardio_cleaned.csv
│   ├── heart_clinical.csv
│   └── ...
├── notebooks/                  # Jupyter notebooks
│   ├── 01_EDA.ipynb
│   ├── 02_Preprocessing.ipynb
│   ├── 03_SingleModels.ipynb
│   ├── 04_EnsembleModels.ipynb
│   └── 05_Evaluation.ipynb
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── start.sh
├── install.sh
├── start-docker.sh
└── README.md
```

## 🤖 Model Information

### Lifestyle Models (Cardio Dataset)
- **Random Forest**: 86.5% accuracy
- **Gradient Boosting (XGBoost)**: 87.3% accuracy
- **Logistic Regression**: 82.1% accuracy
- **Stacking Ensemble**: 88.2% accuracy

### Clinical Models (Heart Dataset)
- **Random Forest**: 88.5% accuracy
- **Gradient Boosting**: 89.8% accuracy
- **Naive Bayes**: 84.2% accuracy
- **Stacking Ensemble**: 91.2% accuracy

### Features

**Lifestyle Features:**
- gender, age_bin, BMI_Class, MAP_Class
- cholesterol, gluc, smoke, alco, active, history

**Clinical Features:**
- Age, Sex, ChestPainType, RestingBP
- Cholesterol, FastingBS, RestingECG
- MaxHR, ExerciseAngina, Oldpeak, ST_Slope

## 🔄 Continuous Learning

The system supports continuous learning through examination collection and model retraining.

### Workflow

1. **Create Examination**: Patient gets examined, system makes prediction
2. **Doctor Confirms**: Doctor provides ground truth diagnosis
3. **Data Collection**: Examination marked as ready for training
4. **Model Retraining**: Periodic retraining with new data

### Retraining Models

```bash
# Activate virtual environment
source venv/bin/activate

# Retrain lifestyle models
python backend/retrain_models.py --type lifestyle

# Retrain clinical models
python backend/retrain_models.py --type clinical

# Retrain all models
python backend/retrain_models.py --type all

# Force retrain (ignore minimum samples requirement)
python backend/retrain_models.py --type all --force
```

## 🐛 Troubleshooting

### Backend Issues

**Models not loading:**
```bash
# Check if model files exist
ls -lh models/*.pkl

# Verify Python dependencies
pip list | grep -E "scikit-learn|joblib|pandas"
```

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn backend.main:app --port 8001
```

### Frontend Issues

**Port 5173 in use:**
```bash
# Kill process
lsof -ti:5173 | xargs kill -9
```

**Build fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

**Permission denied:**
```bash
# Ensure Docker is running
docker info

# Check permissions
sudo usermod -aG docker $USER
```

**Container exits immediately:**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### Common Errors

**"ModuleNotFoundError: No module named 'X'"**
```bash
# Reinstall dependencies
pip install -r backend/requirements.txt
```

**"CORS error" in browser**
- Check `CORS_ORIGINS` in `.env` matches your frontend URL
- Restart backend after changing `.env`

**"Cannot find module" in frontend**
```bash
cd frontend && npm install
```

## 📊 Testing

Run the setup validation script:

```bash
python test_setup.py
```

This will verify:
- Model files exist and load correctly
- Backend API is accessible
- Database files are present
- Frontend builds successfully

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- UCI Machine Learning Repository for datasets
- FastAPI framework
- React and Vite
- scikit-learn and ensemble learning techniques

---

For more information, visit the [API Documentation](http://localhost:8000/docs) after starting the backend server.
