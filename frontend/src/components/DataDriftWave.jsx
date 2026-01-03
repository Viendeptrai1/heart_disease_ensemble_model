import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DataDriftWave - Animated wave visualization for data drift monitoring
 * Smooth wave = healthy model, Jagged wave = data drift detected
 */
const DataDriftWave = ({ driftLevel = 'healthy', driftScore = 0.05 }) => {
    // driftLevel: 'healthy', 'warning', 'critical'
    // driftScore: 0-1 (0 = no drift, 1 = severe drift)

    const config = useMemo(() => {
        switch (driftLevel) {
            case 'critical':
                return {
                    color: '#D57E5F',
                    bgColor: 'from-clay/10 to-clay/5',
                    amplitude: 40,
                    frequency: 8,
                    noise: 0.5,
                    label: 'Cảnh báo nghiêm trọng',
                    description: 'Data drift đáng kể được phát hiện',
                    emoji: '⚠️',
                };
            case 'warning':
                return {
                    color: '#E8A849',
                    bgColor: 'from-amber-100/50 to-amber-50/30',
                    amplitude: 25,
                    frequency: 5,
                    noise: 0.3,
                    label: 'Cần theo dõi',
                    description: 'Có dấu hiệu drift nhẹ',
                    emoji: '🔶',
                };
            default:
                return {
                    color: '#87986A',
                    bgColor: 'from-sage/10 to-sage/5',
                    amplitude: 15,
                    frequency: 3,
                    noise: 0.1,
                    label: 'Khỏe mạnh',
                    description: 'Dữ liệu ổn định, không có drift',
                    emoji: '✅',
                };
        }
    }, [driftLevel]);

    // Generate wave path with deterministic noise
    const generateWavePath = (offset = 0, secondary = false) => {
        const width = 800;
        const height = 120;
        const midY = height / 2;
        const amp = secondary ? config.amplitude * 0.6 : config.amplitude;
        const freq = secondary ? config.frequency * 1.3 : config.frequency;
        const points = [];

        for (let x = 0; x <= width; x += 4) {
            let y = midY;
            // Base sine wave
            y += Math.sin((x / width) * Math.PI * freq + offset) * amp;
            // Add deterministic noise for jaggedness (using sine with different frequency)
            if (config.noise > 0) {
                y += Math.sin(x * 0.15 + offset * 2) * config.noise * amp;
            }
            points.push(`${x},${y.toFixed(1)}`);
        }

        return `M 0,${midY} L ${points.join(' L ')}`;
    };

    // Generate multiple wave phases for animation
    const wavePaths = useMemo(() => [
        generateWavePath(0),
        generateWavePath(Math.PI * 0.5),
        generateWavePath(Math.PI),
        generateWavePath(Math.PI * 1.5),
        generateWavePath(Math.PI * 2),
    ], [config]);

    const secondaryWavePaths = useMemo(() => [
        generateWavePath(Math.PI * 0.25, true),
        generateWavePath(Math.PI * 0.75, true),
        generateWavePath(Math.PI * 1.25, true),
        generateWavePath(Math.PI * 1.75, true),
        generateWavePath(Math.PI * 2.25, true),
    ], [config]);

    return (
        <motion.div
            className={`bg-gradient-to-br ${config.bgColor} backdrop-blur-sm p-6 shadow-lg`}
            style={{ borderRadius: '30px 15px 30px 15px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-moss flex items-center gap-2">
                        <span className="text-2xl">🌊</span>
                        Data Drift Monitor
                    </h3>
                    <p className="text-sm text-moss/60">Theo dõi sự thay đổi phân phối dữ liệu</p>
                </div>
                <motion.div
                    className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full"
                    animate={{
                        boxShadow: driftLevel === 'healthy'
                            ? ['0 0 0 rgba(135, 152, 106, 0)', '0 0 15px rgba(135, 152, 106, 0.3)', '0 0 0 rgba(135, 152, 106, 0)']
                            : driftLevel === 'critical'
                                ? ['0 0 0 rgba(213, 126, 95, 0)', '0 0 15px rgba(213, 126, 95, 0.5)', '0 0 0 rgba(213, 126, 95, 0)']
                                : ['0 0 0 rgba(232, 168, 73, 0)', '0 0 10px rgba(232, 168, 73, 0.3)', '0 0 0 rgba(232, 168, 73, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <span className="text-lg">{config.emoji}</span>
                    <span className="text-sm font-medium\" style={{ color: config.color }}>
                        {config.label}
                    </span>
                </motion.div>
            </div>

            {/* Wave Visualization */}
            <div className="relative h-32 bg-white/30 rounded-2xl overflow-hidden mb-4">
                <svg
                    viewBox="0 0 800 120"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <defs>
                        {/* Gradient for wave */}
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={config.color} stopOpacity="0.3" />
                            <stop offset="50%" stopColor={config.color} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={config.color} stopOpacity="0.3" />
                        </linearGradient>

                        {/* Glow filter */}
                        <filter id="waveGlow" x="-20%" y="-50%" width="140%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background wave (secondary) */}
                    <motion.path
                        d={secondaryWavePaths[0]}
                        fill="none"
                        stroke={config.color}
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        animate={{ d: secondaryWavePaths }}
                        transition={{
                            duration: driftLevel === 'healthy' ? 6 : 4,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />

                    {/* Main wave */}
                    <motion.path
                        d={wavePaths[0]}
                        fill="none"
                        stroke="url(#waveGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter="url(#waveGlow)"
                        animate={{ d: wavePaths }}
                        transition={{
                            duration: driftLevel === 'healthy' ? 5 : 3,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />

                    {/* Center line reference */}
                    <line
                        x1="0"
                        y1="60"
                        x2="800"
                        y2="60"
                        stroke="#4E5B44"
                        strokeWidth="1"
                        strokeDasharray="5 10"
                        strokeOpacity="0.2"
                    />
                </svg>

                {/* Edge fades */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white/60 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/60 to-transparent" />
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-6">
                    <div>
                        <p className="text-moss/50">Drift Score</p>
                        <p className="font-semibold" style={{ color: config.color }}>
                            {(driftScore * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-moss/50">Trạng thái</p>
                        <p className="font-medium text-moss">{config.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 1, 0.7],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-moss/60">Live</span>
                </div>
            </div>
        </motion.div>
    );
};

export default DataDriftWave;
