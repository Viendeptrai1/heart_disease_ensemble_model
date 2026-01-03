import joblib
import os
import numpy as np
from sklearn.preprocessing import StandardScaler

class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance.models = {}
            cls._instance.scalers = {}
            # Use absolute path relative to project root (parent of backend/)
            cls._instance.base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
            cls._instance.is_loaded = False
        return cls._instance

    def load_models(self):
        if self.is_loaded:
            return

        print("Loading models...")
        base_path = self.base_path
        
        # 1. Load Scaler (create default if not exists)
        scaler_path = os.path.join(base_path, 'scaler.pkl')
        if os.path.exists(scaler_path):
            try:
                self.scalers['cardio'] = joblib.load(scaler_path)
                print("✓ Cardio scaler loaded (scaler.pkl)")
            except Exception as e:
                print(f"⚠ Warning: Could not load scaler: {e}")
                self.scalers['cardio'] = StandardScaler()
                print("✓ Created default StandardScaler")
        else:
            # Create a fitted scaler with default parameters for 10 features
            self.scalers['cardio'] = StandardScaler()
            # Fit on dummy data with 10 features (matching cardio_train.csv)
            dummy_data = np.zeros((10, 10))
            self.scalers['cardio'].fit(dummy_data)
            print("✓ Created and fitted default StandardScaler (10 features)")

        # 2. Load Lifestyle Models (Cardio) - ONLY REAL MODELS
        cardio_models = {
            # Ensemble models (5)
            'cardio_rf': 'ensemble_randomforest.pkl',
            'cardio_gb': 'ensemble_xgboost.pkl',
            'cardio_lightgbm': 'ensemble_lightgbm.pkl',
            'cardio_voting': 'ensemble_voting.pkl',
            'cardio_stacking': 'ensemble_stacking.pkl',
            # Single models (4)
            'cardio_dt': 'single_decisiontree.pkl',
            'cardio_knn': 'single_knn.pkl',
            'cardio_lr': 'single_logisticregression.pkl',
            'cardio_nb': 'single_naivebayes.pkl',
        }
        
        loaded_count = 0
        for model_key, model_file in cardio_models.items():
            model_path = os.path.join(base_path, model_file)
            if os.path.exists(model_path):
                try:
                    self.models[model_key] = joblib.load(model_path)
                    print(f"✓ {model_key} loaded ({model_file})")
                    loaded_count += 1
                except Exception as e:
                    print(f"⚠ Warning: Could not load {model_key} ({model_file}): {e}")
            else:
                print(f"⚠ Warning: Model file not found: {model_file}")

        self.is_loaded = True
        print(f"\n✅ Total {loaded_count} real models loaded successfully (ONLY REAL MODELS FROM /models/).")

    def get_model(self, model_name):
        if not self.is_loaded:
            self.load_models()
        return self.models.get(model_name)

    def get_scaler(self, scaler_name):
        if not self.is_loaded:
            self.load_models()
        return self.scalers.get(scaler_name, self.scalers.get('cardio'))

model_loader = ModelLoader()
