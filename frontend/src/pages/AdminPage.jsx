import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCw, Download, Server, Loader2, ChevronDown, Brain, Cpu, BarChart3 } from 'lucide-react';
import MetricStoneCard from '../components/MetricStoneCard';
import OrganicROCChart from '../components/OrganicROCChart';
import ConfusionBlobs from '../components/ConfusionBlobs';
import DataDriftWave from '../components/DataDriftWave';
import {
    PrecisionRecallCurve,
    FeatureImportanceChart,
    ModelComparisonRadar,
    TrainingHistoryChart,
    ClassificationReport,
    ModelPerformanceBars,
} from '../components/AdvancedCharts';
import {
    fetchModelMetrics,
    fetchModelsStatus,
    fetchConfusionMatrix,
    fetchSystemStats,
    fetchROCCurve
} from '../services/api';

// Generate sparkline data for each metric (deterministic)
const generateSparklineData = (baseValue, variance = 5, seed = 0) => {
    return Array.from({ length: 20 }, (_, i) => ({
        value: baseValue + Math.sin(i * 0.8 + seed) * variance,
    }));
};

const AdminPage = () => {
    const [selectedModelKey, setSelectedModelKey] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    // API Data States
    const [metrics, setMetrics] = useState({ accuracy: 0, precision: 0, recall: 0, f1Score: 0, auc: 0 });
    const [models, setModels] = useState([]);
    const [confusion, setConfusion] = useState({ trueNegative: 0, falsePositive: 0, falseNegative: 0, truePositive: 0 });
    const [stats, setStats] = useState({ totalPredictions: 0, uptime: 0, avgResponseTime: 0 });
    const [rocData, setRocData] = useState(null);
    const [rocLoading, setRocLoading] = useState(false);

    // Get selected model info
    const selectedModel = useMemo(() => {
        if (!selectedModelKey) return null;
        return models.find(m => m.key === selectedModelKey);
    }, [selectedModelKey, models]);

    // Memoize sparkline data to prevent regeneration on every render
    const sparklineData = useMemo(() => ({
        accuracy: generateSparklineData(metrics.accuracy || 88, 5, 0),
        precision: generateSparklineData(metrics.precision || 86, 5, 1),
        recall: generateSparklineData(metrics.recall || 85, 5, 2),
        f1Score: generateSparklineData(metrics.f1Score || 85.5, 5, 3),
    }), [metrics]);

    // Load all models on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load metrics for selected model
    useEffect(() => {
        if (selectedModelKey) {
            loadModelData(selectedModelKey);
        }
    }, [selectedModelKey]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [modelsData, statsData] = await Promise.all([
                fetchModelsStatus(),
                fetchSystemStats()
            ]);
            setModels(modelsData);
            setStats(statsData);

            // Select first model by default
            if (modelsData.length > 0) {
                setSelectedModelKey(modelsData[0].key);
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadModelData = async (modelKey) => {
        try {
            setRocLoading(true);
            const [metricsData, confusionData, rocCurveData] = await Promise.all([
                fetchModelMetrics(modelKey),
                fetchConfusionMatrix(modelKey),
                fetchROCCurve(modelKey)
            ]);
            setMetrics(metricsData);
            setConfusion(confusionData);
            setRocData(rocCurveData);
        } catch (err) {
            console.error('Error loading model data:', err);
        } finally {
            setRocLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadInitialData();
        if (selectedModelKey) {
            await loadModelData(selectedModelKey);
        }
        setIsRefreshing(false);
    };

    const handleSelectModel = (modelKey) => {
        setSelectedModelKey(modelKey);
        setShowModelDropdown(false);
    };

    return (
        <div className="max-w-7xl mx-auto pb-8">
            {/* Header */}
            <motion.header
                className="flex items-center justify-between mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center"
                        animate={{
                            boxShadow: [
                                '0 0 0 0 rgba(135, 152, 106, 0)',
                                '0 0 20px 5px rgba(135, 152, 106, 0.3)',
                                '0 0 0 0 rgba(135, 152, 106, 0)',
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Activity size={28} className="text-sage" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold text-moss flex items-center gap-3">
                            AI Model Dashboard
                            <motion.span
                                className="flex items-center gap-1.5 px-3 py-1 bg-sage/20 rounded-full text-sm font-medium text-sage"
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <motion.span
                                    className="w-2 h-2 rounded-full bg-sage"
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {models.length} Models Active
                            </motion.span>
                        </h1>
                        <p className="text-moss/60 text-sm mt-1">
                            Chọn model để xem chi tiết hiệu suất và các chỉ số
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <motion.button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-shadow"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div
                            animate={{ rotate: isRefreshing ? 360 : 0 }}
                            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
                        >
                            <RefreshCw size={16} className="text-moss" />
                        </motion.div>
                        <span className="text-sm text-moss">Refresh</span>
                    </motion.button>
                </div>
            </motion.header>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-sage" />
                    <span className="ml-3 text-moss/60">Đang tải dữ liệu...</span>
                </div>
            ) : (
                <>
                    {/* Model Selector */}
                    <motion.div
                        className="mb-8 p-6 bg-white/40 backdrop-blur-sm shadow-md relative z-[100]"
                        style={{ borderRadius: '25px', overflow: 'visible' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Server size={20} className="text-moss/60" />
                                <span className="font-bold text-moss">Chọn Model</span>
                            </div>

                            {/* Dropdown Selector */}
                            <div className="relative z-50">
                                <motion.button
                                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                                    className="flex items-center gap-3 px-5 py-3 bg-sage text-white rounded-full shadow-md min-w-[280px] justify-between"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <span className="flex items-center gap-2">
                                        <Brain size={18} />
                                        {selectedModel?.name || 'Chọn model...'}
                                    </span>
                                    <ChevronDown size={18} className={`transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                                </motion.button>

                                <AnimatePresence>
                                    {showModelDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full right-0 mt-2 w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden"
                                            style={{ zIndex: 9999 }}
                                        >
                                            {/* All Models */}
                                            <div className="p-3">
                                                <p className="text-xs font-bold text-moss/50 mb-2 px-2">MODELS ({models.length})</p>
                                                {models.map(model => (
                                                    <motion.button
                                                        key={model.key}
                                                        onClick={() => handleSelectModel(model.key)}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors
                                                            ${selectedModelKey === model.key ? 'bg-sage/20 text-sage' : 'hover:bg-sand/50 text-moss'}
                                                        `}
                                                        whileHover={{ x: 4 }}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Cpu size={16} />
                                                            {model.name}
                                                        </span>
                                                        <span className="text-sm font-bold">{model.accuracy}%</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Model Quick Stats Bar */}
                        {selectedModel && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center gap-6 pt-4 border-t border-sand/50"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-moss/60">Status:</span>
                                    <span className="flex items-center gap-1 text-xs text-sage font-medium">
                                        <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                                        {selectedModel.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-moss/60">AUC:</span>
                                    <span className="text-xs font-bold text-moss">{selectedModel.auc}</span>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>


                    {/* Metric Stone Cards */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <MetricStoneCard
                            title="Accuracy"
                            value={metrics.accuracy}
                            unit="%"
                            color="sage"
                            index={0}
                            sparklineData={sparklineData.accuracy}
                        />
                        <MetricStoneCard
                            title="Precision"
                            value={metrics.precision}
                            unit="%"
                            color="moss"
                            index={1}
                            sparklineData={sparklineData.precision}
                        />
                        <MetricStoneCard
                            title="Recall"
                            value={metrics.recall}
                            unit="%"
                            color="clay"
                            index={2}
                            sparklineData={sparklineData.recall}
                        />
                        <MetricStoneCard
                            title="F1-Score"
                            value={metrics.f1Score}
                            unit="%"
                            color="sage"
                            index={3}
                            sparklineData={sparklineData.f1Score}
                        />
                    </motion.div>

                    {/* Charts Row 1 - ROC & Confusion */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* ROC Chart */}
                        <OrganicROCChart 
                            data={rocData?.data} 
                            auc={rocData?.auc || metrics.auc || selectedModel?.auc} 
                            isLoading={rocLoading}
                        />

                        {/* Confusion Matrix */}
                        <ConfusionBlobs {...confusion} />
                    </div>

                    {/* Charts Row 2 - PR Curve & Feature Importance */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <PrecisionRecallCurve
                            precision={metrics.precision / 100}
                            recall={metrics.recall / 100}
                        />
                        <FeatureImportanceChart
                            modelType={selectedModel?.type || 'lifestyle'}
                        />
                    </div>

                    {/* Charts Row 3 - Training History & Classification Report */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <TrainingHistoryChart />
                        <ClassificationReport metrics={metrics} />
                    </div>

                    {/* Charts Row 4 - Model Comparison & All Models */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <ModelComparisonRadar models={models} />
                        <ModelPerformanceBars models={models} selectedKey={selectedModelKey} />
                    </div>

                    {/* Data Drift Wave */}
                    <DataDriftWave driftLevel="healthy" driftScore={0.05} />

                    {/* Footer Stats */}
                    <motion.div
                        className="mt-8 grid grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="p-4 bg-white/40 backdrop-blur-sm shadow-sm text-center" style={{ borderRadius: '20px' }}>
                            <p className="text-2xl font-bold text-moss">{stats.totalPredictions?.toLocaleString() || 0}</p>
                            <p className="text-sm text-moss/60">Total Predictions</p>
                        </div>
                        <div className="p-4 bg-white/40 backdrop-blur-sm shadow-sm text-center" style={{ borderRadius: '20px' }}>
                            <p className="text-2xl font-bold text-sage">{stats.uptime}%</p>
                            <p className="text-sm text-moss/60">Uptime</p>
                        </div>
                        <div className="p-4 bg-white/40 backdrop-blur-sm shadow-sm text-center" style={{ borderRadius: '20px' }}>
                            <p className="text-2xl font-bold text-clay">{stats.avgResponseTime}ms</p>
                            <p className="text-sm text-moss/60">Avg Response Time</p>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default AdminPage;
