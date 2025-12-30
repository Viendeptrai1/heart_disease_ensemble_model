import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report, roc_curve

import warnings
warnings.filterwarnings('ignore')

plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = (10, 6)

print("✅ Libraries imported.")

# 1. Load Data
data_path = 'data'
try:
    X_test = np.load(f'{data_path}/X_test.npy')
    y_test = np.load(f'{data_path}/y_test.npy')
    feature_names = np.load(f'{data_path}/feature_names.npy', allow_pickle=True)
    print(f"X_test: {X_test.shape}, y_test: {y_test.shape}")
except FileNotFoundError:
    print("❌ Data files not found in data/. Please run preprocessing first.")
    exit()

# 2. Load Model Results
try:
    single_results = pd.read_csv('outputs/single_models_results.csv', index_col=0)
    single_results['type'] = 'Single'
except FileNotFoundError:
    print("Single model results not found.")
    single_results = pd.DataFrame()

try:
    ensemble_results = pd.read_csv('outputs/ensemble_models_results.csv', index_col=0)
    ensemble_results['type'] = 'Ensemble'
except FileNotFoundError:
    print("Ensemble model results not found.")
    ensemble_results = pd.DataFrame()

all_results = pd.concat([single_results, ensemble_results])
if all_results.empty:
    print("❌ No results found from 03 or 04.")
    exit()

all_results = all_results.sort_values('f1', ascending=False)

print("\nModel Summary (Sorted by F1):")
print(all_results[['type', 'accuracy', 'recall', 'f1', 'roc_auc']].to_string())
all_results.to_csv('outputs/final_model_summary.csv')

# 3. Best Model Analysis
best_model_name = all_results.index[0]
best_model_type = all_results.iloc[0]['type']
print(f"\n🏆 Best Model: {best_model_name} ({best_model_type})")

# Determine filename
# Mapping names to filenames if necessary, or assuming standard format
# Standard format used: 'models/single_{name}.pkl' or 'models/ensemble_{name}.pkl'
# The result index names are like 'LogisticRegression', 'RandomForest', 'Voting'
model_filename = f"models/{best_model_type.lower()}_{best_model_name.lower()}.pkl"
# Check file existence
if not os.path.exists(model_filename):
    print(f"⚠️ Model file {model_filename} not found. Trying alternative names...")
    # Try just name lowercase
    model_filename = f"models/{best_model_name.lower()}.pkl"

if os.path.exists(model_filename):
    print(f"Loading model from: {model_filename}")
    try:
        model = joblib.load(model_filename)
        print("✅ Model loaded successfully.")
        
        # Predictions
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['No Disease', 'Disease'], yticklabels=['No Disease', 'Disease'])
        plt.title(f'Confusion Matrix: {best_model_name}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.savefig('outputs/confusion_matrix.png')
        print("Saved confusion_matrix.png")
        
        # ROC Curve
        if y_proba is not None:
            fpr, tpr, _ = roc_curve(y_test, y_proba)
            auc_val = roc_auc_score(y_test, y_proba)
            
            plt.figure(figsize=(8, 6))
            plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc_val:.4f})')
            plt.plot([0, 1], [0, 1], 'k--')
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title(f'ROC Curve: {best_model_name}')
            plt.legend()
            plt.savefig('outputs/roc_curve.png')
            print("Saved roc_curve.png")
            
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature Importance
        # Try to get feature importance from the model or its best_estimator_
        importances = None
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_[0])
        elif hasattr(model, 'best_estimator_'):
             if hasattr(model.best_estimator_, 'feature_importances_'):
                 importances = model.best_estimator_.feature_importances_
        
        if importances is not None and len(importances) == len(feature_names):
            indices = np.argsort(importances)[::-1]
            # Limit to top 20
            indices = indices[:20]
            
            plt.figure(figsize=(12, 6))
            plt.title(f"Top 20 Feature Importances ({best_model_name})")
            plt.bar(range(len(indices)), importances[indices], align="center")
            plt.xticks(range(len(indices)), [feature_names[i] for i in indices], rotation=45, ha='right')
            plt.tight_layout()
            plt.savefig('outputs/feature_importance.png')
            print("Saved feature_importance.png")
            
    except Exception as e:
        print(f"Error evaluating model: {e}")
else:
    print(f"❌ Could not find model file for {best_model_name}")
