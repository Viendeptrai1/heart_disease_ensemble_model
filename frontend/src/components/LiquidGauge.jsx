import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Pure function moved OUTSIDE component to avoid closure/stale reference issues
const generateWavePath = (offset, amplitude, frequency, size, value) => {
    const safeOffset = typeof offset === 'number' && !isNaN(offset) ? offset : 0;
    const safeAmp = typeof amplitude === 'number' && !isNaN(amplitude) ? amplitude : 10;
    const safeFreq = typeof frequency === 'number' && !isNaN(frequency) ? frequency : 3;
    const safeS = typeof size === 'number' && !isNaN(size) && size > 0 ? size : 280;
    const safeV = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(1, value)) : 0.5;

    const fillHeight = safeS * (1 - safeV * 0.85 - 0.05);

    let pathStr = `M 0,${safeS} `;

    for (let x = 0; x <= safeS; x += 5) {
        let y = fillHeight +
            Math.sin((x / safeS) * Math.PI * safeFreq + safeOffset) * safeAmp +
            Math.sin((x / safeS) * Math.PI * safeFreq * 0.5 + safeOffset * 1.3) * safeAmp * 0.5;

        if (typeof y !== 'number' || isNaN(y)) y = fillHeight;
        pathStr += `L ${x.toFixed(1)},${y.toFixed(1)} `;
    }

    pathStr += `L ${safeS},${safeS} Z`;

    return pathStr;
};

/**
 * LiquidGauge - Organic confidence meter with animated liquid fill
 * Displays model confidence as liquid level with wave animation
 */
const LiquidGauge = ({
    value: initialValue = 0.92,
    riskLevel = 'high',
    size: initialSize = 280,
    label = 'Độ Tin Cậy'
}) => {
    // Sanitize inputs
    const safeValue = useMemo(() => {
        const v = Number(initialValue);
        return isNaN(v) ? 0 : Math.max(0, Math.min(1, v));
    }, [initialValue]);

    const safeSize = useMemo(() => {
        const s = Number(initialSize);
        return isNaN(s) || s <= 0 ? 280 : s;
    }, [initialSize]);

    const value = safeValue;
    const size = safeSize;

    const percentage = Math.round(value * 100);
    const isHighRisk = riskLevel.toLowerCase() === 'high';
    const primaryColor = isHighRisk ? '#D57E5F' : '#87986A';
    const secondaryColor = isHighRisk ? '#C26B4A' : '#6B7A54';

    // Pre-calculate bubble positions - SIZE SCALES WITH RISK %
    const bubblePositions = useMemo(() => {
        const baseScale = value; // 0-1, scales with risk percentage
        return [
            { cx: 0.25, r: 3 + baseScale * 4 },  // 3-7
            { cx: 0.35, r: 4 + baseScale * 6 },  // 4-10
            { cx: 0.50, r: 2 + baseScale * 3 },  // 2-5
            { cx: 0.60, r: 5 + baseScale * 7 },  // 5-12
            { cx: 0.70, r: 3 + baseScale * 5 },  // 3-8
            { cx: 0.80, r: 3 + baseScale * 4 },  // 3-7
        ];
    }, [value]);

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

    // Fallback path for when calculations fail
    const fallbackPath = `M 0,${size} L ${size},${size} Z`;

    // Pre-compute ALL wave animation paths with validation
    const waveAnimations = useMemo(() => {
        const s = size;
        const v = value;
        const fallback = `M 0,${s} L ${s},${s} Z`;

        const backWave = [
            generateWavePath(0, 8, 3, s, v),
            generateWavePath(Math.PI, 8, 3, s, v),
            generateWavePath(Math.PI * 2, 8, 3, s, v),
        ].map(p => (p && p.startsWith('M')) ? p : fallback);

        const middleWave = [
            generateWavePath(Math.PI / 2, 10, 2.5, s, v),
            generateWavePath(Math.PI * 1.5, 10, 2.5, s, v),
            generateWavePath(Math.PI * 2.5, 10, 2.5, s, v),
        ].map(p => (p && p.startsWith('M')) ? p : fallback);

        const frontWave = [
            generateWavePath(Math.PI, 6, 4, s, v),
            generateWavePath(Math.PI * 2, 6, 4, s, v),
            generateWavePath(Math.PI * 3, 6, 4, s, v),
        ].map(p => (p && p.startsWith('M')) ? p : fallback);

        return { backWave, middleWave, frontWave };
    }, [size, value]);

    // Pre-compute bubble cy values with validation
    const bubbleCyValues = useMemo(() => {
        const s = size;
        const v = value;
        const values = [s, s * (1 - v * 0.8), s * (1 - v * 0.7)];
        const safeValues = values.map(val => (typeof val === 'number' && !isNaN(val)) ? val : s);
        return safeValues.length === 3 ? safeValues : [s, s, s];
    }, [size, value]);

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
                        {waveAnimations.backWave && waveAnimations.backWave.length > 0 && (
                            <motion.path
                                initial={{ d: waveAnimations.backWave[0] }}
                                animate={{ d: waveAnimations.backWave }}
                                fill={secondaryColor}
                                opacity={0.6}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />
                        )}

                        {/* Middle wave */}
                        {waveAnimations.middleWave && waveAnimations.middleWave.length > 0 && (
                            <motion.path
                                initial={{ d: waveAnimations.middleWave[0] }}
                                animate={{ d: waveAnimations.middleWave }}
                                fill={primaryColor}
                                opacity={0.8}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />
                        )}

                        {/* Front wave */}
                        {waveAnimations.frontWave && waveAnimations.frontWave.length > 0 && (
                            <motion.path
                                initial={{ d: waveAnimations.frontWave[0] }}
                                animate={{ d: waveAnimations.frontWave }}
                                fill="url(#liquid-gradient)"
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                            />
                        )}

                        {/* Bubbles */}
                        {bubbleCyValues && bubbleCyValues.length === 3 && bubblePositions.map((bubble, i) => (
                            <motion.circle
                                key={`bubble-${i}`}
                                cx={size * bubble.cx}
                                initial={{ cy: size, opacity: 0, scale: 0.5 }}
                                animate={{
                                    cy: bubbleCyValues,
                                    opacity: [0, 0.6, 0],
                                    scale: [0.5, 1, 0.3],
                                }}
                                r={bubble.r}
                                fill="rgba(255,255,255,0.4)"
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
