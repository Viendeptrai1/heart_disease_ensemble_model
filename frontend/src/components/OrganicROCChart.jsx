import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';

/**
 * OrganicROCChart - Fluid ROC/AUC curve with organic styling
 * Uses smooth monotone curves and gradient fills
 */
const OrganicROCChart = ({ data, auc = 0.91 }) => {
    const [activePoint, setActivePoint] = useState(null);

    // Generate mock ROC data only once using useMemo
    const rocData = useMemo(() => data || generateMockROCData(), [data]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <motion.div
                    className="px-4 py-3 bg-white/95 backdrop-blur-sm shadow-lg"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <p className="text-xs text-moss/60 mb-1">Threshold: {point.threshold?.toFixed(2)}</p>
                    <p className="text-sage font-semibold">TPR: {(point.tpr * 100).toFixed(1)}%</p>
                    <p className="text-clay font-semibold">FPR: {(point.fpr * 100).toFixed(1)}%</p>
                </motion.div>
            );
        }
        return null;
    };

    // Custom active dot with glow effect
    const GlowingDot = (props) => {
        const { cx, cy, payload } = props;
        // Check if coordinates are valid numbers
        if (cx === undefined || cy === undefined || !Number.isFinite(cx) || !Number.isFinite(cy)) {
            return null;
        }
        if (!activePoint || activePoint.threshold !== payload?.threshold) return null;

        return (
            <g>
                {/* Outer glow */}
                <motion.circle
                    cx={cx}
                    cy={cy}
                    r={15}
                    fill="rgba(135, 152, 106, 0.3)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                {/* Inner dot */}
                <circle cx={cx} cy={cy} r={6} fill="#87986A" stroke="white" strokeWidth={2} />
            </g>
        );
    };

    return (
        <motion.div
            className="bg-white/50 backdrop-blur-sm p-6 shadow-lg"
            style={{ borderRadius: '30px 15px 30px 15px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-moss flex items-center gap-2">
                        <span className="text-2xl">📈</span>
                        ROC Curve
                    </h3>
                    <p className="text-sm text-moss/60">Receiver Operating Characteristic</p>
                </div>
                <motion.div
                    className="px-4 py-2 bg-sage/20 rounded-full"
                    whileHover={{ scale: 1.05 }}
                >
                    <span className="text-sm text-moss/60">AUC = </span>
                    <span className="text-lg font-bold text-sage">{auc.toFixed(2)}</span>
                </motion.div>
            </div>

            {/* Chart */}
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={rocData}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                        onMouseMove={(e) => {
                            if (e.activePayload) {
                                setActivePoint(e.activePayload[0].payload);
                            }
                        }}
                        onMouseLeave={() => setActivePoint(null)}
                    >
                        <defs>
                            {/* Gradient for ROC area */}
                            <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#87986A" stopOpacity={0.6} />
                                <stop offset="50%" stopColor="#87986A" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#87986A" stopOpacity={0.05} />
                            </linearGradient>

                            {/* Glow filter */}
                            <filter id="rocGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Diagonal reference line (random classifier) */}
                        <ReferenceLine
                            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                            stroke="#D57E5F"
                            strokeDasharray="5 5"
                            strokeOpacity={0.5}
                        />

                        <XAxis
                            dataKey="fpr"
                            type="number"
                            domain={[0, 1]}
                            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                            tick={{ fontSize: 11, fill: '#4E5B44' }}
                            axisLine={{ stroke: '#87986A', strokeOpacity: 0.3 }}
                            tickLine={false}
                            label={{ value: 'False Positive Rate', position: 'bottom', fontSize: 12, fill: '#4E5B44', offset: -5 }}
                        />
                        <YAxis
                            dataKey="tpr"
                            type="number"
                            domain={[0, 1]}
                            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                            tick={{ fontSize: 11, fill: '#4E5B44' }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#4E5B44' }}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        {/* ROC Area */}
                        <Area
                            type="monotone"
                            dataKey="tpr"
                            stroke="#4E5B44"
                            strokeWidth={3}
                            fill="url(#rocGradient)"
                            filter="url(#rocGlow)"
                            dot={false}
                            activeDot={<GlowingDot />}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-moss rounded-full" />
                    <span className="text-moss/70">Model ROC</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-clay rounded-full" style={{ borderStyle: 'dashed' }} />
                    <span className="text-moss/70">Random (AUC=0.5)</span>
                </div>
            </div>
        </motion.div>
    );
};

// Generate mock ROC curve data (deterministic)
function generateMockROCData() {
    const data = [];
    // Simulate a good classifier with AUC ~0.91
    for (let i = 0; i <= 100; i += 2) {
        const fpr = i / 100;
        // Good classifier curve (above diagonal) - use deterministic sine wave for variation
        const variation = Math.sin(i * 0.5) * 0.02;
        const tpr = Math.min(1, Math.pow(fpr, 0.3) + variation);
        data.push({
            fpr,
            tpr: Math.max(0, Math.min(1, tpr)),
            threshold: 1 - fpr,
        });
    }
    // Ensure endpoints
    data[0] = { fpr: 0, tpr: 0, threshold: 1 };
    data[data.length - 1] = { fpr: 1, tpr: 1, threshold: 0 };
    return data;
}

export default OrganicROCChart;
