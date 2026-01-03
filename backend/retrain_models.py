#!/usr/bin/env python3
"""
Continuous Learning - Model Retraining Script
==============================================
This script fetches new training data from the database (examinations with doctor diagnosis)
and retrains the models incrementally.

Usage:
    python retrain_models.py --type lifestyle
    python retrain_models.py --type clinical
    python retrain_models.py --type all

Can be scheduled to run periodically (e.g., weekly via cron):
    0 0 * * 0 /path/to/python /path/to/retrain_models.py --type all >> /var/log/retrain.log 2>&1
"""

import argparse
import requests
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import cross_val_score
import os

# Configuration
API_BASE_URL = "http://localhost:8000"
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
MIN_SAMPLES_FOR_RETRAIN = 50  # Minimum new samples needed before retraining

def log(message: str):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def fetch_training_data(data_type: str) -> dict:
    """Fetch training data from API"""
    endpoint = f"{API_BASE_URL}/training/export/{data_type}"
    try:
        response = requests.get(endpoint)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        log(f"Error fetching {data_type} data: {e}")
        return None

def fetch_training_stats(data_type: str) -> dict:
    """Fetch training statistics"""
    endpoint = f"{API_BASE_URL}/examinations/{data_type}/stats"
    try:
        response = requests.get(endpoint)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        log(f"Error fetching {data_type} stats: {e}")
        return None

def mark_as_trained(data_type: str, exam_ids: list):
    """Mark examinations as used for training"""
    endpoint = f"{API_BASE_URL}/examinations/{data_type}/mark-trained"
    try:
        response = requests.post(endpoint, json=exam_ids)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        log(f"Error marking {data_type} as trained: {e}")
        return None

def retrain_lifestyle_models(df: pd.DataFrame):
    """Retrain lifestyle (cardio) models with new data"""
    log("Starting lifestyle models retraining...")
    
    # Feature columns matching feature_names.npy order
    feature_cols = ['gender', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 
                   'age_bin', 'BMI_Class', 'MAP_Class', 'cluster']
    
    X = df[feature_cols].values
    y = df['target'].values
    
    # Load existing scaler
    scaler_path = os.path.join(MODELS_DIR, 'scaler.pkl')
    scaler = joblib.load(scaler_path)
    X_scaled = scaler.transform(X)
    
    # Retrain Random Forest
    log("  - Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_scaled, y)
    rf_scores = cross_val_score(rf, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    RF CV Accuracy: {rf_scores.mean():.4f} (+/- {rf_scores.std():.4f})")
    
    # Retrain Gradient Boosting
    log("  - Training Gradient Boosting...")
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_scaled, y)
    gb_scores = cross_val_score(gb, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    GB CV Accuracy: {gb_scores.mean():.4f} (+/- {gb_scores.std():.4f})")
    
    # Retrain Logistic Regression
    log("  - Training Logistic Regression...")
    lr = LogisticRegression(random_state=42, max_iter=1000)
    lr.fit(X_scaled, y)
    lr_scores = cross_val_score(lr, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    LR CV Accuracy: {lr_scores.mean():.4f} (+/- {lr_scores.std():.4f})")
    
    # Retrain Stacking Ensemble
    log("  - Training Stacking Ensemble...")
    estimators = [
        ('rf', rf),
        ('gb', gb),
        ('lr', lr)
    ]
    stacking = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=min(5, len(y))
    )
    stacking.fit(X_scaled, y)
    stacking_scores = cross_val_score(stacking, X_scaled, y, cv=min(3, len(y)), scoring='accuracy')
    log(f"    Stacking CV Accuracy: {stacking_scores.mean():.4f} (+/- {stacking_scores.std():.4f})")
    
    # Save updated models
    log("  - Saving models...")
    joblib.dump(rf, os.path.join(MODELS_DIR, 'ensemble_randomforest.pkl'))
    joblib.dump(gb, os.path.join(MODELS_DIR, 'ensemble_xgboost.pkl'))
    joblib.dump(lr, os.path.join(MODELS_DIR, 'single_logisticregression.pkl'))
    joblib.dump(stacking, os.path.join(MODELS_DIR, 'ensemble_stacking.pkl'))
    
    log("Lifestyle models retraining completed!")
    return True

def retrain_clinical_models(df: pd.DataFrame):
    """Retrain clinical (heart) models with new data"""
    log("Starting clinical models retraining...")
    
    feature_cols = ['sex', 'age_bin', 'cp', 'bp_class', 'chol_class', 'fbs', 
                   'restecg', 'thalach_class', 'exang', 'oldpeak_class', 'slope', 'ca', 'thal']
    
    X = df[feature_cols].values
    y = df['target'].values
    
    # Load existing scaler
    scaler_path = os.path.join(MODELS_DIR, 'heart_scaler.joblib')
    scaler = joblib.load(scaler_path)
    X_scaled = scaler.transform(X)
    
    # Retrain Random Forest
    log("  - Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_scaled, y)
    rf_scores = cross_val_score(rf, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    RF CV Accuracy: {rf_scores.mean():.4f} (+/- {rf_scores.std():.4f})")
    
    # Retrain Gradient Boosting
    log("  - Training Gradient Boosting...")
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_scaled, y)
    gb_scores = cross_val_score(gb, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    GB CV Accuracy: {gb_scores.mean():.4f} (+/- {gb_scores.std():.4f})")
    
    # Retrain Naive Bayes
    log("  - Training Naive Bayes...")
    nb = GaussianNB()
    nb.fit(X_scaled, y)
    nb_scores = cross_val_score(nb, X_scaled, y, cv=min(5, len(y)), scoring='accuracy')
    log(f"    NB CV Accuracy: {nb_scores.mean():.4f} (+/- {nb_scores.std():.4f})")
    
    # Retrain Stacking Ensemble
    log("  - Training Stacking Ensemble...")
    estimators = [
        ('rf', rf),
        ('gb', gb),
        ('nb', nb)
    ]
    stacking = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=min(5, len(y))
    )
    stacking.fit(X_scaled, y)
    stacking_scores = cross_val_score(stacking, X_scaled, y, cv=min(3, len(y)), scoring='accuracy')
    log(f"    Stacking CV Accuracy: {stacking_scores.mean():.4f} (+/- {stacking_scores.std():.4f})")
    
    # Save updated models
    log("  - Saving models...")
    joblib.dump(rf, os.path.join(MODELS_DIR, 'heart_rf.joblib'))
    joblib.dump(gb, os.path.join(MODELS_DIR, 'heart_gb.joblib'))
    joblib.dump(nb, os.path.join(MODELS_DIR, 'heart_nb.joblib'))
    joblib.dump(stacking, os.path.join(MODELS_DIR, 'heart_stacking.joblib'))
    
    log("Clinical models retraining completed!")
    return True

def main():
    parser = argparse.ArgumentParser(description='Retrain ML models with new examination data')
    parser.add_argument('--type', choices=['lifestyle', 'clinical', 'all'], 
                       default='all', help='Type of models to retrain')
    parser.add_argument('--force', action='store_true', 
                       help='Force retrain even if below minimum samples')
    args = parser.parse_args()
    
    log("=" * 60)
    log("CONTINUOUS LEARNING - MODEL RETRAINING SCRIPT")
    log("=" * 60)
    
    types_to_process = ['lifestyle', 'clinical'] if args.type == 'all' else [args.type]
    
    for data_type in types_to_process:
        log(f"\nProcessing {data_type.upper()} models...")
        
        # Check stats
        stats = fetch_training_stats(data_type)
        if not stats:
            continue
        
        log(f"  Total examinations: {stats['total_examinations']}")
        log(f"  Pending diagnosis: {stats['pending_diagnosis']}")
        log(f"  Ready for training: {stats['ready_for_training']}")
        log(f"  Already trained: {stats['already_trained']}")
        
        if stats['ready_for_training'] < MIN_SAMPLES_FOR_RETRAIN and not args.force:
            log(f"  ⚠️  Not enough new samples ({stats['ready_for_training']} < {MIN_SAMPLES_FOR_RETRAIN})")
            log(f"      Use --force to override minimum sample requirement")
            continue
        
        # Fetch training data
        data = fetch_training_data(data_type)
        if not data or not data.get('data'):
            log(f"  ❌ No training data available")
            continue
        
        df = pd.DataFrame(data['data'])
        log(f"  📊 Loaded {len(df)} training samples")
        
        # Retrain models
        try:
            if data_type == 'lifestyle':
                success = retrain_lifestyle_models(df)
            else:
                success = retrain_clinical_models(df)
            
            if success:
                log(f"  ✅ {data_type.upper()} models retrained successfully!")
                # Note: In production, you would mark training-ready records as trained
                # mark_as_trained(data_type, exam_ids)
        except Exception as e:
            log(f"  ❌ Error during retraining: {e}")
    
    log("\n" + "=" * 60)
    log("RETRAINING COMPLETE")
    log("=" * 60)

if __name__ == "__main__":
    main()
