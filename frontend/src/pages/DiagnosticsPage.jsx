import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import BubbleChart from '../components/BubbleChart';
import LiquidGauge from '../components/LiquidGauge';
import WhatIfSlider from '../components/WhatIfSlider';
import { fetchPatients } from '../services/api';

// Mock SHAP Feature Data
const mockFeatures = [
    { feature: "Đau Ngực", importance: 0.45, type: "risk" },
    { feature: "Nhịp Tim Tối Đa", importance: 0.32, type: "protective" },
    { feature: "Cholesterol", importance: 0.28, type: "risk" },
    { feature: "Huyết Áp", importance: 0.22, type: "risk" },
    { feature: "Tuổi", importance: 0.18, type: "risk" },
    { feature: "Vận Động", importance: 0.15, type: "protective" },
    { feature: "Đường Huyết", importance: 0.12, type: "risk" },
    { feature: "Kết Quả ECG", importance: 0.08, type: "protective" },
];

// Mock Patient Data
const mockPatient = {
    id: "P-042",
    age: 58,
    gender: "Nam",
    riskLevel: "High",
    confidence: 0.92,
};

// Initial Simulation Parameters
const initialSimParams = {
    cholesterol: 250,
    maxHeartRate: 145,
    bloodPressure: 140,
    bloodSugar: 120,
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

    // Use prop patient, local selection, or fallback to mock
    const patient = patientProp ?? selectedLocalPatient ?? null;

    const [simParams, setSimParams] = useState(initialSimParams);
    const [features, setFeatures] = useState(mockFeatures);

    // Calculate simulated confidence based on parameter changes
    const simulatedConfidence = useMemo(() => {
        if (!patient) return 0.5;
        const baseConfidence = patient.confidence ?? 0.5;

        // Simple simulation logic - adjust based on slider changes
        const cholesterolEffect = (initialSimParams.cholesterol - simParams.cholesterol) * 0.001;
        const heartRateEffect = (simParams.maxHeartRate - initialSimParams.maxHeartRate) * 0.0005;
        const bpEffect = (initialSimParams.bloodPressure - simParams.bloodPressure) * 0.0008;
        const sugarEffect = (initialSimParams.bloodSugar - simParams.bloodSugar) * 0.0006;

        const newConfidence = Math.max(0.1, Math.min(0.99,
            baseConfidence + cholesterolEffect + heartRateEffect + bpEffect + sugarEffect
        ));

        return newConfidence;
    }, [simParams, patient]);

    // Determine simulated risk level
    const simulatedRiskLevel = simulatedConfidence > 0.5 ? 'High' : 'Low';

    // Update simulation parameters
    const handleParamChange = useCallback((param, value) => {
        setSimParams(prev => ({ ...prev, [param]: value }));
    }, []);

    // Handle feature click for details
    const handleFeatureClick = useCallback((feature) => {
        console.log('Feature clicked:', feature);
        // Could open a modal with more details
    }, []);

    // Handle patient selection
    const handleSelectPatient = (p) => {
        // Transform to expected format - use actual data from CSV
        setSelectedLocalPatient({
            id: p.id,
            name: p.name,
            age: p.age || 55,
            gender: p.gender === 'Nam' || p.gender === 'male' ? 'Nam' : 'Nữ',
            riskLevel: p.riskLevel === 'high' ? 'High' : p.riskLevel === 'medium' ? 'Medium' : 'Low',
            confidence: p.confidence || (p.healthScore || 70) / 100,
        });
    };

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
                                            <div
                                                className={`px-2 py-1 text-xs font-medium rounded-full
                                                    ${p.riskLevel === 'high'
                                                        ? 'bg-clay/20 text-clay'
                                                        : p.riskLevel === 'medium'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-sage/20 text-sage'
                                                    }
                                                `}
                                            >
                                                {p.riskLevel === 'high' ? 'Cao' : p.riskLevel === 'medium' ? 'TB' : 'Thấp'}
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
                    <motion.div
                        className={`px-6 py-2 font-bold text-sand
                            ${patient.riskLevel === 'High' ? 'bg-clay'
                                : patient.riskLevel === 'Medium' ? 'bg-amber-500'
                                    : 'bg-sage'}
                        `}
                        style={{ borderRadius: '2rem' }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {patient.riskLevel === 'High' ? '⚠️ Rủi Ro Cao'
                            : patient.riskLevel === 'Medium' ? '🔶 Rủi Ro TB'
                                : '✓ Rủi Ro Thấp'}
                    </motion.div>
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
                        value={simulatedConfidence}
                        riskLevel={simulatedRiskLevel}
                        size={220}
                        label="Độ Tin Cậy Dự Đoán"
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
                <div className="flex items-center gap-3 mb-6">
                    <motion.div
                        className="w-10 h-10 bg-sage/20 flex items-center justify-center text-xl"
                        style={{ borderRadius: '50% 50% 30% 70% / 50% 70% 30% 50%' }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        🔬
                    </motion.div>
                    <div>
                        <h2 className="text-xl font-bold text-moss">
                            Mô Phỏng "What-If"
                        </h2>
                        <p className="text-moss/60 text-sm">
                            Điều chỉnh các thông số để xem rủi ro thay đổi theo thời gian thực
                        </p>
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
                        label="Nhịp Tim Tối Đa (bpm)"
                        value={simParams.maxHeartRate}
                        min={60}
                        max={200}
                        step={1}
                        unit=""
                        color="sage"
                        onChange={(v) => handleParamChange('maxHeartRate', v)}
                    />
                    <WhatIfSlider
                        label="Huyết Áp Tâm Thu (mmHg)"
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
                </div>

                {/* Simulation Result */}
                <motion.div
                    className="mt-8 p-4 glass text-center"
                    style={{ borderRadius: '2rem' }}
                    key={simulatedConfidence.toFixed(2)}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                >
                    <span className="text-moss/70 text-sm">Rủi Ro Mô Phỏng: </span>
                    <span className={`font-bold text-lg ${simulatedRiskLevel === 'High' ? 'text-clay' : 'text-sage'}`}>
                        {(simulatedConfidence * 100).toFixed(1)}%
                    </span>
                    {simulatedConfidence !== patient.confidence && (
                        <span className="ml-2 text-sm">
                            {simulatedConfidence < patient.confidence ? (
                                <span className="text-sage">↓ Giảm {((patient.confidence - simulatedConfidence) * 100).toFixed(1)}%</span>
                            ) : (
                                <span className="text-clay">↑ Tăng {((simulatedConfidence - patient.confidence) * 100).toFixed(1)}%</span>
                            )}
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
                            d="M0,80 Q50,70 100,60 T200,45 T300,55 T400,40 L400,100 L0,100 Z"
                            fill="url(#trend-gradient)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        />
                        {/* Line */}
                        <motion.path
                            d="M0,80 Q50,70 100,60 T200,45 T300,55 T400,40"
                            fill="none"
                            stroke="#D57E5F"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
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
