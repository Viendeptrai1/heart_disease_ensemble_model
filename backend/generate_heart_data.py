#!/usr/bin/env python3
"""
Generate Heart Clinical Dataset from Cardio Data
=================================================
This script creates a synthetic clinical dataset compatible with the heart disease
prediction models by transforming cardio_train.csv features.

The generated dataset will have features matching the Clinical prediction schema:
Age, Sex, ChestPainType, RestingBP, Cholesterol, FastingBS, RestingECG, 
MaxHR, ExerciseAngina, Oldpeak, ST_Slope
"""

import pandas as pd
import numpy as np
import os

def generate_heart_data():
    """Generate synthetic clinical heart dataset from cardio data"""
    
    # Load cardio data
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
    cardio_df = pd.read_csv(os.path.join(data_dir, 'cardio_cleaned.csv'))
    
    print(f"Loaded {len(cardio_df)} records from cardio_cleaned.csv")
    
    # Sample a subset for clinical data (e.g., 1000 records)
    np.random.seed(42)
    sample_size = min(1000, len(cardio_df))
    cardio_sample = cardio_df.sample(n=sample_size, random_state=42)
    
    # Transform to clinical features
    clinical_df = pd.DataFrame()
    
    # Age (already in years if age_years exists, else convert from days)
    if 'age_years' in cardio_sample.columns:
        clinical_df['Age'] = cardio_sample['age_years'].astype(int)
    else:
        clinical_df['Age'] = (cardio_sample['age'] / 365.25).astype(int)
    
    # Sex (gender: 2=M, 1=F in cardio -> 1=M, 0=F in heart)
    clinical_df['Sex'] = (cardio_sample['gender'] == 2).astype(int)
    
    # ChestPainType (synthesize based on cardio risk)
    # 0=TA (Typical Angina), 1=ATA (Atypical Angina), 2=NAP (Non-Anginal Pain), 3=ASY (Asymptomatic)
    clinical_df['ChestPainType'] = np.random.choice([0, 1, 2, 3], size=len(cardio_sample), 
                                                      p=[0.15, 0.25, 0.35, 0.25])
    
    # RestingBP (use ap_hi - systolic blood pressure)
    clinical_df['RestingBP'] = cardio_sample['ap_hi'].values
    
    # Cholesterol (transform cholesterol categories to mg/dL values)
    # 1=Normal (<200), 2=Above Normal (200-239), 3=High (>=240)
    def map_cholesterol(x):
        if x == 1:
            return np.random.randint(150, 200)
        elif x == 2:
            return np.random.randint(200, 240)
        elif x == 3:
            return np.random.randint(240, 300)
        else:
            return 200
    clinical_df['Cholesterol'] = cardio_sample['cholesterol'].apply(map_cholesterol)
    
    # FastingBS (fasting blood sugar > 120 mg/dl: 0=No, 1=Yes)
    # Use gluc as proxy: 1=Normal (0), 2+=High (1)
    clinical_df['FastingBS'] = (cardio_sample['gluc'] > 1).astype(int)
    
    # RestingECG (resting electrocardiogram: 0=Normal, 1=ST, 2=LVH)
    clinical_df['RestingECG'] = np.random.choice([0, 1, 2], size=len(cardio_sample), 
                                                  p=[0.6, 0.25, 0.15])
    
    # MaxHR (maximum heart rate: synthesize based on age)
    # Typical: 220 - age +/- variation
    max_hr_base = 220 - clinical_df['Age']
    clinical_df['MaxHR'] = (max_hr_base + np.random.randint(-30, 30, size=len(cardio_sample))).clip(60, 200)
    
    # ExerciseAngina (exercise-induced angina: 0=No, 1=Yes)
    # Correlate with cardio target
    clinical_df['ExerciseAngina'] = (cardio_sample['cardio'].values * np.random.rand(len(cardio_sample)) > 0.3).astype(int)
    
    # Oldpeak (ST depression: 0-6.2)
    clinical_df['Oldpeak'] = np.random.uniform(0, 3, size=len(cardio_sample)).round(1)
    
    # ST_Slope (slope of peak exercise ST segment: 0=Up, 1=Flat, 2=Down)
    clinical_df['ST_Slope'] = np.random.choice([0, 1, 2], size=len(cardio_sample), 
                                                p=[0.3, 0.5, 0.2])
    
    # Target (HeartDisease: 0=Normal, 1=Heart Disease)
    clinical_df['HeartDisease'] = cardio_sample['cardio'].values
    
    # Save to CSV
    output_path = os.path.join(data_dir, 'heart_clinical.csv')
    clinical_df.to_csv(output_path, index=False)
    
    print(f"\n✅ Generated {len(clinical_df)} clinical records")
    print(f"📁 Saved to: {output_path}")
    print(f"\nFeatures: {list(clinical_df.columns)}")
    print(f"\nTarget distribution:")
    print(clinical_df['HeartDisease'].value_counts())
    
    return clinical_df

if __name__ == "__main__":
    print("="*60)
    print("GENERATING HEART CLINICAL DATASET")
    print("="*60)
    generate_heart_data()
    print("\n" + "="*60)
    print("COMPLETE")
    print("="*60)

