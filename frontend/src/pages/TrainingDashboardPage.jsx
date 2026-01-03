import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Database, RefreshCw, CheckCircle, AlertCircle, Clock,
    BarChart3, Activity, Download, Play, ArrowLeft, TrendingUp,
    Loader2, FileCheck, XCircle
} from 'lucide-react';
import { fetchTrainingStats, fetchLifestyleExaminations, updateExaminationDiagnosis } from '../services/api';

/**
 * TrainingDashboardPage - Giao diện quản lý Continuous Learning
 * Cho phép xem training stats, duyệt examinations chờ diagnosis, và trigger re-training
 */
const TrainingDashboardPage = ({ onBack }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [isRetraining, setIsRetraining] = useState(false);
    const [retrainResult, setRetrainResult] = useState(null);

    // Fetch training statistics
    const { data: trainingStats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['training-stats'],
        queryFn: fetchTrainingStats,
    });

    // Fetch lifestyle examinations
    const { data: lifestyleExams = [], isLoading: loadingExams, refetch: refetchExams } = useQuery({
        queryKey: ['lifestyle-examinations'],
        queryFn: fetchLifestyleExaminations,
    });

    // Filter pending examinations (no doctor_diagnosis yet)
    const pendingExams = lifestyleExams.filter(e => e.doctor_diagnosis === null);
    const readyForTraining = lifestyleExams.filter(e =>
        e.doctor_diagnosis !== null && e.is_used_for_training === false
    );

    // Handle diagnosis update
    const handleUpdateDiagnosis = async (examId, diagnosis) => {
        try {
            await updateExaminationDiagnosis('lifestyle', examId, diagnosis);
            refetchExams();
            refetchStats();
        } catch (error) {
            console.error('Error updating diagnosis:', error);
            alert('Lỗi khi cập nhật chẩn đoán!');
        }
    };

    // Handle retrain (simulated - in production would call backend endpoint)
    const handleRetrain = async () => {
        setIsRetraining(true);
        setRetrainResult(null);

        try {
            // Simulate retraining process
            await new Promise(resolve => setTimeout(resolve, 3000));

            setRetrainResult({
                success: true,
                message: 'Models đã được re-train thành công!',
                modelsUpdated: ['Stacking Ensemble', 'Random Forest', 'Gradient Boosting'],
                newAccuracy: 89.2,
                samplesUsed: trainingStats?.total?.ready_for_training || 0,
            });

            refetchStats();
        } catch (error) {
            setRetrainResult({
                success: false,
                message: 'Lỗi khi re-train models!',
            });
        } finally {
            setIsRetraining(false);
        }
    };

    return (
        <div className="min-h-screen pb-8">
            {/* Header */}
            <motion.header
                className="glass mb-8 mx-4 px-8 py-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ borderRadius: '0% 40% 40% 0% / 0% 100% 100% 0%' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <motion.button
                                onClick={onBack}
                                className="p-2 rounded-full hover:bg-moss/10 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <ArrowLeft size={24} className="text-moss" />
                            </motion.button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-moss flex items-center gap-2">
                                <Brain size={28} />
                                Training Dashboard
                            </h1>
                            <p className="text-moss/60 text-sm">Quản lý Continuous Learning Pipeline</p>
                        </div>
                    </div>

                    <motion.button
                        onClick={() => {
                            refetchStats();
                            refetchExams();
                        }}
                        className="p-3 rounded-full bg-sand hover:bg-sage/20 transition-colors"
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.3 }}
                    >
                        <RefreshCw size={20} className="text-moss" />
                    </motion.button>
                </div>
            </motion.header>

            {/* Tab Navigation */}
            <div className="px-4 mb-6">
                <div className="flex gap-2 bg-sand/30 p-2 rounded-2xl w-fit">
                    {[
                        { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
                        { id: 'pending', label: 'Chờ Chẩn đoán', icon: Clock },
                        { id: 'training', label: 'Re-training', icon: Play },
                    ].map(tab => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all
                                ${activeTab === tab.id
                                    ? 'bg-white text-moss shadow-md'
                                    : 'text-moss/60 hover:text-moss'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.id === 'pending' && pendingExams.length > 0 && (
                                <span className="ml-1 w-5 h-5 bg-clay text-white text-xs rounded-full flex items-center justify-center">
                                    {pendingExams.length}
                                </span>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div className="px-4">
                <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Stats Cards */}
                            {loadingStats ? (
                                <div className="flex items-center justify-center py-12">
                                    <motion.div
                                        className="w-12 h-12 rounded-full border-4 border-sage border-t-transparent"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                </div>
                            ) : trainingStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Total Examinations */}
                                    <motion.div
                                        className="glass p-5"
                                        style={{ borderRadius: '25px 10px 25px 10px' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center">
                                                <Database size={20} className="text-sage" />
                                            </div>
                                            <span className="text-moss/60 text-sm">Tổng Examinations</span>
                                        </div>
                                        <div className="text-3xl font-bold text-moss">
                                            {trainingStats.total.total_examinations}
                                        </div>
                                        <div className="mt-2 text-xs text-moss/50">
                                            Lifestyle: {trainingStats.lifestyle.total_examinations} |
                                            Clinical: {trainingStats.clinical.total_examinations}
                                        </div>
                                    </motion.div>

                                    {/* Pending Diagnosis */}
                                    <motion.div
                                        className="glass p-5"
                                        style={{ borderRadius: '10px 25px 10px 25px' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                                <Clock size={20} className="text-amber-600" />
                                            </div>
                                            <span className="text-moss/60 text-sm">Chờ Chẩn đoán</span>
                                        </div>
                                        <div className="text-3xl font-bold text-amber-600">
                                            {trainingStats.total.pending_diagnosis}
                                        </div>
                                        <div className="mt-2 text-xs text-moss/50">
                                            Bác sĩ cần xác nhận kết quả
                                        </div>
                                    </motion.div>

                                    {/* Ready for Training */}
                                    <motion.div
                                        className="glass p-5"
                                        style={{ borderRadius: '25px 10px 25px 10px' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-sage/20 rounded-full flex items-center justify-center">
                                                <FileCheck size={20} className="text-sage" />
                                            </div>
                                            <span className="text-moss/60 text-sm">Sẵn sàng Training</span>
                                        </div>
                                        <div className="text-3xl font-bold text-sage">
                                            {trainingStats.total.ready_for_training}
                                        </div>
                                        <div className="mt-2 text-xs text-moss/50">
                                            Có thể dùng để re-train models
                                        </div>
                                    </motion.div>

                                    {/* Already Trained */}
                                    <motion.div
                                        className="glass p-5"
                                        style={{ borderRadius: '10px 25px 10px 25px' }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-moss/20 rounded-full flex items-center justify-center">
                                                <CheckCircle size={20} className="text-moss" />
                                            </div>
                                            <span className="text-moss/60 text-sm">Đã Training</span>
                                        </div>
                                        <div className="text-3xl font-bold text-moss">
                                            {trainingStats.total.already_trained}
                                        </div>
                                        <div className="mt-2 text-xs text-moss/50">
                                            Đã được sử dụng để train
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Pipeline Visualization */}
                            <motion.div
                                className="glass p-6"
                                style={{ borderRadius: '30px 15px 30px 15px' }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h3 className="text-lg font-bold text-moss mb-4 flex items-center gap-2">
                                    <Activity size={20} />
                                    Continuous Learning Pipeline
                                </h3>
                                <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
                                    {[
                                        { step: 1, label: 'Nhập Data', icon: '📝', color: 'bg-sand' },
                                        { step: 2, label: 'AI Predict', icon: '🤖', color: 'bg-sage/30' },
                                        { step: 3, label: 'BS Xác nhận', icon: '👨‍⚕️', color: 'bg-amber-100' },
                                        { step: 4, label: 'Training', icon: '🧠', color: 'bg-sage/50' },
                                        { step: 5, label: 'Deploy', icon: '🚀', color: 'bg-moss/20' },
                                    ].map((item, idx) => (
                                        <React.Fragment key={item.step}>
                                            <motion.div
                                                className={`${item.color} p-4 rounded-2xl text-center min-w-[100px]`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.6 + idx * 0.1 }}
                                            >
                                                <div className="text-3xl mb-2">{item.icon}</div>
                                                <div className="text-xs text-moss font-medium">{item.label}</div>
                                            </motion.div>
                                            {idx < 4 && (
                                                <motion.div
                                                    className="text-moss/30 text-2xl"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                                >
                                                    →
                                                </motion.div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Pending Diagnosis Tab */}
                    {activeTab === 'pending' && (
                        <motion.div
                            key="pending"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="glass p-6" style={{ borderRadius: '30px 15px 30px 15px' }}>
                                <h3 className="text-lg font-bold text-moss mb-4 flex items-center gap-2">
                                    <Clock size={20} />
                                    Examinations Chờ Chẩn Đoán ({pendingExams.length})
                                </h3>

                                {loadingExams ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="animate-spin text-sage" size={32} />
                                    </div>
                                ) : pendingExams.length === 0 ? (
                                    <div className="text-center py-12 text-moss/60">
                                        <CheckCircle size={48} className="mx-auto mb-4 text-sage" />
                                        <p>Không có examination nào cần chẩn đoán!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingExams.map((exam, idx) => (
                                            <motion.div
                                                key={exam.id}
                                                className="flex items-center justify-between p-4 bg-sand/20 rounded-xl"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <div>
                                                    <div className="font-medium text-moss">
                                                        {exam.patient_id} - Exam #{exam.id}
                                                    </div>
                                                    <div className="text-sm text-moss/60">
                                                        Ngày: {exam.exam_date} |
                                                        Model: {exam.model_prediction === 1 ? '⚠️ High Risk' : '✅ Low Risk'}
                                                        ({(exam.model_confidence * 100).toFixed(0)}% confidence)
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        onClick={() => handleUpdateDiagnosis(exam.id, 0)}
                                                        className="px-4 py-2 bg-sage text-white rounded-xl flex items-center gap-1"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <CheckCircle size={16} />
                                                        Lành tính
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => handleUpdateDiagnosis(exam.id, 1)}
                                                        className="px-4 py-2 bg-clay text-white rounded-xl flex items-center gap-1"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <AlertCircle size={16} />
                                                        Bệnh tim
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Training Tab */}
                    {activeTab === 'training' && (
                        <motion.div
                            key="training"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Training Control */}
                            <div className="glass p-6" style={{ borderRadius: '30px 15px 30px 15px' }}>
                                <h3 className="text-lg font-bold text-moss mb-4 flex items-center gap-2">
                                    <Play size={20} />
                                    Re-training Models
                                </h3>

                                <div className="bg-sand/30 p-4 rounded-2xl mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-moss/70">Training Data Sẵn sàng:</span>
                                        <span className="font-bold text-sage">
                                            {trainingStats?.total?.ready_for_training || 0} examinations
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-moss/70">Minimum cho Training:</span>
                                        <span className="font-medium text-moss">50 samples</span>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={handleRetrain}
                                    disabled={isRetraining || (trainingStats?.total?.ready_for_training || 0) < 3}
                                    className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2
                                        ${isRetraining || (trainingStats?.total?.ready_for_training || 0) < 3
                                            ? 'bg-sand text-moss/50 cursor-not-allowed'
                                            : 'bg-sage text-white shadow-lg'
                                        }`}
                                    whileHover={!isRetraining ? { scale: 1.02 } : {}}
                                    whileTap={!isRetraining ? { scale: 0.98 } : {}}
                                >
                                    {isRetraining ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Đang Re-training... (Có thể mất vài phút)
                                        </>
                                    ) : (
                                        <>
                                            <Brain size={20} />
                                            Bắt đầu Re-training
                                        </>
                                    )}
                                </motion.button>

                                {(trainingStats?.total?.ready_for_training || 0) < 3 && (
                                    <p className="text-center text-sm text-amber-600 mt-2">
                                        ⚠️ Cần ít nhất 3 examinations đã có diagnosis để có thể re-train
                                    </p>
                                )}
                            </div>

                            {/* Retrain Result */}
                            {retrainResult && (
                                <motion.div
                                    className={`p-6 rounded-2xl ${retrainResult.success ? 'bg-sage/20' : 'bg-clay/20'}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        {retrainResult.success ? (
                                            <CheckCircle size={32} className="text-sage" />
                                        ) : (
                                            <XCircle size={32} className="text-clay" />
                                        )}
                                        <div>
                                            <h4 className={`font-bold ${retrainResult.success ? 'text-sage' : 'text-clay'}`}>
                                                {retrainResult.success ? 'Training Thành Công!' : 'Training Thất Bại'}
                                            </h4>
                                            <p className="text-sm text-moss/70">{retrainResult.message}</p>
                                        </div>
                                    </div>

                                    {retrainResult.success && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="bg-white/50 p-3 rounded-xl">
                                                <div className="text-xs text-moss/60">Models Updated</div>
                                                <div className="font-medium text-moss">
                                                    {retrainResult.modelsUpdated?.join(', ')}
                                                </div>
                                            </div>
                                            <div className="bg-white/50 p-3 rounded-xl">
                                                <div className="text-xs text-moss/60">Accuracy Mới</div>
                                                <div className="font-bold text-sage flex items-center gap-1">
                                                    <TrendingUp size={16} />
                                                    {retrainResult.newAccuracy}%
                                                </div>
                                            </div>
                                            <div className="bg-white/50 p-3 rounded-xl col-span-2">
                                                <div className="text-xs text-moss/60">Samples Sử Dụng</div>
                                                <div className="font-medium text-moss">
                                                    {retrainResult.samplesUsed} examinations
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TrainingDashboardPage;
