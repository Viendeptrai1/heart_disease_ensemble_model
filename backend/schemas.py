from pydantic import BaseModel
from typing import List, Optional, Dict

# -----------------------------------------------------------------------------
# Input Schemas
# -----------------------------------------------------------------------------

class LifestyleInput(BaseModel):
    # Features: [gender, age_bin, BMI_Class, MAP_Class, cholesterol, gluc, smoke, alco, active, history]
    gender: int
    age_bin: int
    BMI_Class: int
    MAP_Class: int
    cholesterol: int
    gluc: int
    smoke: int
    alco: int
    active: int
    history: int

class ClinicalInput(BaseModel):
    # Features matching heart.csv: 
    # [Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope]
    # Note: These are encoded values (numeric)
    Age: int                # Already numeric
    Sex: int                # M=1, F=0
    ChestPainType: int      # ATA=0, NAP=1, ASY=2, TA=3
    RestingBP: int          # Numeric value
    Cholesterol: int        # Numeric value
    FastingBS: int          # 0 or 1
    RestingECG: int         # Normal=0, ST=1, LVH=2
    MaxHR: int              # Numeric value
    ExerciseAngina: int     # N=0, Y=1
    Oldpeak: float          # Numeric value (can be decimal)
    ST_Slope: int           # Up=0, Flat=1, Down=2

# Batch Inputs
class LifestyleBatch(BaseModel):
    patients: List[LifestyleInput]

class ClinicalBatch(BaseModel):
    patients: List[ClinicalInput]

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
    riskLevel: str = "low"
    healthScore: int = 70
    confidence: float = 0.5

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
    # Features matching cardio model
    gender: int           # 1=Male, 0=Female (or 2=Male, 1=Female based on original data)
    age_bin: int          # Age group: 0-4 bins
    BMI_Class: int        # BMI category: 0=Normal, 1=Overweight, 2=Obese, 3=Severely Obese
    MAP_Class: int        # Mean Arterial Pressure class: 0-3
    cholesterol: int      # 1=Normal, 2=Above Normal, 3=Well Above Normal
    gluc: int             # 1=Normal, 2=Above Normal, 3=Well Above Normal
    smoke: int            # 0=No, 1=Yes
    alco: int             # 0=No, 1=Yes
    active: int           # 0=No, 1=Yes
    history: int          # 0=No history, 1=Has history

class ClinicalExaminationInput(BaseModel):
    """Input for creating a new clinical examination (matches heart.csv features)"""
    patient_id: str
    exam_date: str
    # Features matching heart model
    sex: int              # 1=Male, 0=Female
    age_bin: int          # Age group: 0-4 bins
    cp: int               # Chest pain type: 0-3 (TA, ATA, NAP, ASY)
    bp_class: int         # Blood pressure class: 0=Normal, 1=Elevated, 2=High, 3=Crisis
    chol_class: int       # Cholesterol class: 0=Desirable, 1=Borderline, 2=High
    fbs: int              # Fasting blood sugar > 120: 0=No, 1=Yes
    restecg: int          # Resting ECG: 0=Normal, 1=ST, 2=LVH
    thalach_class: int    # Max heart rate class: 0-3
    exang: int            # Exercise angina: 0=No, 1=Yes
    oldpeak_class: int    # ST depression class: 0-3
    slope: int            # ST slope: 0=Up, 1=Flat, 2=Down
    ca: int               # Number of major vessels: 0-4
    thal: int             # Thalassemia: 1=Normal, 2=Fixed Defect, 3=Reversible Defect

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

