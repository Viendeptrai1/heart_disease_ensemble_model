import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const HealthBlob = ({ healthScore = 50, size = 120 }) => {
    // healthScore: 0 (worst) to 100 (best)
    // Lower score = spiky, clay colored
    // Higher score = rounder, sage colored

    const blobConfig = useMemo(() => {
        // Normalize score to 0-1 range
        const normalized = healthScore / 100;

        // Border radius arrays: round (good) vs spiky (bad)
        const roundRadius = [
            '60% 40% 50% 50%',
            '55% 45% 45% 55%',
            '50% 50% 50% 50%',
            '45% 55% 55% 45%',
        ];

        const spikyRadius = [
            '30% 70% 20% 80%',
            '80% 20% 70% 30%',
            '25% 75% 80% 20%',
            '75% 25% 30% 70%',
        ];

        // Interpolate between spiky and round based on health
        const interpolateRadius = (index) => {
            const roundParts = roundRadius[index].split(' ').map(s => parseInt(s));
            const spikyParts = spikyRadius[index].split(' ').map(s => parseInt(s));

            return spikyParts.map((spiky, i) => {
                const round = roundParts[i];
                const value = Math.round(spiky + (round - spiky) * normalized);
                return `${value}%`;
            }).join(' ');
        };

        // Create animated border radius keyframes
        const radiusKeyframes = [0, 1, 2, 3, 0].map(i => interpolateRadius(i));

        // Color interpolation: clay (bad) -> sage (good)
        const clay = { r: 213, g: 126, b: 95 }; // #D57E5F
        const sage = { r: 135, g: 152, b: 106 }; // #87986A

        const color = {
            r: Math.round(clay.r + (sage.r - clay.r) * normalized),
            g: Math.round(clay.g + (sage.g - clay.g) * normalized),
            b: Math.round(clay.b + (sage.b - clay.b) * normalized),
        };

        // Secondary color (darker)
        const secondaryColor = {
            r: Math.max(0, color.r - 30),
            g: Math.max(0, color.g - 30),
            b: Math.max(0, color.b - 30),
        };

        return {
            borderRadius: radiusKeyframes,
            color: `rgb(${color.r}, ${color.g}, ${color.b})`,
            secondaryColor: `rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b})`,
            shadowColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`,
            animationSpeed: 3 + (1 - normalized) * 2, // Faster when unhealthy
        };
    }, [healthScore]);

    // Status text based on health score
    const getStatus = () => {
        if (healthScore >= 80) return { text: 'Xuất sắc', emoji: '🌟' };
        if (healthScore >= 60) return { text: 'Tốt', emoji: '💚' };
        if (healthScore >= 40) return { text: 'Trung bình', emoji: '💛' };
        if (healthScore >= 20) return { text: 'Cần chú ý', emoji: '🧡' };
        return { text: 'Nguy hiểm', emoji: '❤️‍🔥' };
    };

    const status = getStatus();

    // Generate wave path for liquid effect
    const generateWavePath = (offset, amplitude, frequency) => {
        const s = size;
        const fillHeight = s * (1 - (healthScore / 100) * 0.85 - 0.08);
        const points = [];

        for (let x = 0; x <= s; x += 2) {
            const y = fillHeight +
                Math.sin((x / s) * Math.PI * frequency + offset) * amplitude +
                Math.sin((x / s) * Math.PI * frequency * 0.5 + offset * 1.3) * amplitude * 0.5;
            points.push(`${x},${y}`);
        }

        return `M 0,${s} L ${points.join(' L ')} L ${s},${s} Z`;
    };

    // Generate organic blob path for clipping
    const containerPath = useMemo(() => {
        const s = size;
        return `
            M ${s * 0.5} ${s * 0.03}
            C ${s * 0.73} ${s * 0.02}, ${s * 0.93} ${s * 0.18}, ${s * 0.97} ${s * 0.43}
            C ${s * 0.99} ${s * 0.68}, ${s * 0.83} ${s * 0.93}, ${s * 0.55} ${s * 0.97}
            C ${s * 0.27} ${s * 0.99}, ${s * 0.06} ${s * 0.78}, ${s * 0.03} ${s * 0.5}
            C ${s * 0.01} ${s * 0.27}, ${s * 0.22} ${s * 0.03}, ${s * 0.5} ${s * 0.03}
            Z
        `;
    }, [size]);

    // Unique ID for this instance's clip path
    const clipId = useMemo(() => `health-blob-clip-${Math.random().toString(36).substr(2, 9)}`, []);
    const gradientId = useMemo(() => `health-liquid-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Blob Container */}
            <motion.div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Outer glow */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle, ${blobConfig.shadowColor} 0%, transparent 70%)`,
                    }}
                    animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                        duration: blobConfig.animationSpeed,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Main SVG with liquid */}
                <motion.svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="w-full h-full"
                    style={{ overflow: 'visible' }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{
                        duration: blobConfig.animationSpeed * 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <defs>
                        {/* Clip path for liquid */}
                        <clipPath id={clipId}>
                            <path d={containerPath} />
                        </clipPath>

                        {/* Gradient for liquid */}
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={blobConfig.color} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={blobConfig.secondaryColor} stopOpacity="1" />
                        </linearGradient>

                        {/* Glass highlight gradient */}
                        <linearGradient id={`${gradientId}-glass`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.25" />
                        </linearGradient>

                        {/* Inner shadow filter */}
                        <filter id={`${clipId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                            <feOffset dx="0" dy="2" />
                            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend in2="SourceGraphic" mode="normal" />
                        </filter>
                    </defs>

                    {/* Background container */}
                    <path
                        d={containerPath}
                        fill="rgba(245, 242, 237, 0.4)"
                        stroke="rgba(135, 152, 106, 0.25)"
                        strokeWidth="2"
                    />

                    {/* Liquid fill with waves */}
                    <g clipPath={`url(#${clipId})`}>
                        {/* Back wave */}
                        <motion.path
                            d={generateWavePath(0, 5, 3)}
                            fill={blobConfig.secondaryColor}
                            opacity={0.5}
                            animate={{
                                d: [
                                    generateWavePath(0, 5, 3),
                                    generateWavePath(Math.PI, 5, 3),
                                    generateWavePath(Math.PI * 2, 5, 3),
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
                            d={generateWavePath(Math.PI / 2, 6, 2.5)}
                            fill={blobConfig.color}
                            opacity={0.7}
                            animate={{
                                d: [
                                    generateWavePath(Math.PI / 2, 6, 2.5),
                                    generateWavePath(Math.PI * 1.5, 6, 2.5),
                                    generateWavePath(Math.PI * 2.5, 6, 2.5),
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
                            d={generateWavePath(Math.PI, 4, 4)}
                            fill={`url(#${gradientId})`}
                            animate={{
                                d: [
                                    generateWavePath(Math.PI, 4, 4),
                                    generateWavePath(Math.PI * 2, 4, 4),
                                    generateWavePath(Math.PI * 3, 4, 4),
                                ]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />

                        {/* Bubbles */}
                        {[
                            { cx: 0.25, r: 3, delay: 0 },
                            { cx: 0.43, r: 4, delay: 0.6 },
                            { cx: 0.61, r: 2.5, delay: 1.2 },
                            { cx: 0.79, r: 3.5, delay: 1.8 },
                        ].map((bubble, i) => (
                            <motion.circle
                                key={i}
                                cx={size * bubble.cx}
                                cy={size}
                                r={bubble.r}
                                fill="rgba(255,255,255,0.5)"
                                animate={{
                                    cy: [size, size * (1 - (healthScore / 100) * 0.75), size * (1 - (healthScore / 100) * 0.6)],
                                    opacity: [0, 0.7, 0],
                                    scale: [0.5, 1, 0.3],
                                }}
                                transition={{
                                    duration: 2.5 + i * 0.3,
                                    repeat: Infinity,
                                    delay: bubble.delay,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </g>

                    {/* Glass overlay */}
                    <path
                        d={containerPath}
                        fill={`url(#${gradientId}-glass)`}
                        style={{ pointerEvents: 'none' }}
                    />

                    {/* Container border with inner shadow */}
                    <path
                        d={containerPath}
                        fill="none"
                        stroke="rgba(78, 91, 68, 0.15)"
                        strokeWidth="2"
                        filter={`url(#${clipId}-shadow)`}
                    />

                    {/* Score text */}
                    <text
                        x={size / 2}
                        y={size / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#4E5B44"
                        style={{
                            fontFamily: '"M PLUS Rounded 1c", sans-serif',
                            textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                        }}
                    >
                        <tspan fontSize={size / 3.5} fontWeight="700">{healthScore}</tspan>
                    </text>
                </motion.svg>

                {/* Floating particles for good health */}
                {healthScore >= 60 && (
                    <>
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full bg-white/70"
                                style={{
                                    left: `${30 + i * 20}%`,
                                    bottom: '15%',
                                }}
                                animate={{
                                    y: [-5, -20, -5],
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2 + i * 0.4,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Status label */}
            <motion.div
                className="flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <span className="text-base">{status.emoji}</span>
                <span className="text-sm font-medium text-moss">{status.text}</span>
            </motion.div>

            {/* Health trend indicator */}
            <p className="text-xs text-moss/60">Điểm sức khỏe tổng hợp</p>
        </div>
    );
};

export default HealthBlob;
