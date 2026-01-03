from pydantic import BaseModel
from typing import List, Optional, Dict

# -----------------------------------------------------------------------------
# Input Schemas
# -----------------------------------------------------------------------------

class LifestyleInput(BaseModel):
    # Features: [gender, cholesterol, gluc, smoke, alco, active, age_bin, BMI_Class, MAP_Class, cluster]
    # Matches feature_names.npy order from training data
    gender: int
    cholesterol: int
    gluc: int
    smoke: int
    alco: int
    active: int
    age_bin: int
    BMI_Class: int
    MAP_Class: int
    cluster: int  # Cluster feature from K-Means clustering in preprocessing

# Batch Inputs
class LifestyleBatch(BaseModel):
    patients: List[LifestyleInput]

# -----------------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    model_used: str
    confidence: float
    contributing_factors: Optional[Dict[str, float]] = None

# -----------------------------------------------------------------------------
# Patient Schemas
# -----------------------------------------------------------------------------

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    riskLevel: str
    healthScore: int
    confidence: float

class MedicalEvent(BaseModel):
    id: int
    date: str
    type: str
    title: str
    description: str
    doctor: str
    severity: str

class EKGDataPoint(BaseModel):
    time: str
    value: int

class MedicalDocument(BaseModel):
    id: int
    name: str
    type: str
    date: str
    size: str

# Input schemas for creating new records
class PatientCreateInput(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_type: Optional[str] = None
    # Health metrics for model prediction
    cholesterol: Optional[int] = None
    gluc: Optional[int] = None
    smoke: Optional[int] = None
    alco: Optional[int] = None
    active: Optional[int] = None
    age_bin: Optional[int] = None
    BMI_Class: Optional[int] = None
    MAP_Class: Optional[int] = None
    cluster: Optional[int] = None
    # Legacy fields (will be calculated from model)
    riskLevel: Optional[str] = None
    healthScore: Optional[int] = None
    confidence: Optional[float] = None
    risk_score: Optional[float] = None

class MedicalEventCreateInput(BaseModel):
    patient_id: str
    date: str
    type: str  # test, medication, hospitalization, surgery, checkup
    title: str
    description: str
    doctor: str
    severity: str  # low, medium, high

class DocumentCreateInput(BaseModel):
    patient_id: str
    name: str
    type: str  # pdf, xray, lab, report, image
    date: str
    size: str
    file_path: Optional[str] = None

# -----------------------------------------------------------------------------
# Continuous Learning - Examination Schemas
# -----------------------------------------------------------------------------

class LifestyleExaminationInput(BaseModel):
    """Input for creating a new lifestyle examination (matches cardio_train.csv features)"""
    patient_id: str
    exam_date: str
    # Features matching cardio model (in feature_names.npy order)
    gender: int           # 1=Male, 0=Female (or 2=Male, 1=Female based on original data)
    cholesterol: int      # 1=Normal, 2=Above Normal, 3=Well Above Normal
    gluc: int             # 1=Normal, 2=Above Normal, 3=Well Above Normal
    smoke: int            # 0=No, 1=Yes
    alco: int             # 0=No, 1=Yes
    active: int           # 0=No, 1=Yes
    age_bin: int          # Age group: 0-4 bins
    BMI_Class: int        # BMI category: 0=Normal, 1=Overweight, 2=Obese, 3=Severely Obese
    MAP_Class: int        # Mean Arterial Pressure class: 0-3
    cluster: int          # Cluster feature from K-Means (0-n_clusters)

class ExaminationResponse(BaseModel):
    """Response after creating an examination with prediction"""
    id: int
    patient_id: str
    exam_date: str
    model_prediction: int           # 0=Low Risk, 1=High Risk
    model_confidence: float
    doctor_diagnosis: Optional[int] = None  # Ground truth from doctor
    diagnosis_date: Optional[str] = None
    is_used_for_training: bool = False

class DiagnosisUpdateInput(BaseModel):
    """Input for doctor to update diagnosis (ground truth)"""
    doctor_diagnosis: int  # 0=No Heart Disease, 1=Heart Disease

class TrainingDataStats(BaseModel):
    """Statistics about training data availability"""
    total_examinations: int
    pending_diagnosis: int          # Awaiting doctor's confirmation
    ready_for_training: int         # Has diagnosis, not yet used for training
    already_trained: int            # Already used for training

# -----------------------------------------------------------------------------
# Treatment Schemas
# -----------------------------------------------------------------------------

class Treatment(BaseModel):
    id: str
    name: str
    type: str
    category: str
    icon: str

class NoteData(BaseModel):
    id: str
    text: str
    x: float
    y: float
    color: str

class TreatmentPlanInput(BaseModel):
    patient_id: str
    treatments: List[str]
    notes: List[NoteData]

class TreatmentPlanResponse(BaseModel):
    success: bool
    message: str
    plan_id: Optional[str] = None

# -----------------------------------------------------------------------------
# Admin/Metrics Schemas
# -----------------------------------------------------------------------------

class ModelMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    auc: float

class ModelStatus(BaseModel):
    name: str
    status: str
    accuracy: float

class ConfusionMatrix(BaseModel):
    trueNegative: int
    falsePositive: int
    falseNegative: int
    truePositive: int

class SystemStats(BaseModel):
    totalPredictions: int
    uptime: float
    avgResponseTime: float

