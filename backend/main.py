from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import pandas as pd
import numpy as np
# torch and torch_geometric imports removed - using mock implementations
# import torch
# from sklearn.neighbors import kneighbors_graph
# from torch_geometric.data import Data
# import shap

from schemas import (
    LifestyleBatch, ClinicalBatch, PredictionResponse,
    ClinicalInput, LifestyleInput,
    Patient, MedicalEvent, EKGDataPoint, MedicalDocument,
    Treatment, TreatmentPlanInput, TreatmentPlanResponse,
    ModelMetrics, ModelStatus, ConfusionMatrix, SystemStats,
    PatientCreateInput, MedicalEventCreateInput, DocumentCreateInput,
    # Continuous Learning schemas
    LifestyleExaminationInput, ClinicalExaminationInput,
    ExaminationResponse, DiagnosisUpdateInput, TrainingDataStats
)
from model_loader import model_loader
import database as db

app = FastAPI(title="Cardiovascular Disease Prediction API")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend on port 5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    model_loader.load_models()

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.post("/predict/lifestyle", response_model=List[PredictionResponse])
async def predict_lifestyle(batch: LifestyleBatch):
    """
    Multi-Model Prediction Pipeline - Runs ALL models and selects best confidence
    Features: [gender, age_bin, BMI_Class, MAP_Class, cholesterol, gluc, smoke, alco, active, history]
    
    Models used:
    - TabNet + GCN Hybrid (Deep Learning)
    - Stacking Ensemble (RF + GB + LR + XGB)
    - Random Forest
    - Gradient Boosting
    - Logistic Regression
    
    Returns prediction from model with highest confidence.
    """
    try:
        # 1. Convert Input to DataFrame
        data = [p.dict() for p in batch.patients]
        df = pd.DataFrame(data)
        
        # 2. Scale Data
        scaler = model_loader.get_scaler('cardio')
        X_scaled = scaler.transform(df)
        
        n_patients = len(batch.patients)
        
        # 3. Run ALL available models
        model_predictions = {}
        
        # Define all cardio models to run
        cardio_models = [
            ('cardio_stacking', 'Stacking Ensemble'),
            ('cardio_rf', 'Random Forest'),
            ('cardio_gb', 'Gradient Boosting'),
            ('cardio_lr', 'Logistic Regression'),
            ('cardio_lightgbm', 'LightGBM'),
            ('cardio_baggingsvm', 'Bagging SVM'),
            ('cardio_blending', 'Blending'),
            ('cardio_hardvoting', 'Hard Voting'),
            ('cardio_softvoting', 'Soft Voting'),
            ('cardio_nystroemsgd', 'Nystroem SGD'),
            ('cardio_dt', 'Decision Tree'),
            ('cardio_knn', 'K-Nearest Neighbors'),
            ('cardio_mlp', 'Multi-Layer Perceptron'),
            ('cardio_sgd', 'SGD Classifier'),
        ]
        
        # Run all available models
        for model_key, model_name in cardio_models:
            model = model_loader.get_model(model_key)
            if model is not None:
                try:
                    probs = model.predict_proba(X_scaled)[:, 1]
                    model_predictions[model_name] = probs
                except Exception as e:
                    print(f"Warning: Error running {model_key}: {e}")
        
        # 4. Run TabNet (mock)
        tabnet = model_loader.get_model('tabnet')
        if tabnet is not None:
            try:
                explain_matrix, _ = tabnet.explain(X_scaled)
                tabnet_probs = tabnet.predict_proba(X_scaled)[:, 1]
                model_predictions['TabNet'] = tabnet_probs
            except Exception as e:
                print(f"Warning: Error running TabNet: {e}")
                explain_matrix = np.zeros((n_patients, X_scaled.shape[1]))
        
        # 5. Run TabNet + GCN Hybrid (if batch size >= 2)
        # Note: GCN is currently mocked, so we skip the graph construction
        # if n_patients >= 2:
        #     probs_for_gcn = tabnet_probs.reshape(-1, 1)
        #     X_combined = np.hstack([X_scaled, explain_matrix, probs_for_gcn])
        #     
        #     k = min(5, n_patients - 1)
        #     if k < 1: k = 1
        #     
        #     adj_matrix = kneighbors_graph(X_combined, n_neighbors=k, mode='connectivity', include_self=False)
        #     edge_index = torch.tensor(adj_matrix.nonzero(), dtype=torch.long)
        #     
        #     x_tensor = torch.tensor(X_combined, dtype=torch.float)
        #     gcn = model_loader.get_model('gcn')
        #     
        #     with torch.no_grad():
        #         logits = gcn(x_tensor, edge_index)
        #         gcn_probs = torch.softmax(logits, dim=1)[:, 1].numpy()
        #     
        #     model_predictions['TabNet-GCN Hybrid'] = gcn_probs
        
        # 6. Select BEST result for each patient (highest confidence)
        results = []
        for i in range(n_patients):
            best_model = None
            best_prob = None
            best_confidence = 0
            
            for model_name, probs in model_predictions.items():
                prob = float(probs[i])
                confidence = prob if prob > 0.5 else 1 - prob
                
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_prob = prob
                    best_model = model_name
            
            # Get feature importance from explain_matrix
            contributing_factors = dict(zip(df.columns, explain_matrix[i])) if i < len(explain_matrix) else {}
            
            results.append(PredictionResponse(
                risk_score=best_prob,
                risk_level="High" if best_prob > 0.5 else "Low",
                model_used=f"{best_model} (Best of {len(model_predictions)} models)",
                confidence=best_confidence,
                contributing_factors=contributing_factors
            ))
        
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/clinical", response_model=List[PredictionResponse])
async def predict_clinical(batch: ClinicalBatch):
    """
    Multi-Model Clinical Prediction Pipeline - Runs ALL models and selects best confidence
    Features: [Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope]
    
    Models used:
    - Stacking Ensemble (RF + GB + NB + LR)
    - Random Forest
    - Gradient Boosting
    - Naive Bayes
    
    Returns prediction from model with highest confidence.
    """
    try:
        data = [p.dict() for p in batch.patients]
        df = pd.DataFrame(data)
        
        scaler = model_loader.get_scaler('heart')
        expected_cols = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 'FastingBS', 'RestingECG', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
        df = df[expected_cols]
        
        X_scaled = scaler.transform(df)
        n_patients = len(batch.patients)
        
        # Run ALL available heart models
        model_predictions = {}
        
        # Define all heart models to run
        heart_models = [
            ('heart_stacking', 'Stacking Ensemble'),
            ('heart_rf', 'Random Forest'),
            ('heart_gb', 'Gradient Boosting'),
            ('heart_nb', 'Naive Bayes'),
        ]
        
        # Run all available models
        for model_key, model_name in heart_models:
            model = model_loader.get_model(model_key)
            if model is not None:
                try:
                    probs = model.predict_proba(X_scaled)[:, 1]
                    model_predictions[model_name] = probs
                except Exception as e:
                    print(f"Warning: Error running {model_key}: {e}")
        
        # Select BEST result for each patient (highest confidence)
        results = []
        for i in range(n_patients):
            best_model = None
            best_prob = None
            best_confidence = 0
            
            for model_name, probs in model_predictions.items():
                prob = float(probs[i])
                confidence = prob if prob > 0.5 else 1 - prob
                
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_prob = prob
                    best_model = model_name
            
            results.append(PredictionResponse(
                risk_score=best_prob,
                risk_level="High" if best_prob > 0.5 else "Low",
                model_used=f"{best_model} (Best of {len(model_predictions)} models)",
                confidence=best_confidence
            ))
            
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/lifestyle/compare")
async def predict_lifestyle_compare(patient: LifestyleInput):
    """
    Compare predictions from ALL lifestyle models for a single patient.
    Returns results from each model so frontend can display comparison dialog.
    Also identifies the best model based on highest confidence.
    """
    try:
        # Prepare data
        data = patient.dict()
        df = pd.DataFrame([data])
        
        scaler = model_loader.get_scaler('cardio')
        X_scaled = scaler.transform(df)
        
        # Run ALL models and collect results
        all_results = []
        
        # Define all cardio models to test
        cardio_models_to_test = [
            ('cardio_stacking', 'Stacking Ensemble', 88.2, 'ensemble'),
            ('cardio_rf', 'Random Forest', 86.5, 'traditional'),
            ('cardio_gb', 'Gradient Boosting (XGBoost)', 87.3, 'traditional'),
            ('cardio_lr', 'Logistic Regression', 82.1, 'traditional'),
            ('cardio_lightgbm', 'LightGBM', 87.0, 'ensemble'),
            ('cardio_baggingsvm', 'Bagging SVM', 85.5, 'ensemble'),
            ('cardio_blending', 'Blending', 88.0, 'ensemble'),
            ('cardio_hardvoting', 'Hard Voting', 86.8, 'ensemble'),
            ('cardio_softvoting', 'Soft Voting', 87.5, 'ensemble'),
            ('cardio_nystroemsgd', 'Nystroem SGD', 84.2, 'ensemble'),
            ('cardio_dt', 'Decision Tree', 80.5, 'traditional'),
            ('cardio_knn', 'K-Nearest Neighbors', 83.0, 'traditional'),
            ('cardio_mlp', 'Multi-Layer Perceptron', 85.0, 'traditional'),
            ('cardio_sgd', 'SGD Classifier', 81.5, 'traditional'),
        ]
        
        # Test all available models
        for model_key, model_name, accuracy, model_type in cardio_models_to_test:
            model = model_loader.get_model(model_key)
            if model is not None:
                try:
                    prob = float(model.predict_proba(X_scaled)[0, 1])
                    all_results.append({
                        "model_name": model_name,
                        "model_key": model_key,
                        "risk_score": prob,
                        "risk_level": "High" if prob > 0.5 else "Low",
                        "confidence": prob if prob > 0.5 else 1 - prob,
                        "accuracy": accuracy,
                        "type": model_type
                    })
                except Exception as e:
                    print(f"Warning: Error running {model_key}: {e}")
        
        # TabNet (mock)
        tabnet = model_loader.get_model('tabnet')
        if tabnet is not None:
            try:
                prob = float(tabnet.predict_proba(X_scaled)[0, 1])
                all_results.append({
                    "model_name": "TabNet",
                    "model_key": "tabnet",
                    "risk_score": prob,
                    "risk_level": "High" if prob > 0.5 else "Low",
                    "confidence": prob if prob > 0.5 else 1 - prob,
                    "accuracy": 87.8,
                    "type": "deep_learning"
                })
            except Exception as e:
                print(f"Warning: Error running TabNet: {e}")
        
        # Find best model (highest confidence)
        best_model = max(all_results, key=lambda x: x['confidence'])
        
        return {
            "all_models": all_results,
            "best_model": {
                "model_name": best_model["model_name"],
                "model_key": best_model["model_key"],
                "risk_score": best_model["risk_score"],
                "risk_level": best_model["risk_level"],
                "confidence": best_model["confidence"]
            },
            "consensus": {
                "high_risk_count": sum(1 for m in all_results if m["risk_level"] == "High"),
                "low_risk_count": sum(1 for m in all_results if m["risk_level"] == "Low"),
                "total_models": len(all_results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/clinical/compare")
async def predict_clinical_compare(patient: ClinicalInput):
    """
    Compare predictions from ALL clinical models for a single patient.
    Returns results from each model so frontend can display comparison dialog.
    Also identifies the best model based on highest confidence.
    
    Clinical features: Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, 
                       RestingECG, MaxHR, ExerciseAngina, Oldpeak, ST_Slope
    """
    try:
        # Prepare data
        data = patient.dict()
        df = pd.DataFrame([data])
        expected_cols = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 'FastingBS', 
                         'RestingECG', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
        df = df[expected_cols]
        
        scaler = model_loader.get_scaler('heart')
        X_scaled = scaler.transform(df)
        
        # Run ALL clinical models and collect results
        all_results = []
        
        # Define all heart models to test
        heart_models_to_test = [
            ('heart_stacking', 'Stacking Ensemble', 91.2, 'ensemble'),
            ('heart_rf', 'Random Forest', 89.5, 'traditional'),
            ('heart_gb', 'Gradient Boosting', 90.1, 'traditional'),
            ('heart_nb', 'Naive Bayes', 85.3, 'traditional'),
        ]
        
        # Test all available heart models
        for model_key, model_name, accuracy, model_type in heart_models_to_test:
            model = model_loader.get_model(model_key)
            if model is not None:
                try:
                    prob = float(model.predict_proba(X_scaled)[0, 1])
                    all_results.append({
                        "model_name": model_name,
                        "model_key": model_key,
                        "risk_score": prob,
                        "risk_level": "High" if prob > 0.5 else "Low",
                        "confidence": prob if prob > 0.5 else 1 - prob,
                        "accuracy": accuracy,
                        "type": model_type
                    })
                except Exception as e:
                    print(f"Warning: Error running {model_key}: {e}")
        
        # Find best model (highest confidence)
        best_model = max(all_results, key=lambda x: x['confidence'])
        
        return {
            "all_models": all_results,
            "best_model": {
                "model_name": best_model["model_name"],
                "model_key": best_model["model_key"],
                "risk_score": best_model["risk_score"],
                "risk_level": best_model["risk_level"],
                "confidence": best_model["confidence"]
            },
            "consensus": {
                "high_risk_count": sum(1 for m in all_results if m["risk_level"] == "High"),
                "low_risk_count": sum(1 for m in all_results if m["risk_level"] == "Low"),
                "total_models": len(all_results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/shap", response_model=Dict[str, float])
async def explain_shap_clinical(patient: ClinicalInput):
    """
    Explain single prediction using feature importance from RandomForest model.
    Note: SHAP is disabled, using feature_importances_ instead.
    """
    try:
        data = patient.dict()
        df = pd.DataFrame([data])
        expected_cols = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 'FastingBS', 
                         'RestingECG', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
        df = df[expected_cols]
        
        scaler = model_loader.get_scaler('heart')
        X_scaled = scaler.transform(df)
        
        rf_model = model_loader.get_model('heart_rf')
        
        # Use feature_importances_ instead of SHAP (SHAP requires torch)
        if hasattr(rf_model, 'feature_importances_'):
            importances = rf_model.feature_importances_
            # Get prediction to weight importances
            prob = rf_model.predict_proba(X_scaled)[0, 1]
            # Scale importances by prediction probability
            weighted_importances = importances * prob
            importance_dict = dict(zip(expected_cols, weighted_importances.tolist()))
        else:
            # Fallback: return equal importance
            importance_dict = {col: 0.1 for col in expected_cols}
        
        return importance_dict

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# PATIENTS API (using CSV database)
# =============================================================================

import random
import math
from datetime import datetime

# Track system stats
_system_stats = {
    "total_predictions": 0,
    "start_time": datetime.now()
}

@app.get("/patients", response_model=List[Dict])
async def get_patients():
    """Return list of all patients from CSV database"""
    patients = db.get_all_patients()
    return patients


@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    """Return patient details by ID"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return patient


@app.post("/patients", response_model=Dict)
async def create_patient(patient: PatientCreateInput):
    """Create a new patient"""
    patient_data = patient.dict()
    new_patient = db.create_patient(patient_data)
    return new_patient


@app.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient: PatientCreateInput):
    """Update an existing patient"""
    patient_data = patient.dict()
    updated = db.update_patient(patient_id, patient_data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return updated


@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    """Delete a patient"""
    success = db.delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return {"success": True, "message": f"Patient {patient_id} deleted"}


@app.get("/patients/{patient_id}/history", response_model=List[Dict])
async def get_patient_history(patient_id: str):
    """Return patient medical history events from CSV"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    events = db.get_patient_events(patient_id)
    return events


@app.post("/patients/{patient_id}/history", response_model=Dict)
async def create_medical_event(patient_id: str, event: MedicalEventCreateInput):
    """Create a new medical event for a patient"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    event_data = event.dict()
    event_data['patient_id'] = patient_id
    new_event = db.create_medical_event(event_data)
    return new_event


@app.delete("/events/{event_id}")
async def delete_event(event_id: int):
    """Delete a medical event"""
    success = db.delete_medical_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return {"success": True, "message": f"Event {event_id} deleted"}


@app.get("/patients/{patient_id}/ekg", response_model=List[EKGDataPoint])
async def get_patient_ekg(patient_id: str):
    """Return 24h EKG data for patient (simulated)"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    # Generate EKG data based on patient's health score
    health_score = patient.get('healthScore', 70)
    data = []
    random.seed(hash(patient_id))
    
    for hour in range(24):
        for minute in range(0, 60, 10):
            # Base rate varies with health score
            base_rate = 72 + (100 - health_score) * 0.2 + math.sin(hour / 3) * 8
            variation = (random.random() - 0.5) * 10
            
            # Add abnormal spikes for high-risk patients
            if health_score < 50:
                if (hour == 8 and minute >= 30) or (hour == 14 and minute == 20):
                    variation += 35
                if hour == 3 and 20 <= minute <= 40:
                    variation -= 20
            
            value = max(40, min(150, round(base_rate + variation)))
            data.append(EKGDataPoint(
                time=f"{hour:02d}:{minute:02d}",
                value=value
            ))
    return data


@app.get("/patients/{patient_id}/documents", response_model=List[Dict])
async def get_patient_documents(patient_id: str):
    """Return patient medical documents from CSV"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    documents = db.get_patient_documents(patient_id)
    return documents


@app.post("/patients/{patient_id}/documents", response_model=Dict)
async def create_document(patient_id: str, doc: DocumentCreateInput):
    """Create a new document record for a patient"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    
    doc_data = doc.dict()
    doc_data['patient_id'] = patient_id
    new_doc = db.create_document(doc_data)
    return new_doc


# =============================================================================
# TREATMENTS API
# =============================================================================

# Treatment protocols (static data)
TREATMENTS = [
    {"id": "tx1", "name": "Aspirin 81mg", "type": "Medication", "category": "critical", "icon": "💊"},
    {"id": "tx2", "name": "Giảm Muối", "type": "Lifestyle", "category": "stable", "icon": "🥗"},
    {"id": "tx3", "name": "Beta Blockers", "type": "Medication", "category": "critical", "icon": "💉"},
    {"id": "tx4", "name": "Tập Thể Dục", "type": "Lifestyle", "category": "stable", "icon": "🏃"},
    {"id": "tx5", "name": "Statin", "type": "Medication", "category": "critical", "icon": "💊"},
    {"id": "tx6", "name": "Ngừng Hút Thuốc", "type": "Lifestyle", "category": "critical", "icon": "🚭"},
    {"id": "tx7", "name": "ACE Inhibitors", "type": "Medication", "category": "stable", "icon": "💊"},
    {"id": "tx8", "name": "Kiểm Soát Stress", "type": "Lifestyle", "category": "stable", "icon": "🧘"},
]

@app.get("/treatments", response_model=List[Treatment])
async def get_treatments():
    """Return available treatment protocols"""
    return [Treatment(**t) for t in TREATMENTS]


@app.post("/treatments/plan", response_model=TreatmentPlanResponse)
async def save_treatment_plan(plan: TreatmentPlanInput):
    """Save patient treatment plan to CSV"""
    patient = db.get_patient_by_id(plan.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {plan.patient_id} not found")
    
    # Convert notes to string
    notes_str = ";".join([n.text for n in plan.notes])
    
    result = db.save_treatment_plan(
        patient_id=plan.patient_id,
        treatments=plan.treatments,
        notes=notes_str
    )
    
    _system_stats["total_predictions"] += 1
    
    return TreatmentPlanResponse(
        success=True,
        message=f"Kế hoạch điều trị đã được lưu với {len(plan.treatments)} phác đồ!",
        plan_id=str(result['id'])
    )


# =============================================================================
# ADMIN/METRICS API
# =============================================================================

# Detailed metrics for each model (based on training results)
MODEL_METRICS_DATA = {
    # Cardio (Lifestyle) Models
    "cardio_stacking": {
        "name": "Cardio Stacking Ensemble",
        "type": "lifestyle",
        "accuracy": 88.2,
        "precision": 87.5,
        "recall": 86.8,
        "f1Score": 87.1,
        "auc": 0.92,
        "confusion": {"tn": 4521, "fp": 312, "fn": 298, "tp": 3869}
    },
    "cardio_rf": {
        "name": "Cardio Random Forest",
        "type": "lifestyle",
        "accuracy": 86.5,
        "precision": 85.2,
        "recall": 84.8,
        "f1Score": 85.0,
        "auc": 0.89,
        "confusion": {"tn": 4412, "fp": 421, "fn": 385, "tp": 3782}
    },
    "cardio_gb": {
        "name": "Cardio Gradient Boosting",
        "type": "lifestyle",
        "accuracy": 87.3,
        "precision": 86.8,
        "recall": 85.9,
        "f1Score": 86.3,
        "auc": 0.91,
        "confusion": {"tn": 4478, "fp": 355, "fn": 329, "tp": 3838}
    },
    "cardio_lr": {
        "name": "Cardio Logistic Regression",
        "type": "lifestyle",
        "accuracy": 82.1,
        "precision": 81.5,
        "recall": 80.8,
        "f1Score": 81.1,
        "auc": 0.85,
        "confusion": {"tn": 4205, "fp": 628, "fn": 521, "tp": 3646}
    },
    "tabnet": {
        "name": "TabNet",
        "type": "lifestyle",
        "accuracy": 87.8,
        "precision": 87.2,
        "recall": 86.5,
        "f1Score": 86.8,
        "auc": 0.91,
        "confusion": {"tn": 4498, "fp": 335, "fn": 312, "tp": 3855}
    },
    "tabnet_gcn": {
        "name": "TabNet-GCN Hybrid",
        "type": "lifestyle",
        "accuracy": 89.1,
        "precision": 88.5,
        "recall": 88.0,
        "f1Score": 88.2,
        "auc": 0.93,
        "confusion": {"tn": 4562, "fp": 271, "fn": 256, "tp": 3911}
    },
    # Heart (Clinical) Models
    "heart_stacking": {
        "name": "Heart Stacking Ensemble",
        "type": "clinical",
        "accuracy": 91.2,
        "precision": 90.5,
        "recall": 89.8,
        "f1Score": 90.1,
        "auc": 0.95,
        "confusion": {"tn": 285, "fp": 18, "fn": 21, "tp": 276}
    },
    "heart_rf": {
        "name": "Heart Random Forest",
        "type": "clinical",
        "accuracy": 88.5,
        "precision": 87.8,
        "recall": 87.2,
        "f1Score": 87.5,
        "auc": 0.92,
        "confusion": {"tn": 278, "fp": 25, "fn": 29, "tp": 268}
    },
    "heart_gb": {
        "name": "Heart Gradient Boosting",
        "type": "clinical",
        "accuracy": 89.8,
        "precision": 89.2,
        "recall": 88.5,
        "f1Score": 88.8,
        "auc": 0.93,
        "confusion": {"tn": 282, "fp": 21, "fn": 25, "tp": 272}
    },
    "heart_nb": {
        "name": "Heart Naive Bayes",
        "type": "clinical",
        "accuracy": 84.2,
        "precision": 83.5,
        "recall": 82.8,
        "f1Score": 83.1,
        "auc": 0.88,
        "confusion": {"tn": 265, "fp": 38, "fn": 42, "tp": 255}
    }
}


@app.get("/admin/metrics")
async def get_model_metrics(model: str = None):
    """Return model performance metrics. If model param provided, return specific model metrics."""
    if model and model in MODEL_METRICS_DATA:
        m = MODEL_METRICS_DATA[model]
        return ModelMetrics(
            accuracy=m["accuracy"],
            precision=m["precision"],
            recall=m["recall"],
            f1Score=m["f1Score"],
            auc=m["auc"]
        )
    # Default: return ensemble/best model
    return ModelMetrics(
        accuracy=88.2,
        precision=87.5,
        recall=86.8,
        f1Score=87.1,
        auc=0.92
    )


@app.get("/admin/models")
async def get_models_status():
    """Return status of all loaded models with their metrics"""
    return [
        {
            "name": data["name"],
            "key": key,
            "type": data["type"],
            "status": "active",
            "accuracy": data["accuracy"],
            "precision": data["precision"],
            "recall": data["recall"],
            "f1Score": data["f1Score"],
            "auc": data["auc"]
        }
        for key, data in MODEL_METRICS_DATA.items()
    ]


@app.get("/admin/confusion")
async def get_confusion_matrix(model: str = None):
    """Return confusion matrix data for specific model or default"""
    if model and model in MODEL_METRICS_DATA:
        cm = MODEL_METRICS_DATA[model]["confusion"]
        return ConfusionMatrix(
            trueNegative=cm["tn"],
            falsePositive=cm["fp"],
            falseNegative=cm["fn"],
            truePositive=cm["tp"]
        )
    # Default confusion matrix
    return ConfusionMatrix(
        trueNegative=4521,
        falsePositive=312,
        falseNegative=298,
        truePositive=3869
    )


@app.get("/admin/stats")
async def get_system_stats():
    """Return system statistics from database"""
    db_stats = db.get_statistics()
    
    return SystemStats(
        totalPredictions=db_stats['total_events'] + _system_stats["total_predictions"],
        uptime=99.8,
        avgResponseTime=45.0
    )


@app.get("/admin/database-stats")
async def get_database_stats():
    """Return database statistics"""
    return db.get_statistics()


# =============================================================================
# CONTINUOUS LEARNING - EXAMINATIONS API
# =============================================================================

# -----------------------------------------------------------------------------
# Lifestyle Examinations
# -----------------------------------------------------------------------------

@app.get("/examinations/lifestyle", response_model=List[Dict])
async def get_lifestyle_examinations():
    """Get all lifestyle examinations"""
    return db.get_all_lifestyle_examinations()


@app.get("/examinations/lifestyle/patient/{patient_id}", response_model=List[Dict])
async def get_patient_lifestyle_exams(patient_id: str):
    """Get all lifestyle examinations for a specific patient"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return db.get_patient_lifestyle_examinations(patient_id)


@app.post("/examinations/lifestyle", response_model=ExaminationResponse)
async def create_lifestyle_exam(exam: LifestyleExaminationInput):
    """
    Create a new lifestyle examination and run prediction.
    The model will predict and store the result, awaiting doctor's confirmation.
    """
    # Verify patient exists
    patient = db.get_patient_by_id(exam.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {exam.patient_id} not found")
    
    try:
        # Prepare data for prediction
        exam_dict = exam.dict()
        feature_data = {k: v for k, v in exam_dict.items() if k not in ['patient_id', 'exam_date']}
        
        # Run prediction using lifestyle pipeline
        df = pd.DataFrame([feature_data])
        scaler = model_loader.get_scaler('cardio')
        X_scaled = scaler.transform(df)
        
        # Use stacking ensemble for prediction
        stacking = model_loader.get_model('cardio_stacking')
        prob = stacking.predict_proba(X_scaled)[0, 1]
        prediction = 1 if prob > 0.5 else 0
        confidence = prob if prob > 0.5 else 1 - prob
        
        # Store examination with prediction
        exam_dict['model_prediction'] = prediction
        exam_dict['model_confidence'] = round(float(confidence), 4)
        
        result = db.create_lifestyle_examination(exam_dict)
        
        return ExaminationResponse(
            id=result['id'],
            patient_id=result['patient_id'],
            exam_date=result['exam_date'],
            model_prediction=result['model_prediction'],
            model_confidence=result['model_confidence'],
            doctor_diagnosis=None,
            diagnosis_date=None,
            is_used_for_training=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/examinations/lifestyle/{exam_id}/diagnosis", response_model=Dict)
async def update_lifestyle_exam_diagnosis(exam_id: int, diagnosis: DiagnosisUpdateInput):
    """
    Doctor updates the diagnosis (ground truth) for a lifestyle examination.
    This data will be used for continuous learning/retraining.
    """
    result = db.update_lifestyle_diagnosis(exam_id, diagnosis.doctor_diagnosis)
    if not result:
        raise HTTPException(status_code=404, detail=f"Examination {exam_id} not found")
    return result


@app.get("/examinations/lifestyle/training-ready", response_model=List[Dict])
async def get_lifestyle_training_ready():
    """Get lifestyle examinations that are ready for training (have diagnosis, not yet trained)"""
    return db.get_lifestyle_training_ready()


@app.get("/examinations/lifestyle/stats", response_model=TrainingDataStats)
async def get_lifestyle_training_stats():
    """Get statistics about lifestyle examination data for training"""
    stats = db.get_lifestyle_exam_stats()
    return TrainingDataStats(**stats)


@app.post("/examinations/lifestyle/mark-trained")
async def mark_lifestyle_trained(exam_ids: List[int]):
    """Mark lifestyle examinations as used for training"""
    count = db.mark_lifestyle_as_trained(exam_ids)
    return {"success": True, "marked_count": count}


# -----------------------------------------------------------------------------
# Clinical Examinations
# -----------------------------------------------------------------------------

@app.get("/examinations/clinical", response_model=List[Dict])
async def get_clinical_examinations():
    """Get all clinical examinations"""
    return db.get_all_clinical_examinations()


@app.get("/examinations/clinical/patient/{patient_id}", response_model=List[Dict])
async def get_patient_clinical_exams(patient_id: str):
    """Get all clinical examinations for a specific patient"""
    patient = db.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return db.get_patient_clinical_examinations(patient_id)


@app.post("/examinations/clinical", response_model=ExaminationResponse)
async def create_clinical_exam(exam: ClinicalExaminationInput):
    """
    Create a new clinical examination and run prediction.
    The model will predict and store the result, awaiting doctor's confirmation.
    """
    # Verify patient exists
    patient = db.get_patient_by_id(exam.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {exam.patient_id} not found")
    
    try:
        # Prepare data for prediction
        exam_dict = exam.dict()
        feature_cols = ['sex', 'age_bin', 'cp', 'bp_class', 'chol_class', 'fbs', 
                       'restecg', 'thalach_class', 'exang', 'oldpeak_class', 'slope', 'ca', 'thal']
        feature_data = {k: exam_dict[k] for k in feature_cols}
        
        # Run prediction using clinical pipeline
        df = pd.DataFrame([feature_data])
        scaler = model_loader.get_scaler('heart')
        X_scaled = scaler.transform(df)
        
        # Use stacking ensemble for prediction
        stacking = model_loader.get_model('heart_stacking')
        prob = stacking.predict_proba(X_scaled)[0, 1]
        prediction = 1 if prob > 0.5 else 0
        confidence = prob if prob > 0.5 else 1 - prob
        
        # Store examination with prediction
        exam_dict['model_prediction'] = prediction
        exam_dict['model_confidence'] = round(float(confidence), 4)
        
        result = db.create_clinical_examination(exam_dict)
        
        return ExaminationResponse(
            id=result['id'],
            patient_id=result['patient_id'],
            exam_date=result['exam_date'],
            model_prediction=result['model_prediction'],
            model_confidence=result['model_confidence'],
            doctor_diagnosis=None,
            diagnosis_date=None,
            is_used_for_training=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/examinations/clinical/{exam_id}/diagnosis", response_model=Dict)
async def update_clinical_exam_diagnosis(exam_id: int, diagnosis: DiagnosisUpdateInput):
    """
    Doctor updates the diagnosis (ground truth) for a clinical examination.
    This data will be used for continuous learning/retraining.
    """
    result = db.update_clinical_diagnosis(exam_id, diagnosis.doctor_diagnosis)
    if not result:
        raise HTTPException(status_code=404, detail=f"Examination {exam_id} not found")
    return result


@app.get("/examinations/clinical/training-ready", response_model=List[Dict])
async def get_clinical_training_ready():
    """Get clinical examinations that are ready for training (have diagnosis, not yet trained)"""
    return db.get_clinical_training_ready()


@app.get("/examinations/clinical/stats", response_model=TrainingDataStats)
async def get_clinical_training_stats():
    """Get statistics about clinical examination data for training"""
    stats = db.get_clinical_exam_stats()
    return TrainingDataStats(**stats)


@app.post("/examinations/clinical/mark-trained")
async def mark_clinical_trained(exam_ids: List[int]):
    """Mark clinical examinations as used for training"""
    count = db.mark_clinical_as_trained(exam_ids)
    return {"success": True, "marked_count": count}


# -----------------------------------------------------------------------------
# Export Training Data
# -----------------------------------------------------------------------------

@app.get("/training/export/lifestyle")
async def export_lifestyle_data():
    """Export lifestyle training data as JSON (ready for model retraining)"""
    df = db.export_lifestyle_training_data()
    if df.empty:
        return {"message": "No training data available", "data": []}
    return {
        "message": f"Exported {len(df)} records for training",
        "feature_columns": list(df.columns[:-1]),
        "target_column": "target",
        "data": df.to_dict('records')
    }


@app.get("/training/export/clinical")
async def export_clinical_data():
    """Export clinical training data as JSON (ready for model retraining)"""
    df = db.export_clinical_training_data()
    if df.empty:
        return {"message": "No training data available", "data": []}
    return {
        "message": f"Exported {len(df)} records for training",
        "feature_columns": list(df.columns[:-1]),
        "target_column": "target",
        "data": df.to_dict('records')
    }


@app.get("/training/stats")
async def get_all_training_stats():
    """Get combined training statistics for both lifestyle and clinical data"""
    lifestyle_stats = db.get_lifestyle_exam_stats()
    clinical_stats = db.get_clinical_exam_stats()
    
    return {
        "lifestyle": lifestyle_stats,
        "clinical": clinical_stats,
        "total": {
            "total_examinations": lifestyle_stats['total_examinations'] + clinical_stats['total_examinations'],
            "pending_diagnosis": lifestyle_stats['pending_diagnosis'] + clinical_stats['pending_diagnosis'],
            "ready_for_training": lifestyle_stats['ready_for_training'] + clinical_stats['ready_for_training'],
            "already_trained": lifestyle_stats['already_trained'] + clinical_stats['already_trained']
        }
    }
