# Chẩn Đoán Bệnh Tim Bằng Ensemble Model

## Mô tả
Đồ án môn học Máy học: Xây dựng hệ thống chẩn đoán bệnh tim mạch (Cardiovascular Disease Prediction) sử dụng các kỹ thuật học máy tiên tiến, tập trung vào việc so sánh hiệu quả giữa các **Single Models** và các phương pháp **Ensemble Learning** phức tạp.

## Dataset
- **Nguồn**: Cardiovascular Disease Dataset (`cardio_train.csv`)
- **Số lượng**: ~70,000 samples
- **Features**: 11 features gốc + các features được tạo thêm (BMI, Age bins, Blood Pressure levels, v.v.)

## Cấu trúc Project

```
a_benh_tim/
├── DataRaw/
│   └── cardio_train.csv          # Dataset gốc
├── data/
│   ├── X_train.npy, X_val.npy, X_test.npy
│   ├── y_train.npy, y_val.npy, y_test.npy
│   └── feature_names.npy         # Tên các đặc trưng sau khi xử lý
├── models/
│   ├── best_params_single.pkl    # Best params cho single models
│   ├── best_params_ensemble.pkl  # Best params cho ensemble models
│   ├── single_*.pkl              # Các mô hình đơn lẻ đã train
│   ├── ensemble_*.pkl            # Các mô hình ensemble đã train
│   └── scaler.pkl                # StandardScaler object
├── outputs/
│   ├── single_models_results.csv # Kết quả đánh giá single models
│   ├── ensemble_models_results.csv # Kết quả đánh giá ensemble models
│   └── *.png                     # Biểu đồ visualize
├── 01_EDA.ipynb                  # Phân tích khám phá dữ liệu (Exploratory Data Analysis)
├── 02_Preprocessing.ipynb        # Tiền xử lý, feature engineering, split data
├── 03_SingleModels.ipynb         # Train và tune hyperparam cho 6 single models cơ bản
├── 04_EnsembleModels.ipynb       # Implement và train các kỹ thuật Ensemble (Voting, Stacking, Blending...)
├── 05_Evaluation.ipynb           # Đánh giá tổng hợp, so sánh và chọn Best Model
├── requirements.txt              # Các thư viện cần thiết
└── README.md
```

## Yêu cầu cài đặt

```bash
pip install -r requirements.txt
```

## Quy trình thực hiện

Dự án được chia thành 5 bước chính, tương ứng với 5 notebooks. Chạy lần lượt theo thứ tự:

1.  **01_EDA.ipynb**: 
    -   Tải dữ liệu, kiểm tra tổng quan.
    -   Phân tích đơn biến, đa biến.
    -   Trực quan hóa sự phân bố và tương quan của dữ liệu.

2.  **02_Preprocessing.ipynb**:
    -   Xử lý dữ liệu nhiễu (outliers).
    -   Feature Engineering: Tạo đặc trưng mới (BMI, Ap_hi/lo bins).
    -   Chuẩn hóa dữ liệu (StandardScaler).
    -   Chia tập dữ liệu: Train (70%), Val (15%), Test (15%).
    -   Lưu dữ liệu đã xử lý vào thư mục `data/`.

3.  **03_SingleModels.ipynb**:
    -   Huấn luyện 6 mô hình cơ bản:
        -   **Logistic Regression**
        -   **K-Nearest Neighbors (KNN)**
        -   **Naive Bayes (GaussianNB)**
        -   **Decision Tree**
        -   **Multi-layer Perceptron (MLP/Neural Network)**
        -   **SGD Classifier (Linear SVM optimized)**
    -   Sử dụng **Optuna** để tinh chỉnh siêu tham số (Hyperparameter Tuning).
    -   Lưu các model tốt nhất vào `models/`.

4.  **04_EnsembleModels.ipynb**:
    -   **Pre-built Ensembles**: Random Forest, XGBoost, LightGBM.
    -   **Advanced Methods**: Bagging SVM, Nystroem Kernel Approximation.
    -   **True Ensembles (kết hợp các Single Models)**:
        -   **Voting**: Hard Voting & Soft Voting.
        -   **Stacking**: Sử dụng Logistic Regression làm Meta-learner.
        -   **Blending**: Train meta-learner trên tập Validation.
    -   So sánh hiệu năng giữa các phương pháp.

5.  **05_Evaluation.ipynb**:
    -   Load tất cả kết quả từ file CSV.
    -   Vẽ biểu đồ so sánh trực quan (Bar chart, ROC Curve).
    -   Phân tích chi tiết Best Model (Confusion Matrix, Classification Report).
    -   Kết luận cuối cùng.

## Metrics Đánh giá
Hệ thống sử dụng các chỉ số sau để đánh giá hiệu năng mô hình:
-   **F1-Score**: Chỉ số chính để tối ưu (cân bằng giữa Precision và Recall).
-   **Recall**: Quan trọng trong y tế (giảm thiểu bỏ sót ca bệnh).
-   **Precision**: Độ chính xác của các dự đoán tích cực.
-   **Accuracy**: Độ chính xác tổng thể.
-   **ROC-AUC**: Khả năng phân loại của mô hình.

## Tác giả
[Tên của bạn/Nhóm của bạn]
