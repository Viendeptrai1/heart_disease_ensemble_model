import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import BubbleChart from '../components/BubbleChart';
import LiquidGauge from '../components/LiquidGauge';
import WhatIfSlider from '../components/WhatIfSlider';
import { fetchPatients, compareAllModels, fetchFeatureImportance } from '../services/api';

// Initial Simulation Parameters
const initialSimParams = {
    cholesterol: 250,
    maxHeartRate: 145,
    bloodPressure: 140,
    bloodSugar: 120,
    bmi: 24,
    age: 55,
    active: 0,
};

/**
 * DiagnosticsPage - AI Model Explainability Dashboard
 * Shows SHAP feature importance, confidence gauge, and what-if simulation
 */
const DiagnosticsPage = ({ patient: patientProp, onBack }) => {
    // State for selecting patient when none provided
    const [selectedLocalPatient, setSelectedLocalPatient] = useState(null);

    // Fetch patients list for selection
    const { data: patientsList = [], isLoading: loadingPatients } = useQuery({
        queryKey: ['patients'],
        queryFn: fetchPatients,
        enabled: !patientProp, // Only fetch if no patient prop
    });

    // Use prop patient, local selection, or fallback to null
    const patient = patientProp ?? selectedLocalPatient ?? null;

    const [simParams, setSimParams] = useState(initialSimParams);
    const [features, setFeatures] = useState([]);

    // State for selected model simulation
    const [selectedModelKey, setSelectedModelKey] = useState('cardio_stacking');
    const [isSimulating, setIsSimulating] = useState(false);
    const [debouncedSimParams, setDebouncedSimParams] = useState(initialSimParams);

    // Initialize simulation params from patient data when patient changes
    useEffect(() => {
        if (patient) {
            // Map encoded values back to raw values for sliders
            // cholesterol: 1=<200, 2=200-240, 3=>240 → use midpoint
            const cholesterolMap = { 1: 180, 2: 220, 3: 260 };
            const glucoseMap = { 1: 90, 2: 110, 3: 140 };
            const bmiMap = { 0: 17, 1: 22, 2: 27, 3: 32 };
            const mapMap = { 0: 85, 1: 105, 2: 130, 3: 160 };

            setSimParams({
                cholesterol: cholesterolMap[patient.cholesterol] ?? 200,
                maxHeartRate: patient.maxHeartRate ?? 150,
                bloodPressure: mapMap[patient.MAP_Class] ?? 120,
                bloodSugar: glucoseMap[patient.gluc] ?? 100,
                bmi: bmiMap[patient.BMI_Class] ?? 24,
                age: patient.age ?? 55,
                active: patient.active ?? 0,
                smoke: patient.smoke ?? 0,
                alco: patient.alco ?? 0,
            });

            // Reset user changes flag when switching patients
            setHasUserChanges(false);
            setPredictionResult(null); // Clear previous simulation results
        }
    }, [patient]);

    // Debounce simulation params updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSimParams(simParams);
        }, 500);
        return () => clearTimeout(timer);
    }, [simParams]);

    // Mapping helper functions
    const getAgeBin = (age) => {
        if (age < 35) return 0;
        if (age < 45) return 1;
        if (age < 55) return 2;
        if (age < 65) return 3;
        return 4;
    };

    const getCholesterolClass = (val) => {
        if (val < 200) return 1;
        if (val < 240) return 2;
        return 3;
    };

    const getGlucoseClass = (val) => {
        if (val < 100) return 1;
        if (val < 126) return 2;
        return 3;
    };

    const getBMIClass = (val) => {
        if (val < 18.5) return 0; // Underweight (mapped to 0? Backend expects 0-3 usually)
        if (val < 25) return 1;   // Normal
        if (val < 30) return 2;   // Overweight
        return 3;                 // Obese
    };

    const getMAPClass = (systolic) => {
        // Approximate MAP class from Systolic BP
        // 0: Low (< 90), 1: Normal (90-120), 2: High (120-140), 3: Very High (> 140)
        if (systolic < 90) return 0;
        if (systolic < 120) return 1;
        if (systolic < 140) return 2;
        return 3;
    };

    const estimateCluster = (metrics, age) => {
        let riskScore = 0;

        // TĂNG BIÊN ĐỘ - Mỗi yếu tố có trọng số cao hơn
        if (metrics.cholesterol >= 3) riskScore += 2.5;      // Cholesterol cao: +2.5
        else if (metrics.cholesterol >= 2) riskScore += 1.5; // Cholesterol trung bình: +1.5

        if (metrics.glucose >= 3) riskScore += 2.5;          // Đường huyết cao: +2.5
        else if (metrics.glucose >= 2) riskScore += 1.5;     // Đường huyết trung bình: +1.5

        if (metrics.bmi_class >= 3) riskScore += 2.0;        // Béo phì: +2.0
        else if (metrics.bmi_class >= 2) riskScore += 1.2;   // Thừa cân: +1.2

        if (metrics.blood_pressure >= 3) riskScore += 2.5;   // Huyết áp rất cao: +2.5
        else if (metrics.blood_pressure >= 2) riskScore += 1.5; // Huyết áp cao: +1.5

        if (metrics.smoking === 1) riskScore += 2.0;         // Hút thuốc: +2.0
        if (metrics.alcohol === 1) riskScore += 1.0;         // Uống rượu: +1.0
        if (metrics.active === 0) riskScore += 1.5;          // Không vận động: +1.5

        // Tuổi có tác động lớn hơn
        if (age >= 65) riskScore += 2.5;
        else if (age >= 55) riskScore += 1.5;
        else if (age >= 45) riskScore += 0.8;

        // Phân cụm với ngưỡng mới (tổng điểm cao hơn)
        if (riskScore >= 8) return 4;   // Rủi ro rất cao
        if (riskScore >= 5) return 3;   // Rủi ro cao
        if (riskScore >= 3) return 2;   // Rủi ro trung bình
        if (riskScore >= 1.5) return 1; // Rủi ro thấp
        return 0;                        // Rủi ro rất thấp
    };

    // State for prediction result
    const [predictionResult, setPredictionResult] = useState(null);

    // Fetch feature importance for the patient (debounced with simulation params)
    useEffect(() => {
        const fetchImportance = async () => {
            if (!patient) return;

            try {
                // Create patient data for feature importance using debounced params
                const currentFeatures = {
                    cholesterol: getCholesterolClass(debouncedSimParams.cholesterol),
                    glucose: getGlucoseClass(debouncedSimParams.bloodSugar),
                    smoking: debouncedSimParams.smoke || 0,
                    alcohol: debouncedSimParams.alco || 0,
                    active: debouncedSimParams.active || 0,
                    bmi_class: getBMIClass(debouncedSimParams.bmi),
                    blood_pressure: getMAPClass(debouncedSimParams.bloodPressure),
                };

                const cluster = estimateCluster(currentFeatures, debouncedSimParams.age);

                const patientData = {
                    gender: patient.gender === 'Nam' || patient.gender === 'male' ? 1 : 0,
                    cholesterol: currentFeatures.cholesterol,
                    gluc: currentFeatures.glucose,
                    smoke: currentFeatures.smoking,
                    alco: currentFeatures.alcohol,
                    active: currentFeatures.active,
                    age_bin: getAgeBin(debouncedSimParams.age),
                    BMI_Class: currentFeatures.bmi_class,
                    MAP_Class: currentFeatures.blood_pressure,
                    cluster: cluster
                };

                const importanceData = await fetchFeatureImportance(patientData);

                // Map feature importance to display format
                const featureMapping = {
                    'cholesterol': { name: 'Cholesterol', type: 'risk' },
                    'MAP_Class': { name: 'Huyết Áp (MAP)', type: 'risk' },
                    'BMI_Class': { name: 'BMI', type: 'risk' },
                    'age_bin': { name: 'Tuổi', type: 'risk' },
                    'active': { name: 'Vận Động', type: 'protective' },
                    'gluc': { name: 'Đường Huyết', type: 'risk' },
                    'smoke': { name: 'Hút Thuốc', type: 'risk' },
                    'alco': { name: 'Uống Rượu', type: 'risk' },
                    'cluster': { name: 'Nhóm Rủi Ro', type: 'risk' },
                    'gender': { name: 'Giới Tính', type: 'neutral' },
                };

                const formattedFeatures = Object.entries(importanceData).map(([key, value]) => ({
                    feature: featureMapping[key]?.name || key,
                    importance: value,
                    type: featureMapping[key]?.type || 'neutral'
                })).sort((a, b) => b.importance - a.importance);

                setFeatures(formattedFeatures);
            } catch (error) {
                console.error('Error fetching feature importance:', error);
                // Fallback to empty features
                setFeatures([]);
            }
        };

        fetchImportance();
    }, [patient, debouncedSimParams]);

    // State to track if user has made any changes to sliders
    const [hasUserChanges, setHasUserChanges] = React.useState(false);

    // Effect to run simulation ONLY when user changes params (not on initial mount)
    useEffect(() => {
        const runSimulation = async () => {
            if (!patient) return;

            // CRITICAL: Only run simulation if user has made changes
            // This prevents auto-running on mount which causes different results
            if (!hasUserChanges) return;

            setIsSimulating(true);

            try {
                // Map raw simulation params to model input features
                const currentFeatures = {
                    cholesterol: getCholesterolClass(debouncedSimParams.cholesterol),
                    glucose: getGlucoseClass(debouncedSimParams.bloodSugar),
                    smoking: debouncedSimParams.smoke || 0,
                    alcohol: debouncedSimParams.alco || 0,
                    active: debouncedSimParams.active || 0,
                    bmi_class: getBMIClass(debouncedSimParams.bmi),
                    blood_pressure: getMAPClass(debouncedSimParams.bloodPressure),
                };

                const cluster = estimateCluster(currentFeatures, debouncedSimParams.age);

                const inputs = {
                    gender: patient.gender === 'Nam' || patient.gender === 'male' ? 1 : 0,
                    cholesterol: currentFeatures.cholesterol,
                    gluc: currentFeatures.glucose,
                    smoke: currentFeatures.smoking,
                    alco: currentFeatures.alcohol,
                    active: currentFeatures.active,
                    age_bin: getAgeBin(debouncedSimParams.age),
                    BMI_Class: currentFeatures.bmi_class,
                    MAP_Class: currentFeatures.blood_pressure,
                    cluster: cluster
                };

                const result = await compareAllModels(inputs); // Using existing API
                setPredictionResult(result);
            } catch (error) {
                console.error("Simulation failed:", error);
            } finally {
                setIsSimulating(false);
            }
        };

        runSimulation();
    }, [debouncedSimParams, patient, hasUserChanges]);

    // Get Risk Score (Probability of Disease) from selected model
    const simulatedRiskScore = useMemo(() => {
        // 1. If we have a simulation result from the backend
        if (predictionResult) {
            const modelResult = predictionResult.all_models.find(m => m.model_key === selectedModelKey);
            // USE EXACT risk_score from backend model (NO MODIFICATION)
            // Each model returns different risk_score based on its own prediction
            console.log(`[DiagnosticsPage] Selected model: ${selectedModelKey}, risk_score: ${modelResult?.risk_score}`);
            return modelResult ? modelResult.risk_score : 0.5;
        }

        // 2. Fallback to initial patient data if no simulation yet
        if (!patient) return 0.5;

        // SIMPLIFIED: Use patient's risk_score if available (consistent with Dashboard)
        // This ensures the initial display matches what user sees in Dashboard/Hero
        if (patient.risk_score !== undefined && patient.risk_score !== null) {
            console.log(`[DiagnosticsPage] Using patient.risk_score: ${patient.risk_score}`);
            return patient.risk_score;
        }

        // Fallback: Use confidence as risk score directly
        // Patient confidence is probability of the predicted risk level
        console.log(`[DiagnosticsPage] Fallback to confidence: ${patient.confidence ?? 0.5}`);
        return patient.confidence ?? 0.5;
    }, [predictionResult, selectedModelKey, patient]);

    const simulatedRiskLevel = simulatedRiskScore > 0.5 ? 'High' : 'Low';

    // Model options for selector
    // Model options for selector - MUST match keys in backend/main.py
    const modelOptions = [
        { key: 'cardio_stacking', name: 'Stacking Ensemble (Best)' },
        { key: 'cardio_voting', name: 'Voting Ensemble' },
        { key: 'cardio_lightgbm', name: 'LightGBM' },
        { key: 'cardio_gb', name: 'XGBoost (Gradient Boosting)' },
        { key: 'cardio_rf', name: 'Random Forest' },
        { key: 'cardio_lr', name: 'Logistic Regression' },
        { key: 'cardio_dt', name: 'Decision Tree' },
        { key: 'cardio_knn', name: 'K-Nearest Neighbors' },
        { key: 'cardio_nb', name: 'Naive Bayes' },
    ];

    // Handle feature click for details
    const handleFeatureClick = useCallback((feature) => {
        console.log('Feature clicked:', feature);
    }, []);

    // Handle patient selection
    const handleSelectPatient = (p) => {
        setSelectedLocalPatient({
            id: p.id,
            name: p.name,
            age: p.age || 55,
            gender: p.gender === 'Nam' || p.gender === 'male' ? 'Nam' : 'Nữ',
            riskLevel: p.riskLevel === 'high' ? 'High' : p.riskLevel === 'medium' ? 'Medium' : 'Low',
            confidence: p.confidence || (p.healthScore || 70) / 100,
            risk_score: p.risk_score, // CRITICAL: Pass risk_score for consistency
        });
    };

    // Update simulation parameters
    const handleParamChange = useCallback((param, value) => {
        setSimParams(prev => ({ ...prev, [param]: value }));
        setHasUserChanges(true); // Mark that user has made changes
    }, []);

    // If no patient selected, show patient selection screen
    if (!patient) {
        return (
            <div className="min-h-screen pb-8">
                {/* Header */}
                <motion.header
                    className="glass mb-8 mx-4 px-8 py-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: '0% 40% 40% 0% / 0% 100% 100% 0%' }}
                >
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <motion.button
                                onClick={onBack}
                                className="p-2 rounded-full hover:bg-moss/10 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-6 h-6 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </motion.button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-moss">Chẩn Đoán AI</h1>
                            <p className="text-moss/60 text-sm">Chọn bệnh nhân để xem phân tích chi tiết</p>
                        </div>
                    </div>
                </motion.header>

                {/* Patient Selection Grid */}
                <div className="px-4">
                    <motion.section
                        className="glass p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ borderRadius: '30px 10px 30px 10px' }}
                    >
                        <h2 className="text-lg font-bold text-moss mb-4 flex items-center gap-2">
                            <span className="text-2xl">👥</span>
                            Chọn Bệnh Nhân
                        </h2>

                        {loadingPatients ? (
                            <div className="flex items-center justify-center py-12">
                                <motion.div
                                    className="w-12 h-12 rounded-full border-4 border-sage border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                        ) : patientsList.length === 0 ? (
                            <div className="text-center py-12 text-moss/60">
                                <p>Không có bệnh nhân nào trong hệ thống</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {patientsList.map((p, index) => (
                                    <motion.div
                                        key={p.id}
                                        className="glass p-4 cursor-pointer hover:shadow-lg transition-all"
                                        style={{ borderRadius: '20px 8px 20px 8px' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectPatient(p)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div
                                                className={`w-12 h-12 flex items-center justify-center text-sand font-bold
                                                    ${p.riskLevel === 'high' ? 'bg-clay' : p.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-sage'}
                                                `}
                                                style={{ borderRadius: '50% 40% 50% 40%' }}
                                            >
                                                {p.id.slice(-4)}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="font-bold text-moss">{p.id}</div>
                                                <div className="text-sm text-moss/60">
                                                    {p.name} • {p.age || '?'} tuổi
                                                </div>
                                            </div>

                                            {/* Risk indicator */}
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full mb-1
                                                    ${p.riskLevel === 'high'
                                                        ? 'bg-clay/20 text-clay'
                                                        : p.riskLevel === 'medium'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-sage/20 text-sage'
                                                    }
                                                `}>
                                                    Tỷ lệ: {((p.risk_score ?? 0.5) * 100).toFixed(2)}%
                                                </span>
                                                <span className="text-[10px] text-moss/50 uppercase font-bold">
                                                    {p.riskLevel === 'high' ? 'Cao' : p.riskLevel === 'medium' ? 'TB' : 'Thấp'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-8">
            {/* Animated Wave Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-1/2 -left-1/4 w-[150%] h-[100%] opacity-10"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        rotate: [0, 5, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <svg viewBox="0 0 1000 500" className="w-full h-full">
                        <path
                            d="M0,250 Q250,150 500,250 T1000,250 L1000,500 L0,500 Z"
                            fill="#87986A"
                        />
                    </svg>
                </motion.div>
                <motion.div
                    className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[100%] opacity-5"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -20, 0],
                        rotate: [0, -3, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <svg viewBox="0 0 1000 500" className="w-full h-full">
                        <path
                            d="M0,100 Q250,200 500,100 T1000,100 L1000,0 L0,0 Z"
                            fill="#D57E5F"
                        />
                    </svg>
                </motion.div>
            </div>

            {/* Patient Header Strip */}
            <motion.header
                className="glass mb-8 mx-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    borderRadius: '0% 40% 40% 0% / 0% 100% 100% 0%',
                }}
            >
                <div className="px-8 py-6 flex items-center justify-between">
                    {/* Back Button */}
                    {onBack && (
                        <motion.button
                            onClick={onBack}
                            className="mr-6 p-2 rounded-full hover:bg-moss/10 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg className="w-6 h-6 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                    )}

                    {/* Patient Info */}
                    <div className="flex items-center gap-8 flex-1">
                        {/* Patient Avatar */}
                        <motion.div
                            className={`w-16 h-16 flex items-center justify-center text-sand font-bold text-xl
                                ${patient.riskLevel === 'High' ? 'bg-clay'
                                    : patient.riskLevel === 'Medium' ? 'bg-amber-500'
                                        : 'bg-sage'}
                            `}
                            style={{
                                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                            }}
                            animate={{
                                borderRadius: [
                                    '60% 40% 30% 70% / 60% 30% 70% 40%',
                                    '30% 70% 70% 30% / 30% 30% 70% 70%',
                                    '60% 40% 30% 70% / 60% 30% 70% 40%',
                                ]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            {(patient.id || '').slice(-4) || '?'}
                        </motion.div>

                        {/* Patient Details */}
                        <div>
                            <h1 className="text-2xl font-bold text-moss">{patient.id}</h1>
                            {patient.name && (
                                <p className="text-moss/80 font-medium">{patient.name}</p>
                            )}
                            <div className="flex gap-4 text-moss/70 text-sm mt-1">
                                <span>🎂 {patient.age || '?'} tuổi</span>
                                <span>👤 {patient.gender || '?'}</span>
                                {patient.healthScore && (
                                    <span>💊 Điểm SK: {patient.healthScore}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Risk Badge */}
                    {/* Risk Badge */}
                    <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full
                                ${simulatedRiskScore > 0.5 ? 'bg-clay text-white'
                                : simulatedRiskScore > 0.2 ? 'bg-amber-500 text-white'
                                    : 'bg-sage text-white'}
                            `}>
                            Tỷ lệ Tim Mạch: {(simulatedRiskScore * 100).toFixed(2)}%
                        </span>
                        <span className="text-xs text-moss/60 mt-1 font-medium">
                            {simulatedRiskScore > 0.5 ? 'Nguy cơ Cao'
                                : simulatedRiskScore > 0.2 ? 'Nguy cơ Trung Bình'
                                    : 'Nguy cơ Thấp'}
                        </span>
                    </div>
                </div>
            </motion.header>

            {/* Main Content Grid */}
            <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Feature Importance Section */}
                <motion.section
                    className="lg:col-span-2 glass p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        borderRadius: '40% 10% 10% 40% / 10% 10% 10% 10%',
                    }}
                >
                    <h2 className="text-xl font-bold text-moss mb-2">
                        Tại Sao? - Độ Quan Trọng Đặc Trưng (SHAP)
                    </h2>
                    <p className="text-moss/60 text-sm mb-4">
                        Kích thước bong bóng = Mức độ ảnh hưởng. Nhấp để xem chi tiết.
                    </p>
                    <BubbleChart
                        features={features}
                        onFeatureClick={handleFeatureClick}
                    />
                </motion.section>

                {/* Confidence Gauge Section */}
                <motion.section
                    className="glass p-6 flex flex-col items-center justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        borderRadius: '10% 40% 40% 10% / 20% 20% 20% 20%',
                    }}
                >
                    <LiquidGauge
                        value={simulatedRiskScore}
                        riskLevel={simulatedRiskLevel}
                        size={220}
                        label="Tỷ lệ Rủi ro Tim Mạch"
                    />
                </motion.section>
            </div>

            {/* What-If Simulation Panel */}
            <motion.section
                className="mx-4 mt-8 glass p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                    borderRadius: '20% 20% 40% 40% / 5% 5% 10% 10%',
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 bg-sage/20 flex items-center justify-center text-xl"
                            style={{ borderRadius: '50% 50% 30% 70% / 50% 70% 30% 50%' }}
                            animate={{ rotate: isSimulating ? 360 : 0 }}
                            transition={{ duration: 1, repeat: isSimulating ? Infinity : 0, ease: "linear" }}
                        >
                            🔬
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-bold text-moss">
                                Mô Phỏng "What-If" AI Thực
                            </h2>
                            <p className="text-moss/60 text-sm">
                                Dự đoán Real-time với model backend
                            </p>
                        </div>
                    </div>

                    {/* Model Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-moss/70">Model:</span>
                        <select
                            value={selectedModelKey}
                            onChange={(e) => setSelectedModelKey(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-white/60 border border-sage/30 text-sm font-bold text-moss focus:outline-none focus:ring-2 focus:ring-sage/50"
                        >
                            {modelOptions.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <WhatIfSlider
                        label="Cholesterol (mg/dL)"
                        value={simParams.cholesterol}
                        min={100}
                        max={400}
                        step={5}
                        unit=""
                        color="clay"
                        onChange={(v) => handleParamChange('cholesterol', v)}
                    />
                    <WhatIfSlider
                        label="Huyết Áp TT (mmHg)"
                        value={simParams.bloodPressure}
                        min={80}
                        max={200}
                        step={1}
                        unit=""
                        color="clay"
                        onChange={(v) => handleParamChange('bloodPressure', v)}
                    />
                    <WhatIfSlider
                        label="Đường Huyết (mg/dL)"
                        value={simParams.bloodSugar}
                        min={70}
                        max={200}
                        step={1}
                        unit=""
                        color="clay"
                        onChange={(v) => handleParamChange('bloodSugar', v)}
                    />
                    <WhatIfSlider
                        label="Chỉ Số BMI"
                        value={simParams.bmi}
                        min={15}
                        max={40}
                        step={0.5}
                        unit=""
                        color={simParams.bmi > 25 ? 'clay' : 'sage'}
                        onChange={(v) => handleParamChange('bmi', v)}
                    />
                    <WhatIfSlider
                        label="Tuổi"
                        value={simParams.age}
                        min={30}
                        max={90}
                        step={1}
                        unit=" tuổi"
                        color="clay"
                        onChange={(v) => handleParamChange('age', v)}
                    />
                    <WhatIfSlider
                        label="Vận Động (0=Không, 1=Có)"
                        value={simParams.active}
                        min={0}
                        max={1}
                        step={1}
                        unit=""
                        color="sage"
                        onChange={(v) => handleParamChange('active', v)}
                    />
                    <WhatIfSlider
                        label="Hút Thuốc (0=Không, 1=Có)"
                        value={simParams.smoke || 0}
                        min={0}
                        max={1}
                        step={1}
                        unit=""
                        color="clay"
                        onChange={(v) => handleParamChange('smoke', v)}
                    />
                    <WhatIfSlider
                        label="Uống Rượu (0=Không, 1=Có)"
                        value={simParams.alco || 0}
                        min={0}
                        max={1}
                        step={1}
                        unit=""
                        color="clay"
                        onChange={(v) => handleParamChange('alco', v)}
                    />
                </div>

                {/* Simulation Result */}
                <motion.div
                    className="mt-8 p-4 glass text-center relative overflow-hidden"
                    style={{ borderRadius: '2rem' }}
                    key={`${selectedModelKey}-${simulatedRiskScore.toFixed(2)}`}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                >
                    {isSimulating && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                            <span className="animate-pulse font-bold text-sage">Đang tính toán...</span>
                        </div>
                    )}

                    <span className="text-moss/70 text-sm">Tỷ lệ Rủi ro Dự Đoán ({modelOptions.find(m => m.key === selectedModelKey)?.name}): </span>
                    <span className={`font-bold text-lg ${simulatedRiskLevel === 'High' ? 'text-clay' : 'text-sage'}`}>
                        {(simulatedRiskScore * 100).toFixed(2)}%
                    </span>
                    {patient && (
                        <span className="ml-2 text-sm">
                            {(
                                () => {
                                    // Calculate base risk score for original patient
                                    const baseRisk = patient.riskLevel?.toLowerCase() === 'high'
                                        ? (patient.confidence ?? 0.5)
                                        : (1 - (patient.confidence ?? 0.5));

                                    const diff = simulatedRiskScore - baseRisk;

                                    if (Math.abs(diff) < 0.001) return null;

                                    return diff > 0
                                        ? <span className="text-clay">↑ Tăng {(Math.abs(diff) * 100).toFixed(2)}%</span>
                                        : <span className="text-sage">↓ Giảm {(Math.abs(diff) * 100).toFixed(2)}%</span>;
                                }
                            )()}
                        </span>
                    )}
                </motion.div>
            </motion.section>

            {/* Trend Line Section (Optional Future Enhancement) */}
            <motion.section
                className="mx-4 mt-8 glass p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    borderRadius: '10% 30% 30% 10% / 20% 20% 20% 20%',
                }}
            >
                <h2 className="text-lg font-bold text-moss mb-4">
                    📈 Xu Hướng Theo Thời Gian
                </h2>
                <div className="h-32 flex items-center justify-center relative overflow-hidden">
                    {/* Simple SVG Trend Line */}
                    <svg viewBox="0 0 400 100" className="w-full h-full">
                        <defs>
                            <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#D57E5F" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#D57E5F" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Area fill */}
                        <motion.path
                            initial={{ d: "M0,80 Q50,70 100,60 T200,45 T300,55 T400,40 L400,100 L0,100 Z", opacity: 0 }}
                            d="M0,80 Q50,70 100,60 T200,45 T300,55 T400,40 L400,100 L0,100 Z"
                            fill="url(#trend-gradient)"
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        />
                        {/* Line */}
                        <motion.path
                            initial={{ d: "M0,80 Q50,70 100,60 T200,45 T300,55 T400,40", pathLength: 0 }}
                            d="M0,80 Q50,70 100,60 T200,45 T300,55 T400,40"
                            fill="none"
                            stroke="#D57E5F"
                            strokeWidth="3"
                            strokeLinecap="round"
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                        {/* Data points */}
                        {[[0, 80], [100, 60], [200, 45], [300, 55], [400, 40]].map(([x, y], i) => (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="5"
                                fill="#D57E5F"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                            />
                        ))}
                    </svg>
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 w-full flex justify-between px-4 text-xs text-moss/50">
                        <span>T1</span>
                        <span>T2</span>
                        <span>T3</span>
                        <span>T4</span>
                        <span>Hiện tại</span>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default DiagnosticsPage;
