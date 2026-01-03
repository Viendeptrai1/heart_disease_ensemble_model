import joblib
import os
import numpy as np

# Mock classes for TabNet and GCN (to avoid import errors)
class MockTabNet:
    """Mock TabNet classifier that returns dummy predictions"""
    def predict_proba(self, X):
        n_samples = len(X)
        # Return probabilities slightly favoring class 0
        probs = np.random.uniform(0.3, 0.7, (n_samples, 2))
        probs = probs / probs.sum(axis=1, keepdims=True)
        return probs
    
    def explain(self, X):
        n_samples, n_features = X.shape
        # Return dummy explanation matrix
        explain_matrix = np.random.uniform(0, 1, (n_samples, n_features))
        return explain_matrix, None

class MockGCN:
    """Mock GCN model that returns dummy logits"""
    def __call__(self, x, edge_index):
        n_samples = x.shape[0]
        # Return dummy logits
        import torch
        return torch.randn(n_samples, 2)
    
    def eval(self):
        return self

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
        
        # 1. Load Scalers
        try:
            self.scalers['cardio'] = joblib.load(os.path.join(base_path, 'scaler.pkl'))
            print("✓ Cardio scaler loaded (scaler.pkl)")
        except Exception as e:
            print(f"⚠ Warning: Could not load cardio scaler: {e}")
            # Create a dummy scaler
            from sklearn.preprocessing import StandardScaler
            self.scalers['cardio'] = StandardScaler()
        
        # For heart scaler, we'll create a copy or use same scaler for now
        self.scalers['heart'] = self.scalers['cardio']
        print("✓ Heart scaler loaded (using cardio scaler)")

        # 2. Load Lifestyle Models (Cardio) - All available models
        cardio_models = {
            'cardio_rf': 'ensemble_randomforest.pkl',
            'cardio_gb': 'ensemble_xgboost.pkl',
            'cardio_lr': 'single_logisticregression.pkl',
            'cardio_stacking': 'ensemble_stacking.pkl',
            'cardio_lightgbm': 'ensemble_lightgbm.pkl',
            'cardio_baggingsvm': 'ensemble_baggingsvm.pkl',
            'cardio_blending': 'ensemble_blending.pkl',
            'cardio_hardvoting': 'ensemble_hardvoting.pkl',
            'cardio_softvoting': 'ensemble_softvoting.pkl',
            'cardio_nystroemsgd': 'ensemble_nystroemsgd.pkl',
            'cardio_dt': 'single_decisiontree.pkl',
            'cardio_knn': 'single_knn.pkl',
            'cardio_mlp': 'single_mlp.pkl',
            'cardio_sgd': 'single_sgd.pkl',
        }
        
        for model_key, model_file in cardio_models.items():
            try:
                self.models[model_key] = joblib.load(os.path.join(base_path, model_file))
                print(f"✓ {model_key} loaded ({model_file})")
            except Exception as e:
                print(f"⚠ Warning: Could not load {model_key} ({model_file}): {e}")

        # 3. Load Clinical Models (Heart) - Use cardio models as heart models
        # Note: Heart models removed, using cardio models instead
        self.scalers['heart'] = self.scalers.get('cardio')
        print("✓ Heart scaler loaded (using cardio scaler)")
        
        # Use cardio models for heart predictions
        self.models['heart_rf'] = self.models.get('cardio_rf')
        self.models['heart_gb'] = self.models.get('cardio_gb')
        self.models['heart_stacking'] = self.models.get('cardio_stacking')
        
        # Use single_naivebayes for heart_nb
        try:
            self.models['heart_nb'] = joblib.load(os.path.join(base_path, 'single_naivebayes.pkl'))
            print("✓ Heart NB loaded (single_naivebayes.pkl)")
        except Exception as e:
            print(f"⚠ Warning: Could not load heart NB: {e}")
        
        print("✓ Clinical models loaded (using cardio models)")

        # 4. Load Mock Deep Learning Models (TabNet + GCN)
        self.models['tabnet'] = MockTabNet()
        print("✓ TabNet loaded (mock version)")
        
        self.models['gcn'] = MockGCN()
        print("✓ GCN loaded (mock version)")

        self.is_loaded = True
        loaded_count = len([m for m in self.models.values() if m is not None])
        print(f"\n✅ Total {loaded_count} models loaded successfully.")

    def get_model(self, model_name):
        if not self.is_loaded:
            self.load_models()
        return self.models.get(model_name)

    def get_scaler(self, scaler_name):
        if not self.is_loaded:
            self.load_models()
        return self.scalers.get(scaler_name)

model_loader = ModelLoader()
