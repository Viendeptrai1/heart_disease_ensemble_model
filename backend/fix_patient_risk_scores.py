#!/usr/bin/env python3
"""
Script to recalculate risk_score for all patients in CSV using real models.
This fixes the issue where CSV has manual riskLevel/confidence instead of model predictions.
"""

import pandas as pd
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model_loader import model_loader

# Load models
print("Loading models...")
model_loader.load_models()
print(f"✓ Loaded {len(model_loader.models)} models")

# Load patients CSV
csv_path = os.path.join(os.path.dirname(__file__), 'data', 'patients.csv')
df = pd.read_csv(csv_path)

print(f"\nFound {len(df)} patients in CSV")
print(f"Current columns: {list(df.columns)}")

# Add risk_score column if not exists
if 'risk_score' not in df.columns:
    df['risk_score'] = None
    print("✓ Added 'risk_score' column")

# Check if patients have health metrics
required_metrics = ['cholesterol', 'gluc', 'smoke', 'alco', 'active', 'age_bin', 'BMI_Class', 'MAP_Class', 'cluster']
has_metrics = all(col in df.columns for col in required_metrics)

if not has_metrics:
    print("\n⚠️  WARNING: CSV does not have health metrics columns!")
    print("Cannot calculate risk_score without:")
    print("  - cholesterol, gluc, smoke, alco, active")
    print("  - age_bin, BMI_Class, MAP_Class, cluster")
    print("\nSolution:")
    print("1. Delete old patients from CSV (they have fake data)")
    print("2. Add new patients via API (they will have real metrics + risk_score)")
    print("\nFor now, keeping existing riskLevel/confidence as-is.")
    sys.exit(0)

# Calculate risk_score for each patient using best model (stacking)
model = model_loader.get_model('cardio_stacking')
scaler = model_loader.get_scaler('cardio')

if model is None:
    print("ERROR: Could not load stacking model")
    sys.exit(1)

print("\nCalculating risk_score for each patient...")
updated_count = 0

for idx, row in df.iterrows():
    # Prepare features
    features = [[
        row.get('gender', 1),
        row['cholesterol'],
        row['gluc'],
        row['smoke'],
        row['alco'],
        row['active'],
        row['age_bin'],
        row['BMI_Class'],
        row['MAP_Class'],
        row['cluster']
    ]]
    
    # Scale and predict
    X_scaled = scaler.transform(features)
    risk_score = float(model.predict_proba(X_scaled)[0, 1])
    
    # Update dataframe
    df.at[idx, 'risk_score'] = risk_score
    
    # Update riskLevel based on risk_score
    if risk_score >= 0.7:
        new_risk_level = 'high'
    elif risk_score >= 0.4:
        new_risk_level = 'medium'
    else:
        new_risk_level = 'low'
    
    df.at[idx, 'riskLevel'] = new_risk_level
    df.at[idx, 'confidence'] = risk_score if risk_score > 0.5 else (1 - risk_score)
    
    updated_count += 1
    print(f"  {row['id']}: risk_score={risk_score:.4f} → {new_risk_level}")

# Save updated CSV
df.to_csv(csv_path, index=False)
print(f"\n✅ Updated {updated_count} patients")
print(f"Saved to: {csv_path}")

