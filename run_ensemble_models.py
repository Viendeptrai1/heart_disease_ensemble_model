import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import time
import joblib
import os

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, StackingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.model_selection import cross_val_score, StratifiedKFold

import optuna
from optuna.samplers import TPESampler

import warnings
warnings.filterwarnings('ignore')
optuna.logging.set_verbosity(optuna.logging.WARNING)

# Config
RANDOM_STATE = 42
N_FOLDS = 5
N_OPTUNA_TRIALS = 10 # Reduced

os.makedirs('models', exist_ok=True)
os.makedirs('outputs', exist_ok=True)

print("✅ Libraries imported.")

# Load Data
data_path = 'data'
X_train = np.load(f'{data_path}/X_train_full.npy')
y_train = np.load(f'{data_path}/y_train_full.npy')
X_test = np.load(f'{data_path}/X_test.npy')
y_test = np.load(f'{data_path}/y_test.npy')
feature_names = np.load(f'{data_path}/feature_names.npy', allow_pickle=True)

print(f"X_train: {X_train.shape}, y_train: {y_train.shape}")
print(f"X_test: {X_test.shape}, y_test: {y_test.shape}")

cv = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE)

def evaluate_model(model, X, y):
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
    print(f"\n{'='*40}\n{name}\n{'='*40}")
    for k, v in metrics.items():
        if v: print(f"{k:<15}: {v:.4f}")

ensemble_results = {}
trained_ensembles = {}

def optimize(objective, n_trials=N_OPTUNA_TRIALS):
    sampler = TPESampler(seed=RANDOM_STATE)
    study = optuna.create_study(direction='maximize', sampler=sampler)
    study.optimize(objective, n_trials=n_trials)
    return study

# 2. Random Forest
def obj_rf(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'random_state': RANDOM_STATE,
        'n_jobs': -1
    }
    model = RandomForestClassifier(**params)
    return cross_val_score(model, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning Random Forest...")
study_rf = optimize(obj_rf)
print(f"Best F1: {study_rf.best_value:.4f}")

rf_model = RandomForestClassifier(**study_rf.best_params, random_state=RANDOM_STATE, n_jobs=-1)
start = time.time()
rf_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_rf = evaluate_model(rf_model, X_test, y_test)
metrics_rf['train_time'] = train_time
ensemble_results['RandomForest'] = metrics_rf
print_metrics(metrics_rf, 'RandomForest')
joblib.dump(rf_model, 'models/ensemble_randomforest.pkl')

# 3. XGBoost
def obj_xgb(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'random_state': RANDOM_STATE,
        'eval_metric': 'logloss'
    }
    model = XGBClassifier(**params)
    return cross_val_score(model, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning XGBoost...")
study_xgb = optimize(obj_xgb)
print(f"Best F1: {study_xgb.best_value:.4f}")

xgb_model = XGBClassifier(**study_xgb.best_params, random_state=RANDOM_STATE, eval_metric='logloss')
start = time.time()
xgb_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_xgb = evaluate_model(xgb_model, X_test, y_test)
metrics_xgb['train_time'] = train_time
ensemble_results['XGBoost'] = metrics_xgb
print_metrics(metrics_xgb, 'XGBoost')
joblib.dump(xgb_model, 'models/ensemble_xgboost.pkl')

# 4. LightGBM
def obj_lgbm(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'num_leaves': trial.suggest_int('num_leaves', 20, 100),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'random_state': RANDOM_STATE,
        'verbose': -1
    }
    model = LGBMClassifier(**params)
    return cross_val_score(model, X_train, y_train, cv=cv, scoring='f1').mean()

print("Tuning LightGBM...")
study_lgbm = optimize(obj_lgbm)
print(f"Best F1: {study_lgbm.best_value:.4f}")

lgbm_model = LGBMClassifier(**study_lgbm.best_params, random_state=RANDOM_STATE, verbose=-1)
start = time.time()
lgbm_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_lgbm = evaluate_model(lgbm_model, X_test, y_test)
metrics_lgbm['train_time'] = train_time
ensemble_results['LightGBM'] = metrics_lgbm
print_metrics(metrics_lgbm, 'LightGBM')
joblib.dump(lgbm_model, 'models/ensemble_lightgbm.pkl')

# 5. Voting Classifier
estimators = [
    ('lr', Pipeline([('scaler', StandardScaler()), ('model', LogisticRegression(solver='saga', max_iter=1000, random_state=RANDOM_STATE))])),
    ('knn', Pipeline([('scaler', StandardScaler()), ('model', KNeighborsClassifier())])),
    ('nb', GaussianNB()),
    ('dt', DecisionTreeClassifier(random_state=RANDOM_STATE)),
    ('rf', RandomForestClassifier(random_state=RANDOM_STATE)),
    ('xgb', XGBClassifier(random_state=RANDOM_STATE, eval_metric='logloss')),
    ('lgbm', LGBMClassifier(random_state=RANDOM_STATE, verbose=-1))
]

voting_model = VotingClassifier(estimators=estimators, voting='soft')
start = time.time()
voting_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_voting = evaluate_model(voting_model, X_test, y_test)
metrics_voting['train_time'] = train_time
ensemble_results['Voting'] = metrics_voting
print_metrics(metrics_voting, 'Voting')
joblib.dump(voting_model, 'models/ensemble_voting.pkl')

# 6. Stacking Classifier
stacking_model = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression(random_state=RANDOM_STATE),
    cv=5
)

start = time.time()
stacking_model.fit(X_train, y_train)
train_time = time.time() - start

metrics_stacking = evaluate_model(stacking_model, X_test, y_test)
metrics_stacking['train_time'] = train_time
ensemble_results['Stacking'] = metrics_stacking
print_metrics(metrics_stacking, 'Stacking')
joblib.dump(stacking_model, 'models/ensemble_stacking.pkl')

# Save Results
df_results = pd.DataFrame(ensemble_results).T
df_results.to_csv('outputs/ensemble_models_results.csv')
print("✅ Results saved to outputs/ensemble_models_results.csv")
print(df_results)
