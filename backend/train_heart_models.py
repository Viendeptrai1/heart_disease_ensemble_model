#!/usr/bin/env python3
"""
Train Heart Clinical Models
============================
Train machine learning models for clinical heart disease prediction.
Saves trained models to the models/ directory.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def train_heart_models():
    """Train and save heart clinical models"""
    
    # Paths
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
    
    # Load data
    heart_df = pd.read_csv(os.path.join(data_dir, 'heart_clinical.csv'))
    print(f"Loaded {len(heart_df)} records from heart_clinical.csv")
    
    # Prepare features and target
    feature_cols = ['Age', 'Sex', 'ChestPainType', 'RestingBP', 'Cholesterol', 'FastingBS', 
                    'RestingECG', 'MaxHR', 'ExerciseAngina', 'Oldpeak', 'ST_Slope']
    X = heart_df[feature_cols].values
    y = heart_df['HeartDisease'].values
    
    print(f"\nFeatures: {feature_cols}")
    print(f"Target distribution: {np.bincount(y)}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"\nTrain set: {len(X_train)} | Test set: {len(X_test)}")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler
    scaler_path = os.path.join(models_dir, 'heart_scaler.pkl')
    joblib.dump(scaler, scaler_path)
    print(f"✓ Scaler saved to {scaler_path}")
    
    models = {}
    
    # Train Random Forest
    print("\n" + "="*60)
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train_scaled, y_train)
    y_pred = rf.predict(X_test_scaled)
    y_proba = rf.predict_proba(X_test_scaled)[:, 1]
    
    print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"  F1:        {f1_score(y_test, y_pred):.4f}")
    print(f"  AUC:       {roc_auc_score(y_test, y_proba):.4f}")
    
    models['heart_rf'] = rf
    
    # Train Gradient Boosting
    print("\n" + "="*60)
    print("Training Gradient Boosting...")
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_train_scaled, y_train)
    y_pred = gb.predict(X_test_scaled)
    y_proba = gb.predict_proba(X_test_scaled)[:, 1]
    
    print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"  F1:        {f1_score(y_test, y_pred):.4f}")
    print(f"  AUC:       {roc_auc_score(y_test, y_proba):.4f}")
    
    models['heart_gb'] = gb
    
    # Train Naive Bayes
    print("\n" + "="*60)
    print("Training Naive Bayes...")
    nb = GaussianNB()
    nb.fit(X_train_scaled, y_train)
    y_pred = nb.predict(X_test_scaled)
    y_proba = nb.predict_proba(X_test_scaled)[:, 1]
    
    print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"  F1:        {f1_score(y_test, y_pred):.4f}")
    print(f"  AUC:       {roc_auc_score(y_test, y_proba):.4f}")
    
    models['heart_nb'] = nb
    
    # Train Stacking Ensemble
    print("\n" + "="*60)
    print("Training Stacking Ensemble...")
    estimators = [
        ('rf', rf),
        ('gb', gb),
        ('nb', nb)
    ]
    stacking = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=5
    )
    stacking.fit(X_train_scaled, y_train)
    y_pred = stacking.predict(X_test_scaled)
    y_proba = stacking.predict_proba(X_test_scaled)[:, 1]
    
    print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"  F1:        {f1_score(y_test, y_pred):.4f}")
    print(f"  AUC:       {roc_auc_score(y_test, y_proba):.4f}")
    
    models['heart_stacking'] = stacking
    
    # Save all models
    print("\n" + "="*60)
    print("Saving models...")
    for name, model in models.items():
        model_path = os.path.join(models_dir, f'{name}.pkl')
        joblib.dump(model, model_path)
        print(f"✓ {name} saved to {model_path}")
    
    print("\n" + "="*60)
    print("✅ ALL HEART MODELS TRAINED AND SAVED")
    print("="*60)

if __name__ == "__main__":
    train_heart_models()

