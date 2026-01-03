import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Phone, MapPin, Droplets, Heart, Activity, Brain, Loader2,
    CheckCircle, AlertTriangle, BarChart3, HeartPulse,
    ChevronRight, Info
} from 'lucide-react';
import { compareAllModels } from '../services/api';

/**
 * AddPatientWithAIModal - Form thêm bệnh nhân với AI đánh giá rủi ro tự động
 * Đánh giá dựa trên 10 lifestyle features từ cardio_train.csv
 * Features: [gender, cholesterol, gluc, smoke, alco, active, age_bin, BMI_Class, MAP_Class, cluster]
 */
const AddPatientWithAIModal = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1); // 1: Personal Info, 2: Lifestyle Metrics, 3: Results
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    // Personal info
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Nam',
        phone: '',
        address: '',
        blood_type: 'O+',
    });

    // Lifestyle health metrics (cardio_train.csv features - 10 features)
    const [lifestyleMetrics, setLifestyleMetrics] = useState({
        cholesterol: 1,      // 1: Normal, 2: Above Normal, 3: High
        glucose: 1,          // 1: Normal, 2: Above Normal, 3: High
        smoking: 0,          // 0: No, 1: Yes
        alcohol: 0,          // 0: No, 1: Yes
        active: 1,           // 0: No, 1: Yes
        bmi_class: 1,        // 0: Underweight, 1: Normal, 2: Overweight, 3: Obese
        blood_pressure: 1,   // 0: Low, 1: Normal, 2: High, 3: Very High  
        cluster: 0,          // Cluster from K-Means (0-4, estimated based on other features)
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' ? parseInt(value) || '' : value
        }));
    };

    const handleLifestyleChange = (e) => {
        const { name, value } = e.target;
        setLifestyleMetrics(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    // Calculate age_bin from age
    const getAgeBin = (age) => {
        if (age < 35) return 0;
        if (age < 45) return 1;
        if (age < 55) return 2;
        if (age < 65) return 3;
        return 4;
    };

    // Calculate simple cluster estimation (0-4) based on risk factors
    const estimateCluster = (metrics, age) => {
        let riskScore = 0;

        // Higher cholesterol, glucose, BMI, blood pressure = higher risk cluster
        if (metrics.cholesterol >= 2) riskScore += 1;
        if (metrics.glucose >= 2) riskScore += 1;
        if (metrics.bmi_class >= 2) riskScore += 1;
        if (metrics.blood_pressure >= 2) riskScore += 1;
        if (metrics.smoking === 1) riskScore += 1;
        if (metrics.alcohol === 1) riskScore += 0.5;
        if (metrics.active === 0) riskScore += 0.5;
        if (age >= 55) riskScore += 1;

        // Map risk score to cluster (0-4)
        if (riskScore >= 5) return 4; // High risk cluster
        if (riskScore >= 3.5) return 3;
        if (riskScore >= 2) return 2;
        if (riskScore >= 1) return 1;
        return 0; // Low risk cluster
    };

    // Evaluate Lifestyle Risk
    const handleEvaluate = async () => {
        setLoading(true);
        try {
            const age = parseInt(formData.age);
            const cluster = estimateCluster(lifestyleMetrics, age);

            // Feature order must match backend: [gender, cholesterol, gluc, smoke, alco, active, age_bin, BMI_Class, MAP_Class, cluster]
            const patientData = {
                gender: formData.gender === 'Nam' ? 1 : 0,
                cholesterol: lifestyleMetrics.cholesterol,
                gluc: lifestyleMetrics.glucose,
                smoke: lifestyleMetrics.smoking,
                alco: lifestyleMetrics.alcohol,
                active: lifestyleMetrics.active,
                age_bin: getAgeBin(age),
                BMI_Class: lifestyleMetrics.bmi_class,
                MAP_Class: lifestyleMetrics.blood_pressure,
                cluster: cluster,
            };

            const result = await compareAllModels(patientData);
            setResults(result);
            setStep(3);
        } catch (error) {
            console.error('Evaluation error:', error);
            alert('Lỗi khi đánh giá. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    // Submit patient with best result
    const handleSubmitPatient = async () => {
        setLoading(true);
        try {
            const patientToSave = {
                ...formData,
                riskLevel: results.best_model.risk_level.toLowerCase(),
                healthScore: Math.round((1 - results.best_model.risk_score) * 100),
                confidence: results.best_model.confidence,
                risk_score: results.best_model.risk_score, // Add this for consistency with DiagnosticsPage
            };
            await onSubmit(patientToSave);
            handleClose();
        } catch (error) {
            alert('Lỗi khi lưu bệnh nhân!');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setResults(null);
        setFormData({ name: '', age: '', gender: 'Nam', phone: '', address: '', blood_type: 'O+' });
        setLifestyleMetrics({ cholesterol: 1, glucose: 1, smoking: 0, alcohol: 0, active: 1, bmi_class: 1, blood_pressure: 1, cluster: 0 });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="bg-white/95 backdrop-blur-md w-full max-w-3xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    style={{ borderRadius: '30px' }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-sage/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-moss flex items-center gap-2">
                            {step === 1 && <><User size={24} /> Thông Tin Bệnh Nhân</>}
                            {step === 2 && <><HeartPulse size={24} /> Chỉ Số Lối Sống</>}
                            {step === 3 && <><Brain size={24} /> Kết Quả Đánh Giá AI</>}
                        </h2>
                        <div className="flex items-center gap-4">
                            {/* Step Indicator */}
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map(s => (
                                    <div
                                        key={s}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                            ${s === step ? 'bg-sage text-white' : s < step ? 'bg-sage/50 text-white' : 'bg-sand text-moss/50'}`}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition-colors"
                            >
                                <X size={20} className="text-moss" />
                            </button>
                        </div>
                    </div>

                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">Họ và Tên *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                                        placeholder="Nguyễn Văn A"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">Tuổi *</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        min="1"
                                        max="120"
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                                        placeholder="50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">Giới tính</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none"
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                        <Droplets size={14} /> Nhóm máu
                                    </label>
                                    <select
                                        name="blood_type"
                                        value={formData.blood_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none"
                                    >
                                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bt => (
                                            <option key={bt} value={bt}>{bt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <Phone size={14} /> Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none"
                                    placeholder="0901234567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <MapPin size={14} /> Địa chỉ
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none"
                                    placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                                />
                            </div>

                            <motion.button
                                onClick={() => {
                                    if (!formData.name || !formData.age) {
                                        alert('Vui lòng nhập tên và tuổi!');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="w-full py-4 bg-sage text-white font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Tiếp Tục <ChevronRight size={20} />
                            </motion.button>
                        </div>
                    )}

                    {/* Step 2: Lifestyle Metrics */}
                    {step === 2 && (
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-sm text-moss/60 mb-2 bg-sage/10 p-3 rounded-xl">
                                <Info size={16} />
                                Nhập các chỉ số lối sống để đánh giá rủi ro tim mạch (10 features)
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🏋️ Chỉ số BMI</label>
                                    <select name="bmi_class" value={lifestyleMetrics.bmi_class} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={0}>Thiếu cân (BMI &lt; 18.5)</option>
                                        <option value={1}>Bình thường (18.5-25)</option>
                                        <option value={2}>Thừa cân (25-30)</option>
                                        <option value={3}>Béo phì (&gt; 30)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">💉 Huyết áp</label>
                                    <select name="blood_pressure" value={lifestyleMetrics.blood_pressure} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={0}>Thấp (&lt; 90/60)</option>
                                        <option value={1}>Bình thường (90-120/60-80)</option>
                                        <option value={2}>Cao (120-140/80-90)</option>
                                        <option value={3}>Rất cao (&gt; 140/90)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🧪 Cholesterol</label>
                                    <select name="cholesterol" value={lifestyleMetrics.cholesterol} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={1}>Bình thường (&lt; 200 mg/dL)</option>
                                        <option value={2}>Cao hơn bình thường (200-239)</option>
                                        <option value={3}>Cao (&gt; 240 mg/dL)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🍬 Đường huyết</label>
                                    <select name="glucose" value={lifestyleMetrics.glucose} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={1}>Bình thường (&lt; 100 mg/dL)</option>
                                        <option value={2}>Cao hơn bình thường (100-125)</option>
                                        <option value={3}>Cao (&gt; 126 - Tiểu đường)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🚬 Hút thuốc</label>
                                    <select name="smoking" value={lifestyleMetrics.smoking} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={0}>Không hút</option>
                                        <option value={1}>Có hút</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🍺 Uống rượu</label>
                                    <select name="alcohol" value={lifestyleMetrics.alcohol} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={0}>Không uống</option>
                                        <option value={1}>Có uống</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-moss/80 mb-1">🏃 Vận động thường xuyên</label>
                                    <select name="active" value={lifestyleMetrics.active} onChange={handleLifestyleChange}
                                        className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage outline-none">
                                        <option value={0}>Không (&lt; 30 phút/tuần)</option>
                                        <option value={1}>Có (&gt; 30 phút/tuần)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 bg-sage/10 rounded-xl text-xs text-moss/70 leading-relaxed">
                                <strong>💡 Lưu ý:</strong> Cluster sẽ được tính tự động dựa trên các chỉ số trên (K-Means clustering từ training data)
                            </div>

                            <div className="flex gap-3 pt-4">
                                <motion.button onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-sand text-moss font-semibold rounded-2xl"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    ← Quay Lại
                                </motion.button>
                                <motion.button onClick={handleEvaluate} disabled={loading}
                                    className="flex-1 py-4 bg-sage text-white font-semibold rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? <><Loader2 className="animate-spin" size={20} /> Đang Đánh Giá...</> : <><Brain size={20} /> AI Đánh Giá (9 Models)</>}
                                </motion.button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results */}
                    {step === 3 && results && (
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Assessment Type Badge */}
                            <div className="text-center py-2 rounded-full text-sm font-medium bg-sage/20 text-sage">
                                🏃 Đánh Giá Lối Sống ({results.all_models.length} Models)
                            </div>

                            {/* Best Model Result */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`p-6 rounded-3xl text-center ${results.best_model.risk_level === 'High' ? 'bg-clay/20' : 'bg-sage/20'}`}
                            >
                                <div className="text-5xl mb-4">
                                    {results.best_model.risk_level === 'High' ? '⚠️' : '✅'}
                                </div>
                                <h3 className={`text-2xl font-bold mb-2 ${results.best_model.risk_level === 'High' ? 'text-clay' : 'text-sage'}`}>
                                    Kết luận: Nguy cơ {results.best_model.risk_level === 'High' ? 'CAO' : 'THẤP'}
                                </h3>
                                <p className="text-moss/70 text-lg">Tỷ lệ mắc bệnh: <strong>{(results.best_model.risk_score * 100).toFixed(2)}%</strong></p>
                                <p className="text-moss/60 text-sm">Độ tin cậy của mô hình: <strong>{(results.best_model.confidence * 100).toFixed(2)}%</strong></p>
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full">
                                    <CheckCircle size={14} className="text-sage" />
                                    <span className="text-sm text-moss/70">Best: <strong>{results.best_model.model_name}</strong></span>
                                </div>
                            </motion.div>

                            {/* Consensus */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                className="bg-moss/5 p-4 rounded-2xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 size={18} className="text-moss" />
                                    <h4 className="font-bold text-moss">Đồng thuận Models</h4>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-clay">{results.consensus.high_risk_count}</div>
                                        <div className="text-xs text-moss/60">Nguy cơ cao</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-sage">{results.consensus.low_risk_count}</div>
                                        <div className="text-xs text-moss/60">Nguy cơ thấp</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-moss">{results.consensus.total_models}</div>
                                        <div className="text-xs text-moss/60">Tổng models</div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* All Models Detail */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="bg-sand/20 p-4 rounded-2xl">
                                <h4 className="font-bold text-moss mb-4 flex items-center gap-2">
                                    <Brain size={16} />
                                    Chi tiết kết quả từng Model
                                </h4>
                                <div className="space-y-3">
                                    {results.all_models.sort((a, b) => b.confidence - a.confidence).map((model, idx) => (
                                        <motion.div key={model.model_key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}
                                            className={`p-4 rounded-xl ${model.model_key === results.best_model.model_key ? 'bg-sage/20 border-2 border-sage shadow-md' : 'bg-white/60 border border-transparent'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {model.model_key === results.best_model.model_key && <CheckCircle size={18} className="text-sage" />}
                                                    <div>
                                                        <div className="font-bold text-moss flex items-center gap-2">
                                                            {model.model_name}
                                                            {model.model_key === results.best_model.model_key && (
                                                                <span className="text-xs bg-sage text-white px-2 py-0.5 rounded-full animate-pulse">⭐ BEST</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-moss/50">
                                                            {model.type === 'ensemble' ? '🧩 Ensemble' : model.type === 'deep_learning' ? '🧠 Deep Learning' : '📊 Traditional ML'}
                                                            {' • '}Accuracy: {model.accuracy}%
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full font-bold text-sm ${model.risk_level === 'High' ? 'bg-clay/20 text-clay' : 'bg-sage/20 text-sage'}`}>
                                                    {model.risk_level === 'High' ? '⚠️ Nguy cơ CAO' : '✅ Nguy cơ THẤP'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="flex justify-between text-xs text-moss/70 mb-1">
                                                        <span>Tỷ lệ mắc bệnh</span>
                                                        <span className={`font-bold ${model.risk_level === 'High' ? 'text-clay' : 'text-sage'}`}>{(model.risk_score * 100).toFixed(2)}%</span>
                                                    </div>
                                                    <div className="h-3 bg-sand/50 rounded-full overflow-hidden">
                                                        <motion.div className={`h-full rounded-full ${model.risk_score > 0.7 ? 'bg-clay' : model.risk_score > 0.5 ? 'bg-amber-500' : 'bg-sage'}`}
                                                            initial={{ width: 0 }} animate={{ width: `${model.risk_score * 100}%` }} transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs text-moss/70 mb-1">
                                                        <span>Độ Tin Cậy</span>
                                                        <span className="font-bold text-moss">{(model.confidence * 100).toFixed(2)}%</span>
                                                    </div>
                                                    <div className="h-3 bg-sand/50 rounded-full overflow-hidden">
                                                        <motion.div className={`h-full rounded-full ${model.confidence > 0.9 ? 'bg-moss' : model.confidence > 0.7 ? 'bg-sage' : 'bg-moss/50'}`}
                                                            initial={{ width: 0 }} animate={{ width: `${model.confidence * 100}%` }} transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Patient Summary */}
                            <div className="bg-sand/30 p-4 rounded-2xl">
                                <h4 className="font-bold text-moss mb-2">Thông tin bệnh nhân:</h4>
                                <p className="text-moss/70"><strong>{formData.name}</strong> - {formData.age} tuổi - {formData.gender}</p>
                                <p className="text-sm text-moss/50">Điểm sức khỏe: {Math.round((1 - results.best_model.risk_score) * 100)}</p>
                            </div>

                            <div className="flex gap-3">
                                <motion.button onClick={() => setStep(2)}
                                    className="flex-1 py-4 bg-sand text-moss font-semibold rounded-2xl"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    ← Đánh Giá Lại
                                </motion.button>
                                <motion.button onClick={handleSubmitPatient} disabled={loading}
                                    className="flex-1 py-4 bg-sage text-white font-semibold rounded-2xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    {loading ? <><Loader2 className="animate-spin" size={20} /> Đang Lưu...</> : <><Heart size={20} /> Lưu Bệnh Nhân</>}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddPatientWithAIModal;
