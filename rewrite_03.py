import nbformat as nbf

nb = nbf.v4.new_notebook()

# Cell 1: Imports
cell1 = nbf.v4.new_code_cell("""import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import time
import joblib
import os

from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.model_selection import cross_val_score, StratifiedKFold

import optuna
from optuna.samplers import TPESampler

import warnings
warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)

# Config
RANDOM_STATE = 42
N_FOLDS = 5
N_OPTUNA_TRIALS = 20 # Reduced for speed in demo, increase for production

os.makedirs('models', exist_ok=True)
os.makedirs('outputs', exist_ok=True)

plt.style.use('seaborn-v0_8-whitegrid')
print("✅ Libraries imported.")""")

# Cell 2: Load Data
cell2 = nbf.v4.new_markdown_cell("## 1. Load Data")
cell3 = nbf.v4.new_code_cell("""# Load data from .npy files
data_path = 'data'
X_train = np.load(f'{data_path}/X_train_full.npy')
y_train = np.load(f'{data_path}/y_train_full.npy')
X_test = np.load(f'{data_path}/X_test.npy')
y_test = np.load(f'{data_path}/y_test.npy')
feature_names = np.load(f'{data_path}/feature_names.npy', allow_pickle=True)

# Load K-Fold indices (optional, but good for consistency if we wanted to use specific folds)
# For Optuna cross_val_score with StratifiedKFold(shuffle=True, seed=42), it replicates the split if N_SPLITS matches.
# We will use a fresh StratifiedKFold with same seed for simplicity in Pipeline integration.
fold_indices = np.load(f'{data_path}/kfold_indices.npy', allow_pickle=True).item()

print(f"X_train: {X_train.shape}, y_train: {y_train.shape}")
print(f"X_test: {X_test.shape}, y_test: {y_test.shape}")
print(f"Features: {feature_names}")""")

# Cell 3: Evaluation Utils
cell4 = nbf.v4.new_code_cell("""def evaluate_model(model, X, y):
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None
    
    return {
        'accuracy': accuracy_score(y, y_pred),
        'precision': precision_score(y, y_pred),
        'recall': recall_score(y, y_pred),
        'f1': f1_score(y, y_pred),
        'roc_auc': roc_auc_score(y, y_proba) if y_proba is not None else None
    }

def print_metrics(metrics, name):
    print(f"\\n{'='*40}\\n{name}\\n{'='*40}")
    for k, v in metrics.items():
        if v: print(f"{k:<15}: {v:.4f}")
""")

# Cell 4: Optuna Setup
cell5 = nbf.v4.new_code_cell("""cv = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE)

results = {}
trained_models = {}
best_params = {}

def optimize(objective, n_trials=N_OPTUNA_TRIALS):
    sampler = TPESampler(seed=RANDOM_STATE)
    study = optuna.create_study(direction='maximize', sampler=sampler)
    study.optimize(objective, n_trials=n_trials)
    return study""")

# Cell 5: Logistic Regression
cell6 = nbf.v4.new_markdown_cell("## 2. Logistic Regression (Scaled)")
cell7 = nbf.v4.new_code_cell("""def obj_lr(trial):
    params = {
        'C': trial.suggest_float('C', 0.01, 10.0, log=True),
        'penalty': trial.suggest_categorical('penalty', ['l1', 'l2']),
        'solver': 'saga',
        'max_iter': 1000,
        'random_state': RANDOM_STATE
    }
    
    # Pipeline with Scaler
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', LogisticRegression(**params))
    ])
    
    return cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning Logistic Regression...")
study_lr = optimize(obj_lr)
print(f"Best F1: {study_lr.best_value:.4f}")
print(f"Params: {study_lr.best_params}")

# Retrain
lr_params = study_lr.best_params
lr_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression(**lr_params, solver='saga', max_iter=1000, random_state=RANDOM_STATE))
])
start = time.time()
lr_pipeline.fit(X_train, y_train)
train_time = time.time() - start

metrics_lr = evaluate_model(lr_pipeline, X_test, y_test)
metrics_lr['train_time'] = train_time
metrics_lr['tune_time'] = 0 # Simplified
results['LogisticRegression'] = metrics_lr
trained_models['LogisticRegression'] = lr_pipeline
best_params['LogisticRegression'] = lr_params

print_metrics(metrics_lr, 'LogisticRegression')
joblib.dump(lr_pipeline, 'models/single_logisticregression.pkl')""")

# Cell 6: KNN
cell8 = nbf.v4.new_markdown_cell("## 3. KNN (Scaled)")
cell9 = nbf.v4.new_code_cell("""def obj_knn(trial):
    params = {
        'n_neighbors': trial.suggest_int('n_neighbors', 3, 30),
        'weights': trial.suggest_categorical('weights', ['uniform', 'distance']),
        'metric': trial.suggest_categorical('metric', ['euclidean', 'manhattan']),
        'n_jobs': -1
    }
    
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', KNeighborsClassifier(**params))
    ])
    
    return cross_val_score(pipeline, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning KNN...")
study_knn = optimize(obj_knn)
print(f"Best F1: {study_knn.best_value:.4f}")

knn_params = study_knn.best_params
knn_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', KNeighborsClassifier(**knn_params, n_jobs=-1))
])
start = time.time()
knn_pipeline.fit(X_train, y_train)
train_time = time.time() - start

metrics_knn = evaluate_model(knn_pipeline, X_test, y_test)
metrics_knn['train_time'] = train_time
metrics_knn['tune_time'] = 0
results['KNN'] = metrics_knn
trained_models['KNN'] = knn_pipeline
best_params['KNN'] = knn_params

print_metrics(metrics_knn, 'KNN')
joblib.dump(knn_pipeline, 'models/single_knn.pkl')""")

# Cell 7: Naive Bayes
cell10 = nbf.v4.new_markdown_cell("## 4. Naive Bayes")
cell11 = nbf.v4.new_code_cell("""def obj_nb(trial):
    params = {
        'var_smoothing': trial.suggest_float('var_smoothing', 1e-12, 1e-6, log=True)
    }
    # No scaler needed usually for NB, but safe to add or skip. 
    # GaussianNB assumes features are gaussian. 
    # K-Modes features are categorical integers, which is not ideal for GaussianNB.
    # But we stick to the required model list.
    model = GaussianNB(**params)
    return cross_val_score(model, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning Naive Bayes...")
study_nb = optimize(obj_nb, n_trials=10)
print(f"Best F1: {study_nb.best_value:.4f}")

nb_model = GaussianNB(**study_nb.best_params)
start = time.time()
nb_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_nb = evaluate_model(nb_model, X_test, y_test)
metrics_nb['train_time'] = train_time
metrics_nb['tune_time'] = 0
results['NaiveBayes'] = metrics_nb
trained_models['NaiveBayes'] = nb_model
best_params['NaiveBayes'] = study_nb.best_params

print_metrics(metrics_nb, 'NaiveBayes')
joblib.dump(nb_model, 'models/single_naivebayes.pkl')""")

# Cell 8: Decision Tree
cell12 = nbf.v4.new_markdown_cell("## 5. Decision Tree")
cell13 = nbf.v4.new_code_cell("""def obj_dt(trial):
    params = {
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'criterion': trial.suggest_categorical('criterion', ['gini', 'entropy']),
        'random_state': RANDOM_STATE
    }
    model = DecisionTreeClassifier(**params)
    return cross_val_score(model, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning Decision Tree...")
study_dt = optimize(obj_dt)
print(f"Best F1: {study_dt.best_value:.4f}")

dt_model = DecisionTreeClassifier(**study_dt.best_params, random_state=RANDOM_STATE)
start = time.time()
dt_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_dt = evaluate_model(dt_model, X_test, y_test)
metrics_dt['train_time'] = train_time
metrics_dt['tune_time'] = 0
results['DecisionTree'] = metrics_dt
trained_models['DecisionTree'] = dt_model
best_params['DecisionTree'] = study_dt.best_params

print_metrics(metrics_dt, 'DecisionTree')
joblib.dump(dt_model, 'models/single_decisiontree.pkl')""")

# Cell 9: Save Results
cell14 = nbf.v4.new_code_cell("""# Save results
df_results = pd.DataFrame(results).T
df_results.to_csv('outputs/single_models_results.csv')
print("✅ Results saved to outputs/single_models_results.csv")
print(df_results)
""")

nb.cells = [cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8, cell9, cell10, cell11, cell12, cell13, cell14]

with open('/Users/kotori/a_benh_tim/03_SingleModels.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)
