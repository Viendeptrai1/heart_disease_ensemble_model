# Chẩn Đoán Bệnh Tim Bằng Ensemble Model

## Mô tả
Đồ án môn học Máy học: Xây dựng hệ thống chẩn đoán bệnh tim mạch sử dụng ensemble machine learning models.

## Dataset
- **Nguồn**: Cardiovascular Disease Dataset
- **Số lượng**: ~70,000 samples
- **Features**: 12 features + derived features

## Cấu trúc Project

```
a_benh_tim/
├── DataRaw/
│   └── cardio_train.csv          # Dataset gốc
├── data/
│   ├── X_train.npy, X_val.npy, X_test.npy
│   ├── y_train.npy, y_val.npy, y_test.npy
│   └── feature_names.npy
├── models/
│   ├── scaler.pkl                # StandardScaler
│   ├── single_*.pkl              # Single models
│   ├── ensemble_*.pkl            # Ensemble models
│   └── final_model_package.pkl   # Final model cho ứng dụng
├── outputs/
│   ├── *.png                     # Các biểu đồ
│   └── *.csv                     # Kết quả
├── 01_EDA.ipynb                  # Phân tích dữ liệu
├── 02_Preprocessing.ipynb        # Tiền xử lý
├── 03_SingleModels.ipynb         # Train single models
├── 04_EnsembleModels.ipynb       # Train ensemble models
├── 05_Evaluation.ipynb           # Đánh giá cuối cùng
├── requirements.txt              # Dependencies
└── README.md
```

## Cài đặt

```bash
pip install -r requirements.txt
```

## Hướng dẫn chạy

Chạy lần lượt các notebooks theo thứ tự:

1. **01_EDA.ipynb** - Phân tích dữ liệu
2. **02_Preprocessing.ipynb** - Xử lý outliers, feature engineering
3. **03_SingleModels.ipynb** - Train 6 single models với Optuna
4. **04_EnsembleModels.ipynb** - Train ensemble + Ablation study
5. **05_Evaluation.ipynb** - Tổng hợp và xuất model

## Single Models
- Logistic Regression
- Random Forest
- XGBoost
- LightGBM
- SVM
- KNN

## Ensemble Methods
- Hard Voting
- Soft Voting
- Weighted Voting
- Stacking (LR / XGB meta-learner)
- Blending

## Metrics
- Accuracy
- Precision
- **Recall** (quan trọng - không bỏ sót bệnh)
- **F1-Score**
- ROC-AUC
