import nbformat as nbf

# Define the notebook structure
nb = nbf.v4.new_notebook()

# Cell 1: Headers and Imports
cell1 = nbf.v4.new_markdown_cell("""# 02. Data Preprocessing (Refined Strategy)

## Muc tieu
- Xu ly outliers su dung Quantile method (2.5% - 97.5%)
- Tao derived features: BMI, MAP, Age in Years
- Binning: Age, BMI, MAP
- K-Modes Clustering de tao feature 'cluster'
- Split data: 80% Train (Full), 20% Test (Held-out)
- Tao K-Fold indices cho Cross-Validation
""")

cell2 = nbf.v4.new_code_cell("""# Import libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold
from kmodes.kmodes import KModes
import os
import json
import warnings
warnings.filterwarnings('ignore')

# Create data directory if not exists
os.makedirs('data', exist_ok=True)

print("✅ Libraries imported & folders created!")""")

# Cell 3: Load Data
cell3 = nbf.v4.new_markdown_cell("## 1. Load Data")
cell4 = nbf.v4.new_code_cell("""df = pd.read_csv('DataRaw/cardio_train.csv', sep=';').drop('id', axis=1)
print(f"Shape: {df.shape}")
df.head()""")

# Cell 4: Outlier Removal
cell5 = nbf.v4.new_markdown_cell("## 2. Outlier Removal (Quantile Method)")
cell6 = nbf.v4.new_code_cell("""# Remove outliers (quantile 2.5% - 97.5%)
print(f"Before: {len(df):,}")
for col in ['ap_hi', 'ap_lo', 'weight', 'height']:
    df = df[(df[col] >= df[col].quantile(0.025)) & (df[col] <= df[col].quantile(0.975))]
print(f"After: {len(df):,}")""")

# Cell 5: Feature Engineering
cell7 = nbf.v4.new_markdown_cell("## 3. Feature Engineering")
cell8 = nbf.v4.new_code_cell("""# Create derived features
df['age_in_years'] = (df['age'] / 365).round().astype(int)
df['bmi'] = df['weight'] / ((df['height'] / 100) ** 2)
df['map'] = ((2 * df['ap_lo']) + df['ap_hi']) / 3
df.head()""")

# Cell 6: Binning
cell9 = nbf.v4.new_code_cell("""# Binning
age_bins = [30, 35, 40, 45, 50, 55, 60, 65]
df['age_bin'] = pd.cut(df['age_in_years'], bins=age_bins, labels=False, include_lowest=True)

bmi_bins = [0, 18.5, 25, 30, 35, 40, np.inf]
df['BMI_Class'] = pd.cut(df['bmi'], bins=bmi_bins, labels=False)

map_bins = [0, 70, 80, 90, 100, 110, np.inf]
df['MAP_Class'] = pd.cut(df['map'], bins=map_bins, labels=False)

print("Binning complete.")
print(f"age_bin: {df['age_bin'].value_counts().sort_index().to_dict()}")""")

# Cell 7: Drop Columns
cell10 = nbf.v4.new_code_cell("""# Drop raw and intermediate columns, keep processed
# Reference drops: age, height, weight, ap_hi, ap_lo, age_in_years, bmi, map
cols_to_drop = ['age', 'height', 'weight', 'ap_hi', 'ap_lo', 'age_in_years', 'bmi', 'map']
df_processed = df.drop(cols_to_drop, axis=1)

# Ensure correct column order/selection as per reference
# Expected: gender, cholesterol, gluc, smoke, alco, active, cardio, age_bin, BMI_Class, MAP_Class
# But we added bins to df, so df_processed has them.
# Let's clean up NaNs if any (from binning edge cases)
df_processed = df_processed.dropna()

print(f"Shape after dropping columns: {df_processed.shape}")
df_processed.head()""")

# Cell 8: K-Modes Clustering
cell11 = nbf.v4.new_markdown_cell("## 4. K-Modes Clustering")
cell12 = nbf.v4.new_code_cell("""# K-Modes Clustering (k=2, separate by gender)
df_male = df_processed[df_processed['gender'] == 2].copy()
df_female = df_processed[df_processed['gender'] == 1].copy()

# Initialize KModes
km_male = KModes(n_clusters=2, init='Huang', n_init=5, verbose=0, random_state=42)
df_male['cluster'] = km_male.fit_predict(df_male.drop('cardio', axis=1)) # Exclude target from clustering? Reference included everything?
# Reference: df_male['cluster'] = km_male.fit_predict(df_male) -> This INCLUDES 'cardio' (target leakage risk?)
# Let's check reference code carefully.
# Reference: 
# df_male = df_processed[df_processed['gender'] == 2].copy()
# km_male.fit_predict(df_male)
# Yes, it includes 'cardio'. This is technically target leakage if done on whole dataset before split.
# However, user asked to follow the reference.
# But "participating in the competition" implies good practice.
# If I include 'cardio', the cluster label strongly predicts the target.
# Let's assume the user wants the Reference strategy exactly. But I should probably warn or check if reference meant to drop it.
# Reference `df_processed` has `cardio`.
# I will follow strictly as requested: "sửa file 02 lại theo cách xử lí dữ liệu của..."
# So I will include it.

km_male = KModes(n_clusters=2, init='Huang', n_init=5, verbose=0, random_state=42)
df_male['cluster'] = km_male.fit_predict(df_male)

km_female = KModes(n_clusters=2, init='Huang', n_init=5, verbose=0, random_state=42)
df_female['cluster'] = km_female.fit_predict(df_female)

df_final = pd.concat([df_male, df_female], ignore_index=True)
print(f"Shape: {df_final.shape}")
print(f"Clusters: {df_final['cluster'].value_counts().to_dict()}")""")

# Cell 9: Prepare Data
cell13 = nbf.v4.new_markdown_cell("## 5. Prepare Data for ML")
cell14 = nbf.v4.new_code_cell("""# Convert to numeric arrays
df_numeric = df_final.copy()
for col in df_numeric.columns:
    df_numeric[col] = pd.to_numeric(df_numeric[col], errors='coerce')
df_numeric.dropna(inplace=True)

# Important: Move 'cardio' to y and rest to X
# Reference: X = df_numeric.drop('cardio', axis=1).values.astype(np.float32)
feature_names = df_numeric.drop('cardio', axis=1).columns.tolist()
X = df_numeric.drop('cardio', axis=1).values.astype(np.float32)
y = df_numeric['cardio'].values.astype(np.int64)

print(f"X: {X.shape}, y: {y.shape}")
print(f"Features: {feature_names}")""")

# Cell 10: Split and Save
cell15 = nbf.v4.new_markdown_cell("## 6. Train / Test Split + K-Fold Setup & Save")
cell16 = nbf.v4.new_code_cell("""# Train/Test Split (80/20)
X_train_full, X_test, y_train_full, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

print("-" * 30)
print(f"Full Dataset: {X.shape[0]:,} samples")
print(f"Training Set (80%): {X_train_full.shape[0]:,} samples")
print(f"Test Set (20%): {X_test.shape[0]:,} samples")

# Stratified K-Fold (K=5)
N_FOLDS = 5
skf = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=42)

fold_dict = {}
for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X_train_full, y_train_full), 1):
    fold_dict[f'fold_{fold_idx}_train_idx'] = train_idx
    fold_dict[f'fold_{fold_idx}_val_idx'] = val_idx

# Save to 'data/' folder
save_path = 'data'
np.save(f'{save_path}/X_train_full.npy', X_train_full)
np.save(f'{save_path}/y_train_full.npy', y_train_full)
np.save(f'{save_path}/X_test.npy', X_test)
np.save(f'{save_path}/y_test.npy', y_test)
np.save(f'{save_path}/feature_names.npy', np.array(feature_names))
np.save(f'{save_path}/kfold_indices.npy', fold_dict)

print(f"✅ Data saved to {save_path}/")
""")

nb.cells = [cell1, cell2, cell3, cell4, cell5, cell6, cell7, cell8, cell9, cell10, cell11, cell12, cell13, cell14, cell15, cell16]

with open('/Users/kotori/a_benh_tim/02_Preprocessing.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)
