"""
CSV Database Module
Handles all CRUD operations for the CSV-based database.
"""
import pandas as pd
import os
from datetime import datetime
from typing import List, Dict, Optional
import uuid

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# CSV file paths
PATIENTS_FILE = os.path.join(DATA_DIR, 'patients.csv')
EVENTS_FILE = os.path.join(DATA_DIR, 'medical_events.csv')
DOCUMENTS_FILE = os.path.join(DATA_DIR, 'documents.csv')
TREATMENT_PLANS_FILE = os.path.join(DATA_DIR, 'treatment_plans.csv')

# Continuous Learning - Examination tables
LIFESTYLE_EXAMS_FILE = os.path.join(DATA_DIR, 'lifestyle_examinations.csv')
CLINICAL_EXAMS_FILE = os.path.join(DATA_DIR, 'clinical_examinations.csv')


def ensure_data_dir():
    """Ensure the data directory exists"""
    os.makedirs(DATA_DIR, exist_ok=True)


# =============================================================================
# PATIENTS CRUD
# =============================================================================

def get_all_patients() -> List[Dict]:
    """Get all patients from CSV"""
    try:
        df = pd.read_csv(PATIENTS_FILE)
        return df.to_dict('records')
    except FileNotFoundError:
        return []


def get_patient_by_id(patient_id: str) -> Optional[Dict]:
    """Get a single patient by ID"""
    try:
        df = pd.read_csv(PATIENTS_FILE)
        patient = df[df['id'] == patient_id]
        if patient.empty:
            return None
        return patient.iloc[0].to_dict()
    except FileNotFoundError:
        return None


def create_patient(patient_data: Dict) -> Dict:
    """Create a new patient"""
    try:
        df = pd.read_csv(PATIENTS_FILE)
    except FileNotFoundError:
        df = pd.DataFrame()
    
    # Generate new ID
    new_id = f"BN-{datetime.now().year}-{str(len(df) + 1).zfill(4)}"
    patient_data['id'] = new_id
    patient_data['created_at'] = datetime.now().strftime('%Y-%m-%d')
    
    # Append to dataframe
    new_df = pd.concat([df, pd.DataFrame([patient_data])], ignore_index=True)
    new_df.to_csv(PATIENTS_FILE, index=False)
    
    return patient_data


def update_patient(patient_id: str, update_data: Dict) -> Optional[Dict]:
    """Update a patient"""
    try:
        df = pd.read_csv(PATIENTS_FILE)
        idx = df[df['id'] == patient_id].index
        if idx.empty:
            return None
        
        for key, value in update_data.items():
            if key != 'id':  # Don't update ID
                df.loc[idx, key] = value
        
        df.to_csv(PATIENTS_FILE, index=False)
        return df.loc[idx].iloc[0].to_dict()
    except FileNotFoundError:
        return None


def delete_patient(patient_id: str) -> bool:
    """Delete a patient"""
    try:
        df = pd.read_csv(PATIENTS_FILE)
        initial_len = len(df)
        df = df[df['id'] != patient_id]
        
        if len(df) == initial_len:
            return False
        
        df.to_csv(PATIENTS_FILE, index=False)
        return True
    except FileNotFoundError:
        return False


# =============================================================================
# MEDICAL EVENTS CRUD
# =============================================================================

def get_patient_events(patient_id: str) -> List[Dict]:
    """Get all medical events for a patient"""
    try:
        df = pd.read_csv(EVENTS_FILE)
        events = df[df['patient_id'] == patient_id]
        return events.to_dict('records')
    except FileNotFoundError:
        return []


def create_medical_event(event_data: Dict) -> Dict:
    """Create a new medical event"""
    try:
        df = pd.read_csv(EVENTS_FILE)
        new_id = df['id'].max() + 1 if not df.empty else 1
    except FileNotFoundError:
        df = pd.DataFrame()
        new_id = 1
    
    event_data['id'] = new_id
    event_data['created_at'] = datetime.now().strftime('%Y-%m-%d')
    
    new_df = pd.concat([df, pd.DataFrame([event_data])], ignore_index=True)
    new_df.to_csv(EVENTS_FILE, index=False)
    
    return event_data


def delete_medical_event(event_id: int) -> bool:
    """Delete a medical event"""
    try:
        df = pd.read_csv(EVENTS_FILE)
        initial_len = len(df)
        df = df[df['id'] != event_id]
        
        if len(df) == initial_len:
            return False
        
        df.to_csv(EVENTS_FILE, index=False)
        return True
    except FileNotFoundError:
        return False


# =============================================================================
# DOCUMENTS CRUD
# =============================================================================

def get_patient_documents(patient_id: str) -> List[Dict]:
    """Get all documents for a patient"""
    try:
        df = pd.read_csv(DOCUMENTS_FILE)
        docs = df[df['patient_id'] == patient_id]
        return docs.to_dict('records')
    except FileNotFoundError:
        return []


def create_document(doc_data: Dict) -> Dict:
    """Create a new document record"""
    try:
        df = pd.read_csv(DOCUMENTS_FILE)
        new_id = df['id'].max() + 1 if not df.empty else 1
    except FileNotFoundError:
        df = pd.DataFrame()
        new_id = 1
    
    doc_data['id'] = new_id
    doc_data['created_at'] = datetime.now().strftime('%Y-%m-%d')
    
    new_df = pd.concat([df, pd.DataFrame([doc_data])], ignore_index=True)
    new_df.to_csv(DOCUMENTS_FILE, index=False)
    
    return doc_data


# =============================================================================
# TREATMENT PLANS CRUD
# =============================================================================

def get_patient_treatment_plan(patient_id: str) -> Optional[Dict]:
    """Get treatment plan for a patient"""
    try:
        df = pd.read_csv(TREATMENT_PLANS_FILE)
        plan = df[df['patient_id'] == patient_id]
        if plan.empty:
            return None
        return plan.iloc[0].to_dict()
    except FileNotFoundError:
        return None


def save_treatment_plan(patient_id: str, treatments: List[str], notes: str) -> Dict:
    """Save or update treatment plan for a patient"""
    try:
        df = pd.read_csv(TREATMENT_PLANS_FILE)
    except FileNotFoundError:
        df = pd.DataFrame()
    
    now = datetime.now().strftime('%Y-%m-%d')
    treatments_str = ','.join(treatments)
    
    # Check if plan exists
    existing = df[df['patient_id'] == patient_id]
    
    if not existing.empty:
        # Update existing
        idx = existing.index[0]
        df.loc[idx, 'treatments'] = treatments_str
        df.loc[idx, 'notes'] = notes
        df.loc[idx, 'updated_at'] = now
        plan_id = df.loc[idx, 'id']
    else:
        # Create new
        new_id = df['id'].max() + 1 if not df.empty else 1
        new_plan = {
            'id': new_id,
            'patient_id': patient_id,
            'treatments': treatments_str,
            'notes': notes,
            'status': 'active',
            'created_at': now,
            'updated_at': now
        }
        df = pd.concat([df, pd.DataFrame([new_plan])], ignore_index=True)
        plan_id = new_id
    
    df.to_csv(TREATMENT_PLANS_FILE, index=False)
    return {'id': plan_id, 'patient_id': patient_id, 'treatments': treatments, 'notes': notes}


# =============================================================================
# STATISTICS
# =============================================================================

def get_statistics() -> Dict:
    """Get database statistics"""
    try:
        patients_df = pd.read_csv(PATIENTS_FILE)
        events_df = pd.read_csv(EVENTS_FILE)
        docs_df = pd.read_csv(DOCUMENTS_FILE)
        plans_df = pd.read_csv(TREATMENT_PLANS_FILE)
        
        high_risk = len(patients_df[patients_df['riskLevel'] == 'high'])
        medium_risk = len(patients_df[patients_df['riskLevel'] == 'medium'])
        low_risk = len(patients_df[patients_df['riskLevel'] == 'low'])
        
        return {
            'total_patients': len(patients_df),
            'total_events': len(events_df),
            'total_documents': len(docs_df),
            'active_plans': len(plans_df[plans_df['status'] == 'active']),
            'high_risk_count': high_risk,
            'medium_risk_count': medium_risk,
            'low_risk_count': low_risk
        }
    except FileNotFoundError:
        return {
            'total_patients': 0,
            'total_events': 0,
            'total_documents': 0,
            'active_plans': 0,
            'high_risk_count': 0,
            'medium_risk_count': 0,
            'low_risk_count': 0
        }


# =============================================================================
# CONTINUOUS LEARNING - LIFESTYLE EXAMINATIONS CRUD
# =============================================================================

def get_all_lifestyle_examinations() -> List[Dict]:
    """Get all lifestyle examinations"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        return df.to_dict('records')
    except FileNotFoundError:
        return []


def get_patient_lifestyle_examinations(patient_id: str) -> List[Dict]:
    """Get all lifestyle examinations for a patient"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        exams = df[df['patient_id'] == patient_id]
        return exams.to_dict('records')
    except FileNotFoundError:
        return []


def create_lifestyle_examination(exam_data: Dict) -> Dict:
    """Create a new lifestyle examination with model prediction"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        new_id = int(df['id'].max()) + 1 if not df.empty else 1
    except FileNotFoundError:
        df = pd.DataFrame()
        new_id = 1
    
    exam_data['id'] = new_id
    exam_data['doctor_diagnosis'] = None
    exam_data['diagnosis_date'] = None
    exam_data['is_used_for_training'] = False
    exam_data['created_at'] = datetime.now().strftime('%Y-%m-%d')
    
    new_df = pd.concat([df, pd.DataFrame([exam_data])], ignore_index=True)
    new_df.to_csv(LIFESTYLE_EXAMS_FILE, index=False)
    
    return exam_data


def update_lifestyle_diagnosis(exam_id: int, diagnosis: int) -> Optional[Dict]:
    """Update doctor diagnosis for a lifestyle examination"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        idx = df[df['id'] == exam_id].index
        if idx.empty:
            return None
        
        df.loc[idx, 'doctor_diagnosis'] = diagnosis
        df.loc[idx, 'diagnosis_date'] = datetime.now().strftime('%Y-%m-%d')
        
        df.to_csv(LIFESTYLE_EXAMS_FILE, index=False)
        return df.loc[idx].iloc[0].to_dict()
    except FileNotFoundError:
        return None


def get_lifestyle_training_ready() -> List[Dict]:
    """Get lifestyle examinations ready for training (has diagnosis, not yet trained)"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        # Filter: has doctor diagnosis AND not used for training yet
        ready = df[(df['doctor_diagnosis'].notna()) & (df['is_used_for_training'] == False)]
        return ready.to_dict('records')
    except FileNotFoundError:
        return []


def mark_lifestyle_as_trained(exam_ids: List[int]) -> int:
    """Mark lifestyle examinations as used for training"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        count = 0
        for exam_id in exam_ids:
            idx = df[df['id'] == exam_id].index
            if not idx.empty:
                df.loc[idx, 'is_used_for_training'] = True
                count += 1
        
        df.to_csv(LIFESTYLE_EXAMS_FILE, index=False)
        return count
    except FileNotFoundError:
        return 0


def get_lifestyle_exam_stats() -> Dict:
    """Get statistics about lifestyle examinations for training"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        total = len(df)
        pending = len(df[df['doctor_diagnosis'].isna()])
        ready = len(df[(df['doctor_diagnosis'].notna()) & (df['is_used_for_training'] == False)])
        trained = len(df[df['is_used_for_training'] == True])
        
        return {
            'total_examinations': total,
            'pending_diagnosis': pending,
            'ready_for_training': ready,
            'already_trained': trained
        }
    except FileNotFoundError:
        return {
            'total_examinations': 0,
            'pending_diagnosis': 0,
            'ready_for_training': 0,
            'already_trained': 0
        }


# =============================================================================
# CONTINUOUS LEARNING - CLINICAL EXAMINATIONS CRUD
# =============================================================================

def get_all_clinical_examinations() -> List[Dict]:
    """Get all clinical examinations"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        return df.to_dict('records')
    except FileNotFoundError:
        return []


def get_patient_clinical_examinations(patient_id: str) -> List[Dict]:
    """Get all clinical examinations for a patient"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        exams = df[df['patient_id'] == patient_id]
        return exams.to_dict('records')
    except FileNotFoundError:
        return []


def create_clinical_examination(exam_data: Dict) -> Dict:
    """Create a new clinical examination with model prediction"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        new_id = int(df['id'].max()) + 1 if not df.empty else 1
    except FileNotFoundError:
        df = pd.DataFrame()
        new_id = 1
    
    exam_data['id'] = new_id
    exam_data['doctor_diagnosis'] = None
    exam_data['diagnosis_date'] = None
    exam_data['is_used_for_training'] = False
    exam_data['created_at'] = datetime.now().strftime('%Y-%m-%d')
    
    new_df = pd.concat([df, pd.DataFrame([exam_data])], ignore_index=True)
    new_df.to_csv(CLINICAL_EXAMS_FILE, index=False)
    
    return exam_data


def update_clinical_diagnosis(exam_id: int, diagnosis: int) -> Optional[Dict]:
    """Update doctor diagnosis for a clinical examination"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        idx = df[df['id'] == exam_id].index
        if idx.empty:
            return None
        
        df.loc[idx, 'doctor_diagnosis'] = diagnosis
        df.loc[idx, 'diagnosis_date'] = datetime.now().strftime('%Y-%m-%d')
        
        df.to_csv(CLINICAL_EXAMS_FILE, index=False)
        return df.loc[idx].iloc[0].to_dict()
    except FileNotFoundError:
        return None


def get_clinical_training_ready() -> List[Dict]:
    """Get clinical examinations ready for training (has diagnosis, not yet trained)"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        # Filter: has doctor diagnosis AND not used for training yet
        ready = df[(df['doctor_diagnosis'].notna()) & (df['is_used_for_training'] == False)]
        return ready.to_dict('records')
    except FileNotFoundError:
        return []


def mark_clinical_as_trained(exam_ids: List[int]) -> int:
    """Mark clinical examinations as used for training"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        count = 0
        for exam_id in exam_ids:
            idx = df[df['id'] == exam_id].index
            if not idx.empty:
                df.loc[idx, 'is_used_for_training'] = True
                count += 1
        
        df.to_csv(CLINICAL_EXAMS_FILE, index=False)
        return count
    except FileNotFoundError:
        return 0


def get_clinical_exam_stats() -> Dict:
    """Get statistics about clinical examinations for training"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        total = len(df)
        pending = len(df[df['doctor_diagnosis'].isna()])
        ready = len(df[(df['doctor_diagnosis'].notna()) & (df['is_used_for_training'] == False)])
        trained = len(df[df['is_used_for_training'] == True])
        
        return {
            'total_examinations': total,
            'pending_diagnosis': pending,
            'ready_for_training': ready,
            'already_trained': trained
        }
    except FileNotFoundError:
        return {
            'total_examinations': 0,
            'pending_diagnosis': 0,
            'ready_for_training': 0,
            'already_trained': 0
        }


# =============================================================================
# EXPORT TRAINING DATA
# =============================================================================

def export_lifestyle_training_data() -> pd.DataFrame:
    """Export lifestyle training data in format ready for model training"""
    try:
        df = pd.read_csv(LIFESTYLE_EXAMS_FILE)
        # Filter only records with doctor diagnosis
        training_df = df[df['doctor_diagnosis'].notna()].copy()
        
        # Select only features needed for training
        feature_cols = ['gender', 'age_bin', 'BMI_Class', 'MAP_Class', 'cholesterol', 
                       'gluc', 'smoke', 'alco', 'active', 'history']
        
        X = training_df[feature_cols]
        y = training_df['doctor_diagnosis'].astype(int)
        
        return pd.concat([X, y.rename('target')], axis=1)
    except FileNotFoundError:
        return pd.DataFrame()


def export_clinical_training_data() -> pd.DataFrame:
    """Export clinical training data in format ready for model training"""
    try:
        df = pd.read_csv(CLINICAL_EXAMS_FILE)
        # Filter only records with doctor diagnosis
        training_df = df[df['doctor_diagnosis'].notna()].copy()
        
        # Select only features needed for training
        feature_cols = ['sex', 'age_bin', 'cp', 'bp_class', 'chol_class', 'fbs', 
                       'restecg', 'thalach_class', 'exang', 'oldpeak_class', 'slope', 'ca', 'thal']
        
        X = training_df[feature_cols]
        y = training_df['doctor_diagnosis'].astype(int)
        
        return pd.concat([X, y.rename('target')], axis=1)
    except FileNotFoundError:
        return pd.DataFrame()

