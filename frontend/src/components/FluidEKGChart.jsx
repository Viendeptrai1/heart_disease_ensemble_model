import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceArea,
} from 'recharts';

const FluidEKGChart = ({ data = [], normalMin = 60, normalMax = 100 }) => {
    const [timeRange, setTimeRange] = useState([0, 100]);
    const [isMounted, setIsMounted] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        // Measure container after mount
        const timer = setTimeout(() => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
            setIsMounted(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    // Filter data based on time range
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const startIdx = Math.floor((timeRange[0] / 100) * data.length);
        const endIdx = Math.ceil((timeRange[1] / 100) * data.length);
        return data.slice(startIdx, endIdx);
    }, [data, timeRange]);

    // Check if value is abnormal
    const getGradientOffset = () => {
        if (!data || data.length === 0) return { high: 0, low: 1 };

        const values = data.map((d) => d.value).filter(v => v != null && !isNaN(v));
        if (values.length === 0) return { high: 0, low: 1 };

        const dataMax = Math.max(...values);
        const dataMin = Math.min(...values);

        if (dataMax <= normalMax && dataMin >= normalMin) return { high: 0, low: 1 };

        const highOffset = (dataMax - normalMax) / (dataMax - dataMin);
        const lowOffset = (normalMin - dataMin) / (dataMax - dataMin);

        return { high: Math.max(0, highOffset), low: Math.max(0, lowOffset) };
    };

    const gradientOffset = getGradientOffset();

    // Early return AFTER all hooks
    if (!data || data.length === 0) {
        return (
            <div className="w-full">
                <motion.div
                    className="relative bg-white/50 backdrop-blur-sm p-6 shadow-lg overflow-hidden"
                    style={{ borderRadius: '30px 15px 30px 15px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="h-64 flex items-center justify-center text-moss/40">
                        <div className="text-center">
                            <div className="text-4xl mb-2">💓</div>
                            <p>Không có dữ liệu nhịp tim</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const isAbnormal = value > normalMax || value < normalMin;

            return (
                <div
                    className="px-4 py-3 bg-white/95 backdrop-blur-sm shadow-lg"
                    style={{ borderRadius: '20px 8px 20px 8px' }}
                >
                    <p className="text-xs text-moss/60">{label}</p>
                    <p className={`text-lg font-semibold ${isAbnormal ? 'text-clay' : 'text-sage'}`}>
                        {value} BPM
                    </p>
                    {isAbnormal && (
                        <p className="text-xs text-clay mt-1">⚠️ Bất thường</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            {/* Chart Container */}
            <motion.div
                className="relative bg-white/50 backdrop-blur-sm p-6 shadow-lg overflow-hidden"
                style={{ borderRadius: '30px 15px 30px 15px' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Title */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-moss font-semibold flex items-center gap-2">
                        <span className="text-2xl">💓</span>
                        Nhịp tim theo thời gian
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-sage/40" />
                            Bình thường
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-clay" />
                            Bất thường
                        </span>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-64" ref={containerRef} style={{ minHeight: '250px' }}>
                    {isMounted && dimensions.width > 0 && filteredData && filteredData.length > 0 ? (
                        <div style={{ width: '100%', height: '250px' }}>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart
                                    data={filteredData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        {/* Gradient for normal range */}
                                        <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#87986A" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#87986A" stopOpacity={0.05} />
                                        </linearGradient>

                                        {/* Gradient for abnormal (high) */}
                                        <linearGradient id="abnormalGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#D57E5F" stopOpacity={0.6} />
                                            <stop offset={`${gradientOffset.high * 100}%`} stopColor="#D57E5F" stopOpacity={0.3} />
                                            <stop offset={`${gradientOffset.high * 100}%`} stopColor="#87986A" stopOpacity={0.3} />
                                            <stop offset={`${100 - gradientOffset.low * 100}%`} stopColor="#87986A" stopOpacity={0.1} />
                                            <stop offset={`${100 - gradientOffset.low * 100}%`} stopColor="#D57E5F" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#D57E5F" stopOpacity={0.6} />
                                        </linearGradient>

                                        {/* Glow filter for abnormal spikes */}
                                        <filter id="glowClay" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Normal range reference area */}
                                    <ReferenceArea
                                        y1={normalMin}
                                        y2={normalMax}
                                        fill="#87986A"
                                        fillOpacity={0.1}
                                    />

                                    <XAxis
                                        dataKey="time"
                                        tick={{ fontSize: 10, fill: '#4E5B44' }}
                                        axisLine={{ stroke: '#87986A', strokeOpacity: 0.3 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={['dataMin - 10', 'dataMax + 10']}
                                        tick={{ fontSize: 10, fill: '#4E5B44' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* Reference lines for normal range */}
                                    <ReferenceLine
                                        y={normalMax}
                                        stroke="#87986A"
                                        strokeDasharray="5 5"
                                        strokeOpacity={0.5}
                                    />
                                    <ReferenceLine
                                        y={normalMin}
                                        stroke="#87986A"
                                        strokeDasharray="5 5"
                                        strokeOpacity={0.5}
                                    />

                                    {/* Main area curve */}
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#4E5B44"
                                        strokeWidth={2}
                                        fill="url(#abnormalGradient)"
                                        dot={false}
                                        activeDot={{
                                            r: 6,
                                            fill: '#D57E5F',
                                            stroke: '#fff',
                                            strokeWidth: 2,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-moss/40">
                            <div className="text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <p className="text-sm">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Capsule Time Slider - Only show if data exists */}
                {filteredData && filteredData.length > 0 && (
                    <div className="mt-6">
                        <div
                            className="relative h-10 bg-sand/50 mx-4"
                            style={{ borderRadius: '9999px' }}
                        >
                            {/* Track background showing mini chart */}
                            <div className="absolute inset-2 overflow-hidden" style={{ borderRadius: '9999px' }}>
                                <div className="h-full w-full bg-gradient-to-r from-sage/20 via-sage/30 to-sage/20" />
                            </div>

                            {/* Slider Handle */}
                            <motion.div
                                className="absolute top-1 bottom-1 bg-white shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
                                style={{
                                    borderRadius: '9999px',
                                    left: `${timeRange[0]}%`,
                                    width: `${timeRange[1] - timeRange[0]}%`,
                                    minWidth: '60px',
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0}
                                onDrag={(event, info) => {
                                    const container = event.target.parentElement;
                                    const containerWidth = container.offsetWidth;
                                    const deltaPercent = (info.delta.x / containerWidth) * 100;

                                    setTimeRange(([start, end]) => {
                                        const newStart = Math.max(0, Math.min(start + deltaPercent, 100 - (end - start)));
                                        const newEnd = newStart + (end - start);
                                        return [newStart, Math.min(newEnd, 100)];
                                    });
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-1">
                                    <div className="w-1 h-4 bg-sage/30 rounded-full" />
                                    <div className="w-1 h-4 bg-sage/30 rounded-full" />
                                    <div className="w-1 h-4 bg-sage/30 rounded-full" />
                                </div>
                            </motion.div>

                            {/* Time labels */}
                            <div className="absolute -bottom-6 left-4 text-xs text-moss/50">
                                {filteredData[0]?.time || '00:00'}
                            </div>
                            <div className="absolute -bottom-6 right-4 text-xs text-moss/50">
                                {filteredData[filteredData.length - 1]?.time || '24:00'}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default FluidEKGChart;
