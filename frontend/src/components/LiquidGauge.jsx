import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * LiquidGauge - Organic confidence meter with animated liquid fill
 * Displays model confidence as liquid level with wave animation
 */
const LiquidGauge = ({
    value = 0.92,
    riskLevel = 'high',
    size = 280,
    label = 'Độ Tin Cậy'
}) => {
    const percentage = Math.round(value * 100);
    const isHighRisk = riskLevel.toLowerCase() === 'high';
    const primaryColor = isHighRisk ? '#D57E5F' : '#87986A';
    const secondaryColor = isHighRisk ? '#C26B4A' : '#6B7A54';

    // Pre-calculate bubble positions (stable values)
    const bubblePositions = useMemo(() => [
        { cx: 0.25, r: 4 },
        { cx: 0.35, r: 6 },
        { cx: 0.50, r: 3 },
        { cx: 0.60, r: 7 },
        { cx: 0.70, r: 5 },
        { cx: 0.80, r: 4 },
    ], []);

    // Generate organic blob path for container
    const containerPath = useMemo(() => {
        const s = size;
        return `
            M ${s * 0.5} ${s * 0.02}
            C ${s * 0.75} ${s * 0.02}, ${s * 0.95} ${s * 0.2}, ${s * 0.98} ${s * 0.45}
            C ${s * 1.0} ${s * 0.7}, ${s * 0.85} ${s * 0.95}, ${s * 0.55} ${s * 0.98}
            C ${s * 0.25} ${s * 1.0}, ${s * 0.05} ${s * 0.8}, ${s * 0.02} ${s * 0.5}
            C ${s * 0.0} ${s * 0.25}, ${s * 0.2} ${s * 0.02}, ${s * 0.5} ${s * 0.02}
            Z
        `;
    }, [size]);

    // Wave path generator
    const generateWavePath = (offset, amplitude, frequency) => {
        const s = size;
        const fillHeight = s * (1 - value * 0.85 - 0.05);
        const points = [];

        for (let x = 0; x <= s; x += 2) {
            const y = fillHeight +
                Math.sin((x / s) * Math.PI * frequency + offset) * amplitude +
                Math.sin((x / s) * Math.PI * frequency * 0.5 + offset * 1.3) * amplitude * 0.5;
            points.push(`${x},${y}`);
        }

        return `M 0,${s} L ${points.join(' L ')} L ${s},${s} Z`;
    };

    return (
        <div
            className="relative flex flex-col items-center"
            style={{ width: size, height: size + 60 }}
        >
            {/* Main Gauge Container */}
            <motion.div
                className="relative"
                style={{ width: size, height: size }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="w-full h-full"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        {/* Clip path for liquid */}
                        <clipPath id="liquid-clip">
                            <path d={containerPath} />
                        </clipPath>

                        {/* Gradient for liquid */}
                        <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
                        </linearGradient>

                        {/* Glass highlight gradient */}
                        <linearGradient id="glass-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                        </linearGradient>

                        {/* Inner shadow */}
                        <filter id="inner-shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
                            <feOffset dx="0" dy="4" />
                            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
                            <feBlend in2="SourceGraphic" mode="normal" />
                        </filter>
                    </defs>

                    {/* Background container */}
                    <path
                        d={containerPath}
                        fill="rgba(245, 242, 237, 0.3)"
                        stroke="rgba(135, 152, 106, 0.3)"
                        strokeWidth="2"
                    />

                    {/* Liquid fill with waves */}
                    <g clipPath="url(#liquid-clip)">
                        {/* Back wave */}
                        <motion.path
                            d={generateWavePath(0, 8, 3)}
                            fill={secondaryColor}
                            opacity={0.6}
                            animate={{
                                d: [
                                    generateWavePath(0, 8, 3),
                                    generateWavePath(Math.PI, 8, 3),
                                    generateWavePath(Math.PI * 2, 8, 3),
                                ]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />

                        {/* Middle wave */}
                        <motion.path
                            d={generateWavePath(Math.PI / 2, 10, 2.5)}
                            fill={primaryColor}
                            opacity={0.8}
                            animate={{
                                d: [
                                    generateWavePath(Math.PI / 2, 10, 2.5),
                                    generateWavePath(Math.PI * 1.5, 10, 2.5),
                                    generateWavePath(Math.PI * 2.5, 10, 2.5),
                                ]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />

                        {/* Front wave */}
                        <motion.path
                            d={generateWavePath(Math.PI, 6, 4)}
                            fill="url(#liquid-gradient)"
                            animate={{
                                d: [
                                    generateWavePath(Math.PI, 6, 4),
                                    generateWavePath(Math.PI * 2, 6, 4),
                                    generateWavePath(Math.PI * 3, 6, 4),
                                ]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />

                        {/* Bubbles */}
                        {bubblePositions.map((bubble, i) => (
                            <motion.circle
                                key={i}
                                cx={size * bubble.cx}
                                cy={size}
                                r={bubble.r}
                                fill="rgba(255,255,255,0.4)"
                                animate={{
                                    cy: [size, size * (1 - value * 0.8), size * (1 - value * 0.7)],
                                    opacity: [0, 0.6, 0],
                                    scale: [0.5, 1, 0.3],
                                }}
                                transition={{
                                    duration: 3 + i * 0.4,
                                    repeat: Infinity,
                                    delay: i * 0.5,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </g>

                    {/* Glass overlay */}
                    <path
                        d={containerPath}
                        fill="url(#glass-highlight)"
                        style={{ pointerEvents: 'none' }}
                    />

                    {/* Container border */}
                    <path
                        d={containerPath}
                        fill="none"
                        stroke="rgba(78, 91, 68, 0.2)"
                        strokeWidth="3"
                        filter="url(#inner-shadow)"
                    />

                    {/* Percentage text - number and % on same line */}
                    <text
                        x={size / 2}
                        y={size / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#4E5B44"
                        style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                    >
                        <tspan fontSize={size / 4} fontWeight="700">{percentage}</tspan>
                        <tspan fontSize={size / 7} fontWeight="500" opacity="0.8">%</tspan>
                    </text>
                </svg>
            </motion.div>

            {/* Label */}
            <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="text-moss font-bold text-lg">{label}</div>
                <div
                    className={`text-sm font-medium mt-1 px-4 py-1 rounded-full inline-block
                        ${isHighRisk ? 'bg-clay/20 text-clay' : 'bg-sage/20 text-sage'}
                    `}
                    style={{ borderRadius: '2rem' }}
                >
                    {isHighRisk ? 'Rủi Ro Cao' : 'Rủi Ro Thấp'}
                </div>
            </motion.div>
        </div>
    );
};

export default LiquidGauge;
