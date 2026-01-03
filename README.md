# 🫀 Hệ Thống Chẩn Đoán Bệnh Tim Mạch Bằng Ensemble Learning

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.0+-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Đồ án môn học **Máy học**: Xây dựng hệ thống chẩn đoán bệnh tim mạch (Cardiovascular Disease Prediction) sử dụng các kỹ thuật học máy tiên tiến, tập trung vào việc so sánh hiệu quả giữa các **Single Models** và các phương pháp **Ensemble Learning** phức tạp.

---

## 📋 Mục lục

- [Tổng quan dự án](#-tổng-quan-dự-án)
- [Dataset](#-dataset)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Quy trình thực hiện](#-quy-trình-thực-hiện)
- [Kết quả](#-kết-quả)
- [Metrics đánh giá](#-metrics-đánh-giá)
- [Phân tích và Insights](#-phân-tích-và-insights)
- [Tác giả](#-tác-giả)

---

## Tổng quan dự án

Dự án này xây dựng một hệ thống dự đoán bệnh tim mạch sử dụng Machine Learning, với mục tiêu:

- So sánh hiệu quả giữa **Single Models** (Logistic Regression, KNN, Naive Bayes, Decision Tree) và **Ensemble Methods** (Random Forest, XGBoost, LightGBM, Voting, Stacking)
- Tối ưu hóa hyperparameters sử dụng **Optuna** với TPE Sampler
- Xử lý dữ liệu chuyên sâu: outlier removal, feature engineering, binning, clustering
- Đánh giá toàn diện với nhiều metrics (Accuracy, Precision, Recall, F1-Score, ROC-AUC)
- Đạt được **F1-Score: 0.8097** với mô hình Stacking Classifier

### Best Model

**Stacking Classifier** đạt được kết quả tốt nhất:
- **Accuracy**: 82.0%
- **Precision**: 84.3%
- **Recall**: 77.9%
- **F1-Score**: 81.0%
- **ROC-AUC**: 91.0%

---

## Dataset

### Thông tin cơ bản

- **Nguồn**: Cardiovascular Disease Dataset (`cardio_train.csv`)
- **Số lượng ban đầu**: 70,000 samples
- **Số lượng sau preprocessing**: 60,752 samples (sau khi loại bỏ outliers)
- **Số features gốc**: 12 features
- **Số features cuối cùng**: 10 features (sau feature engineering và selection)
- **Target variable**: `cardio` (0: Không bệnh, 1: Có bệnh tim mạch)
- **Class distribution**: ~50-50 (cân bằng, không cần xử lý imbalance)

### Features gốc

| Feature | Mô tả | Kiểu dữ liệu |
|---------|-------|--------------|
| `id` | Mã định danh bệnh nhân | Integer |
| `age` | Tuổi (tính bằng ngày) | Integer |
| `gender` | Giới tính (1: Nữ, 2: Nam) | Integer |
| `height` | Chiều cao (cm) | Integer |
| `weight` | Cân nặng (kg) | Float |
| `ap_hi` | Huyết áp tâm thu (Systolic) | Integer |
| `ap_lo` | Huyết áp tâm trương (Diastolic) | Integer |
| `cholesterol` | Mức cholesterol (1: Bình thường, 2: Cao, 3: Rất cao) | Integer |
| `gluc` | Mức glucose (1: Bình thường, 2: Cao, 3: Rất cao) | Integer |
| `smoke` | Hút thuốc (0: Không, 1: Có) | Integer |
| `alco` | Uống rượu (0: Không, 1: Có) | Integer |
| `active` | Hoạt động thể chất (0: Không, 1: Có) | Integer |
| `cardio` | Bệnh tim mạch (0: Không, 1: Có) - **TARGET** | Integer |

### Features sau preprocessing

Sau quá trình xử lý, dataset cuối cùng có **10 features**:

1. `gender` - Giới tính
2. `cholesterol` - Mức cholesterol
3. `gluc` - Mức glucose
4. `smoke` - Hút thuốc
5. `alco` - Uống rượu
6. `active` - Hoạt động thể chất
7. `age_bin` - Nhóm tuổi (binned)
8. `BMI_Class` - Phân loại BMI (binned)
9. `MAP_Class` - Phân loại Mean Arterial Pressure (binned)
10. `cluster` - Cluster từ K-Modes clustering

---

## Cấu trúc dự án

```
heart_disease_ensemble_model/
│
├── DataRaw/                          # Dataset gốc
│   └── cardio_train.csv              # Dataset ban đầu (70,000 samples)
│
├── data/                             # Dữ liệu đã xử lý
│   ├── X_train_full.npy              # Training set (48,601 samples)
│   ├── y_train_full.npy              # Training labels
│   ├── X_test.npy                    # Test set (12,151 samples)
│   ├── y_test.npy                    # Test labels
│   ├── feature_names.npy             # Tên các features sau xử lý
│   └── kfold_indices.npy             # K-Fold indices cho cross-validation
│
├── models/                           # Models đã được train
│   ├── single_logisticregression.pkl
│   ├── single_knn.pkl
│   ├── single_naivebayes.pkl
│   ├── single_decisiontree.pkl
│   ├── ensemble_randomforest.pkl
│   ├── ensemble_xgboost.pkl
│   ├── ensemble_lightgbm.pkl
│   ├── ensemble_voting.pkl
│   └── ensemble_stacking.pkl         # Best Model
│
├── outputs/                          # Kết quả và visualizations
│   ├── single_models_results.csv     # Kết quả đánh giá single models
│   ├── ensemble_models_results.csv  # Kết quả đánh giá ensemble models
│   ├── final_model_summary.csv       # Tổng hợp tất cả kết quả
│   ├── confusion_matrix.png          # Confusion matrix của best model
│   ├── roc_curve.png                 # ROC curve của best model
│   └── feature_importance.png       # Feature importance (nếu có)
│
├── 01_EDA.ipynb                      # Phân tích khám phá dữ liệu
├── 02_Preprocessing.ipynb             # Tiền xử lý và feature engineering
├── 03_SingleModels.ipynb             # Train và tune single models
├── 04_EnsembleModels.ipynb           # Train ensemble models
├── 05_Evaluation.ipynb               # Đánh giá tổng hợp và so sánh
│
├── requirements.txt                   # Các thư viện cần thiết
└── README.md                          # File này
```

---

## Yêu cầu hệ thống

- **Python**: 3.8 trở lên
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Disk space**: ~500MB cho dataset và models
- **OS**: Windows, Linux, hoặc macOS

---

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd heart_disease_ensemble_model
```

### 2. Tạo virtual environment (khuyến nghị)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 4. Cài đặt Jupyter Notebook (nếu chưa có)

```bash
pip install jupyter notebook
```

### 5. Khởi chạy Jupyter Notebook

```bash
jupyter notebook
```

---

## Quy trình thực hiện

Dự án được chia thành **5 bước chính**, tương ứng với 5 notebooks. **Bắt buộc chạy lần lượt theo thứ tự**:

### 📓 1. Exploratory Data Analysis (01_EDA.ipynb)

**Mục tiêu**: Hiểu rõ cấu trúc và đặc điểm của dataset

**Nội dung**:
- Load và kiểm tra tổng quan dữ liệu
- Phân tích thống kê mô tả (descriptive statistics)
- Phân tích phân phối biến mục tiêu (target variable)
- Phân tích các biến số (numerical features): age, height, weight, ap_hi, ap_lo
- Phân tích các biến phân loại (categorical features): gender, cholesterol, gluc, smoke, alco, active
- Phát hiện và phân tích outliers (huyết áp, chiều cao, cân nặng)
- Phân tích tương quan (correlation analysis)
- Tính toán và phân tích BMI
- Phân tích huyết áp và tuổi - các yếu tố quan trọng
- Tổng kết và đề xuất xử lý cho bước tiếp theo

**Output**: 
- Các biểu đồ visualization trong `outputs/`
- Dataset với các features mới: `outputs/cardio_eda_explored.csv`

---

### 2. Data Preprocessing (02_Preprocessing.ipynb)

**Mục tiêu**: Chuẩn bị dữ liệu sạch và tối ưu cho machine learning

**Nội dung**:

#### 2.1. Outlier Removal
- Sử dụng **Quantile Method** (2.5% - 97.5%) để loại bỏ outliers
- Áp dụng cho: `ap_hi`, `ap_lo`, `weight`, `height`
- Kết quả: Giảm từ 70,000 → 60,752 samples

#### 2.2. Feature Engineering
- **Age conversion**: Chuyển `age` từ ngày sang năm → `age_in_years`
- **BMI calculation**: `bmi = weight / (height/100)²`
- **MAP calculation**: `map = (2 × ap_lo + ap_hi) / 3` (Mean Arterial Pressure)

#### 2.3. Binning (Discretization)
- **Age bins**: [30, 35, 40, 45, 50, 55, 60, 65] → `age_bin`
- **BMI bins**: [0, 18.5, 25, 30, 35, 40, inf] → `BMI_Class`
- **MAP bins**: [0, 70, 80, 90, 100, 110, inf] → `MAP_Class`

#### 2.4. K-Modes Clustering
- Tạo feature `cluster` bằng K-Modes clustering (k=2)
- Tách riêng theo gender để tăng độ chính xác
- Mục đích: Phát hiện các nhóm bệnh nhân có đặc điểm tương đồng

#### 2.5. Data Splitting
- **Train/Test Split**: 80% / 20% (stratified)
  - Training: 48,601 samples
  - Test: 12,151 samples
- **K-Fold Cross-Validation**: 5 folds (StratifiedKFold)

#### 2.6. Save Processed Data
- Lưu tất cả dữ liệu đã xử lý vào thư mục `data/` dưới dạng `.npy`

**Output**: 
- `data/X_train_full.npy`, `data/y_train_full.npy`
- `data/X_test.npy`, `data/y_test.npy`
- `data/feature_names.npy`
- `data/kfold_indices.npy`

---

### 3. Single Models Training (03_SingleModels.ipynb)

**Mục tiêu**: Huấn luyện và tối ưu các mô hình đơn lẻ

**Nội dung**:

#### 3.1. Models được train
1. **Logistic Regression** (với StandardScaler)
   - Hyperparameters: `C`, `penalty` (L1/L2)
   - Solver: `saga` (hỗ trợ cả L1 và L2)

2. **K-Nearest Neighbors (KNN)** (với StandardScaler)
   - Hyperparameters: `n_neighbors`, `weights`, `metric`

3. **Naive Bayes (GaussianNB)**
   - Hyperparameters: `var_smoothing`

4. **Decision Tree**
   - Hyperparameters: `max_depth`, `min_samples_split`, `min_samples_leaf`, `criterion`

#### 3.2. Hyperparameter Tuning
- **Tool**: Optuna với TPE Sampler
- **Trials**: 20 trials per model (có thể tăng cho production)
- **CV**: 5-fold StratifiedKFold
- **Metric**: F1-Score (primary metric)

#### 3.3. Evaluation
- Đánh giá trên test set với các metrics:
  - Accuracy, Precision, Recall, F1-Score, ROC-AUC
  - Training time

**Output**:
- Models: `models/single_*.pkl`
- Results: `outputs/single_models_results.csv`

**Kết quả Single Models**:

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|-------|----------|-----------|--------|----------|---------|
| Decision Tree | 81.6% | 84.7% | 76.5% | 80.4% | 90.8% |
| KNN | 80.7% | 82.8% | 76.5% | 79.6% | 89.2% |
| Logistic Regression | 75.3% | 76.7% | 71.6% | 74.0% | 82.5% |
| Naive Bayes | 73.9% | 74.8% | 70.7% | 72.7% | 79.6% |

---

### 4. Ensemble Models Training (04_EnsembleModels.ipynb)

**Mục tiêu**: Huấn luyện các mô hình ensemble để cải thiện hiệu suất

**Nội dung**:

#### 4.1. Pre-built Ensemble Models
1. **Random Forest**
   - Hyperparameters: `n_estimators`, `max_depth`, `min_samples_split`, `min_samples_leaf`
   - Tuning với Optuna

2. **XGBoost**
   - Hyperparameters: `n_estimators`, `max_depth`, `learning_rate`, `subsample`, `colsample_bytree`
   - Tuning với Optuna

3. **LightGBM**
   - Hyperparameters: `n_estimators`, `max_depth`, `learning_rate`, `num_leaves`, `subsample`, `colsample_bytree`
   - Tuning với Optuna

#### 4.2. True Ensemble Methods
4. **Voting Classifier (Soft Voting)**
   - Kết hợp 7 base models:
     - Logistic Regression, KNN, Naive Bayes, Decision Tree
     - Random Forest, XGBoost, LightGBM
   - Voting strategy: Soft (sử dụng predict_proba)

5. **Stacking Classifier**
   - Base estimators: 7 models như Voting
   - Meta-learner: Logistic Regression
   - Cross-validation: 5-fold

#### 4.3. Evaluation
- Đánh giá tương tự như Single Models

**Output**:
- Models: `models/ensemble_*.pkl`
- Results: `outputs/ensemble_models_results.csv`

**Kết quả Ensemble Models**:

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Train Time (s) |
|-------|----------|-----------|--------|----------|---------|----------------|
| **Stacking**  | **82.0%** | **84.3%** | **77.9%** | **81.0%** | **91.0%** | 12.86 |
| LightGBM | 81.9% | 84.4% | 77.6% | 80.8% | 91.1% | 0.76 |
| XGBoost | 82.0% | 84.7% | 77.2% | 80.8% | 91.0% | 0.37 |
| Random Forest | 81.8% | 84.3% | 77.3% | 80.7% | 90.9% | 0.56 |
| Voting | 81.5% | 83.6% | 77.5% | 80.5% | 90.4% | 1.99 |

---

### 5. Evaluation & Comparison (05_Evaluation.ipynb)

**Mục tiêu**: Đánh giá tổng hợp, so sánh và chọn best model

**Nội dung**:

#### 5.1. Load và tổng hợp kết quả
- Load kết quả từ `single_models_results.csv` và `ensemble_models_results.csv`
- Tạo bảng tổng hợp tất cả models
- Sắp xếp theo F1-Score

#### 5.2. Best Model Analysis
- Xác định best model (Stacking Classifier)
- **Confusion Matrix**: Phân tích True/False Positives và Negatives
- **ROC Curve**: Visualize khả năng phân loại
- **Classification Report**: Chi tiết Precision, Recall, F1 cho từng class
- **Feature Importance**: Nếu model hỗ trợ (Random Forest, XGBoost, LightGBM)

#### 5.3. Visualizations
- Bar charts so sánh metrics giữa các models
- ROC curves comparison
- Feature importance plots

**Output**:
- `outputs/final_model_summary.csv`
- `outputs/confusion_matrix.png`
- `outputs/roc_curve.png`
- `outputs/feature_importance.png`

---

## Kết quả

### So sánh Single Models vs Ensemble Models

| Rank | Model | Type | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|------|-------|------|----------|-----------|--------|----------|---------|
| 1 | **Stacking** | Ensemble | **82.0%** | **84.3%** | **77.9%** | **81.0%** | **91.0%** |
| 2 | LightGBM | Ensemble | 81.9% | 84.4% | 77.6% | 80.8% | 91.1% |
| 3 | XGBoost | Ensemble | 82.0% | 84.7% | 77.2% | 80.8% | 91.0% |
| 4 | Random Forest | Ensemble | 81.8% | 84.3% | 77.3% | 80.7% | 90.9% |
| 5 | Voting | Ensemble | 81.5% | 83.6% | 77.5% | 80.5% | 90.4% |
| 6 | Decision Tree | Single | 81.6% | 84.7% | 76.5% | 80.4% | 90.8% |
| 7 | KNN | Single | 80.7% | 82.8% | 76.5% | 79.6% | 89.2% |
| 8 | Logistic Regression | Single | 75.3% | 76.7% | 71.6% | 74.0% | 82.5% |
| 9 | Naive Bayes | Single | 73.9% | 74.8% | 70.7% | 72.7% | 79.6% |

### Best Model Performance (Stacking Classifier)

**Classification Report**:
```
              precision    recall  f1-score   support

           0       0.80      0.86      0.83      6174
           1       0.84      0.78      0.81      5977

    accuracy                           0.82     12151
   macro avg       0.82      0.82      0.82     12151
weighted avg       0.82      0.82      0.82     12151
```

**Confusion Matrix**:
- True Negatives (TN): 5,310
- False Positives (FP): 864
- False Negatives (FN): 1,313
- True Positives (TP): 4,664

---

##  Metrics đánh giá

Hệ thống sử dụng các chỉ số sau để đánh giá hiệu năng mô hình:

### 1. **Accuracy** (Độ chính xác tổng thể)
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
```
- Tỷ lệ dự đoán đúng trên tổng số mẫu
- Phù hợp khi dataset cân bằng (như trong dự án này)

### 2. **Precision** (Độ chính xác dự đoán dương tính)
```
Precision = TP / (TP + FP)
```
- Tỷ lệ các ca dự đoán có bệnh thực sự có bệnh
- Quan trọng khi chi phí điều trị sai cao

### 3. **Recall** (Độ nhạy / Sensitivity)
```
Recall = TP / (TP + FN)
```
- Tỷ lệ các ca có bệnh được phát hiện đúng
- **Rất quan trọng trong y tế** - giảm thiểu bỏ sót ca bệnh

### 4. **F1-Score** (Chỉ số chính - Primary Metric)
```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
```
- Cân bằng giữa Precision và Recall
- **Metric chính** được sử dụng để tối ưu hóa trong dự án này

### 5. **ROC-AUC** (Area Under ROC Curve)
- Khả năng phân biệt giữa 2 classes
- Giá trị càng cao càng tốt (tối đa = 1.0)
- Phù hợp khi dataset cân bằng

---

##  Phân tích và Insights

### 1. Ensemble Methods vượt trội hơn Single Models

- **Tất cả 5 ensemble models** đều đạt F1-Score > 80%
- **Stacking Classifier** đạt kết quả tốt nhất (F1: 81.0%)
- **Decision Tree** (single) gần bằng một số ensemble models, cho thấy tree-based methods phù hợp với dataset này

### 2. Feature Engineering có tác động tích cực

- Binning (age_bin, BMI_Class, MAP_Class) giúp capture non-linear relationships
- K-Modes clustering tạo feature `cluster` phản ánh các nhóm bệnh nhân có đặc điểm tương đồng
- Loại bỏ outliers giúp cải thiện chất lượng dữ liệu

### 3. Hyperparameter Tuning quan trọng

- Sử dụng Optuna giúp tìm được hyperparameters tối ưu
- Mỗi model có thể cải thiện đáng kể với tuning phù hợp

### 4. Trade-off giữa Performance và Training Time

- **Stacking**: Best performance nhưng training time lâu nhất (12.86s)
- **XGBoost**: Cân bằng tốt giữa performance và speed (0.37s)
- **LightGBM**: Performance tốt, training time trung bình (0.76s)

### 5. Yếu tố quan trọng nhất

Từ EDA, các yếu tố có tương quan mạnh với bệnh tim:
- **Tuổi** (age): Tương quan dương mạnh (+0.238)
- **Cholesterol**: Tương quan dương mạnh (+0.221)
- **BMI**: Tương quan dương trung bình (+0.182)
- **Huyết áp**: Mặc dù tương quan yếu nhưng rất quan trọng trong y tế

---

##  Công nghệ sử dụng

### Core Libraries
- **pandas** (≥1.3.0): Data manipulation và analysis
- **numpy** (≥1.21.0): Numerical computing
- **scikit-learn** (≥1.0.0): Machine learning algorithms và utilities

### Advanced ML Libraries
- **xgboost** (≥1.5.0): Gradient boosting framework
- **lightgbm** (≥3.3.0): Gradient boosting framework (Microsoft)

### Hyperparameter Optimization
- **optuna** (≥3.0.0): Automated hyperparameter optimization với TPE Sampler

### Visualization
- **matplotlib** (≥3.4.0): Plotting và visualization
- **seaborn** (≥0.11.0): Statistical data visualization

### Utilities
- **joblib** (≥1.1.0): Model persistence
- **jupyter** (≥1.0.0): Interactive notebook environment

### Clustering
- **kmodes**: K-Modes clustering cho categorical data

---

##  Lưu ý khi sử dụng

1. **Chạy notebooks theo thứ tự**: Bắt buộc chạy từ 01 → 05 vì mỗi notebook phụ thuộc vào output của notebook trước đó

2. **Tăng số trials cho Optuna**: Trong production, nên tăng `N_OPTUNA_TRIALS` từ 20 lên 50-100 để có kết quả tốt hơn

3. **Memory usage**: Khi train Stacking Classifier, cần đủ RAM vì nó train nhiều base models

4. **Reproducibility**: Tất cả random seeds đã được set (`RANDOM_STATE = 42`) để đảm bảo kết quả có thể reproduce

5. **Dataset**: Đảm bảo file `DataRaw/cardio_train.csv` tồn tại trước khi chạy

---

##  Hướng phát triển

- Thêm Neural Networks (MLP, Deep Learning)
- Thử các ensemble methods khác (Blending, Boosting variations)
- Feature selection để giảm số features
- Deploy model lên web app (Flask/FastAPI)
- Tạo API để predict real-time
- Thêm SHAP values để explainability
- Cross-validation trên toàn bộ dataset thay vì chỉ train set

---

##  Tác giả

**NHÓM 1**

- Phan Quốc Viễn - 23110362
- Vũ Toàn Thắng - 23110329
- Nguyễn Nhật Huy - 23110226








