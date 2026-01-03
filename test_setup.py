#!/usr/bin/env python3
"""
Setup Validation Script
========================
Tests that all components of the Heart Disease Prediction System are properly configured.

Usage:
    python test_setup.py
"""

import os
import sys
import requests
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ {text}{Colors.RESET}")

# Get project root
PROJECT_ROOT = Path(__file__).parent

def test_directory_structure():
    """Test that all required directories exist"""
    print_header("TESTING DIRECTORY STRUCTURE")
    
    required_dirs = [
        'backend',
        'backend/data',
        'frontend',
        'frontend/src',
        'models',
        'data',
    ]
    
    all_pass = True
    for dir_path in required_dirs:
        full_path = PROJECT_ROOT / dir_path
        if full_path.exists():
            print_success(f"Directory exists: {dir_path}")
        else:
            print_error(f"Directory missing: {dir_path}")
            all_pass = False
    
    return all_pass

def test_model_files():
    """Test that required model files exist"""
    print_header("TESTING MODEL FILES")
    
    required_models = [
        'scaler.pkl',
        'ensemble_randomforest.pkl',
        'ensemble_stacking.pkl',
        'heart_scaler.pkl',
        'heart_rf.pkl',
        'heart_nb.pkl',
    ]
    
    models_dir = PROJECT_ROOT / 'models'
    all_pass = True
    
    for model_file in required_models:
        model_path = models_dir / model_file
        if model_path.exists():
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print_success(f"Model exists: {model_file} ({size_mb:.2f} MB)")
        else:
            print_error(f"Model missing: {model_file}")
            all_pass = False
    
    return all_pass

def test_data_files():
    """Test that required data files exist"""
    print_header("TESTING DATA FILES")
    
    # Check training data
    data_files = [
        ('data/cardio_cleaned.csv', 'Training data'),
        ('data/heart_clinical.csv', 'Clinical data'),
    ]
    
    # Check database CSV files
    db_files = [
        ('backend/data/patients.csv', 'Patients database'),
        ('backend/data/medical_events.csv', 'Medical events'),
        ('backend/data/documents.csv', 'Documents'),
        ('backend/data/treatment_plans.csv', 'Treatment plans'),
        ('backend/data/lifestyle_examinations.csv', 'Lifestyle exams'),
        ('backend/data/clinical_examinations.csv', 'Clinical exams'),
    ]
    
    all_pass = True
    
    for file_path, description in data_files:
        full_path = PROJECT_ROOT / file_path
        if full_path.exists():
            print_success(f"{description}: {file_path}")
        else:
            print_warning(f"{description} missing: {file_path}")
    
    for file_path, description in db_files:
        full_path = PROJECT_ROOT / file_path
        if full_path.exists():
            print_success(f"{description}: {file_path}")
        else:
            print_warning(f"{description} missing: {file_path} (will be created on first use)")
    
    return all_pass

def test_python_dependencies():
    """Test that required Python packages are installed"""
    print_header("TESTING PYTHON DEPENDENCIES")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'pydantic',
        'pandas',
        'numpy',
        'scikit-learn',
        'joblib',
    ]
    
    all_pass = True
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print_success(f"Package installed: {package}")
        except ImportError:
            print_error(f"Package missing: {package}")
            all_pass = False
    
    return all_pass

def test_model_loading():
    """Test that models can be loaded"""
    print_header("TESTING MODEL LOADING")
    
    try:
        sys.path.insert(0, str(PROJECT_ROOT / 'backend'))
        from model_loader import model_loader
        
        print_info("Loading models...")
        model_loader.load_models()
        
        # Check if models loaded
        model_count = len(model_loader.models)
        scaler_count = len(model_loader.scalers)
        
        print_success(f"Loaded {model_count} models")
        print_success(f"Loaded {scaler_count} scalers")
        
        return model_count > 0 and scaler_count > 0
        
    except Exception as e:
        print_error(f"Failed to load models: {e}")
        return False

def test_backend_api():
    """Test if backend API is accessible"""
    print_header("TESTING BACKEND API")
    
    try:
        print_info("Checking if backend is running on http://localhost:8000...")
        response = requests.get('http://localhost:8000/docs', timeout=3)
        
        if response.status_code == 200:
            print_success("Backend API is accessible")
            return True
        else:
            print_warning(f"Backend returned status code: {response.status_code}")
            return False
            
    except requests.ConnectionError:
        print_warning("Backend is not running. Start it with: ./start.sh or uvicorn backend.main:app")
        return False
    except Exception as e:
        print_error(f"Error checking backend: {e}")
        return False

def test_frontend_setup():
    """Test frontend configuration"""
    print_header("TESTING FRONTEND SETUP")
    
    frontend_dir = PROJECT_ROOT / 'frontend'
    all_pass = True
    
    # Check package.json
    package_json = frontend_dir / 'package.json'
    if package_json.exists():
        print_success("package.json exists")
    else:
        print_error("package.json missing")
        all_pass = False
    
    # Check node_modules
    node_modules = frontend_dir / 'node_modules'
    if node_modules.exists():
        print_success("node_modules installed")
    else:
        print_warning("node_modules not found. Run: cd frontend && npm install")
    
    # Check key source files
    src_files = [
        'src/App.jsx',
        'src/services/api.js',
        'src/pages/Dashboard.jsx',
    ]
    
    for file_path in src_files:
        full_path = frontend_dir / file_path
        if full_path.exists():
            print_success(f"Source file exists: {file_path}")
        else:
            print_error(f"Source file missing: {file_path}")
            all_pass = False
    
    return all_pass

def test_docker_setup():
    """Test Docker configuration"""
    print_header("TESTING DOCKER SETUP")
    
    docker_files = [
        'Dockerfile.backend',
        'Dockerfile.frontend',
        'docker-compose.yml',
    ]
    
    all_pass = True
    
    for file_name in docker_files:
        file_path = PROJECT_ROOT / file_name
        if file_path.exists():
            print_success(f"Docker file exists: {file_name}")
        else:
            print_error(f"Docker file missing: {file_name}")
            all_pass = False
    
    return all_pass

def test_startup_scripts():
    """Test startup scripts exist"""
    print_header("TESTING STARTUP SCRIPTS")
    
    scripts = [
        'start.sh',
        'install.sh',
        'start-docker.sh',
    ]
    
    all_pass = True
    
    for script_name in scripts:
        script_path = PROJECT_ROOT / script_name
        if script_path.exists():
            is_executable = os.access(script_path, os.X_OK)
            if is_executable:
                print_success(f"Script exists and is executable: {script_name}")
            else:
                print_warning(f"Script exists but not executable: {script_name} (run: chmod +x {script_name})")
        else:
            print_error(f"Script missing: {script_name}")
            all_pass = False
    
    return all_pass

def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}Heart Disease Prediction System - Setup Validation{Colors.RESET}")
    print(f"{Colors.BOLD}Project Root: {PROJECT_ROOT}{Colors.RESET}")
    
    results = {
        "Directory Structure": test_directory_structure(),
        "Model Files": test_model_files(),
        "Data Files": test_data_files(),
        "Python Dependencies": test_python_dependencies(),
        "Model Loading": test_model_loading(),
        "Frontend Setup": test_frontend_setup(),
        "Docker Setup": test_docker_setup(),
        "Startup Scripts": test_startup_scripts(),
        "Backend API": test_backend_api(),
    }
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASS")
        else:
            print_error(f"{test_name}: FAIL")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed! System is ready to use.{Colors.RESET}\n")
        return 0
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠ Some tests failed. Please address the issues above.{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())


