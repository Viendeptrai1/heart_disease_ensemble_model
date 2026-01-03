import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * BubbleChart - SHAP Feature Importance Visualization
 * Displays features as floating bubbles with size proportional to importance
 * and color indicating risk (Clay) or protective (Sage) effect
 */
const BubbleChart = ({ features = [], onFeatureClick }) => {
    const [hoveredFeature, setHoveredFeature] = useState(null);

    // Container dimensions
    const containerWidth = 500;
    const containerHeight = 360;
    const padding = 20;

    // Calculate bubble positions using circle packing algorithm
    const bubbleData = useMemo(() => {
        if (!features || !Array.isArray(features) || features.length === 0) return [];

        // Safe importance extraction
        const safeFeatures = features.map(f => ({
            ...f,
            importance: typeof f.importance === 'number' && !isNaN(f.importance) ? f.importance : 0.05
        }));

        let maxImportance = Math.max(...safeFeatures.map(f => Math.abs(f.importance)));
        if (maxImportance === 0 || isNaN(maxImportance)) maxImportance = 1;

        const minSize = 45;
        const maxSize = 95;

        // Sort by importance for better packing (largest first)
        const sorted = [...safeFeatures].sort((a, b) =>
            Math.abs(b.importance) - Math.abs(a.importance)
        );

        // Calculate sizes first
        const bubbles = sorted.map((feature, index) => {
            const normalizedSize = Math.abs(feature.importance) / maxImportance;
            const size = minSize + normalizedSize * (maxSize - minSize);
            const safeSize = isNaN(size) ? minSize : size;
            return {
                ...feature,
                size: safeSize,
                radius: safeSize / 2,
                delay: index * 0.1,
            };
        });

        // Circle packing with collision detection
        const placed = [];
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        bubbles.forEach((bubble, index) => {
            let bestPos = { x: centerX, y: centerY };
            let minDistFromCenter = Infinity;
            let foundValidPosition = false;

            // Try positions in expanding circles from center
            for (let ring = 0; ring < 20 && !foundValidPosition; ring++) {
                const ringRadius = ring * 25;
                const steps = Math.max(1, Math.floor(ring * 8));

                for (let step = 0; step < steps; step++) {
                    const angle = (step / steps) * Math.PI * 2 + ring * 0.5;
                    const testX = centerX + Math.cos(angle) * ringRadius;
                    const testY = centerY + Math.sin(angle) * ringRadius;

                    // Check bounds (bubble must stay fully inside)
                    const inBounds =
                        testX - bubble.radius >= padding &&
                        testX + bubble.radius <= containerWidth - padding &&
                        testY - bubble.radius >= padding + 20 &&
                        testY + bubble.radius <= containerHeight - padding;

                    if (!inBounds) continue;

                    // Check collision with placed bubbles
                    let hasCollision = false;
                    for (const other of placed) {
                        const dx = testX - other.x;
                        const dy = testY - other.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const minDist = bubble.radius + other.radius + 8; // 8px gap

                        if (dist < minDist) {
                            hasCollision = true;
                            break;
                        }
                    }

                    if (!hasCollision) {
                        const distFromCenter = Math.sqrt(
                            (testX - centerX) ** 2 + (testY - centerY) ** 2
                        );
                        if (distFromCenter < minDistFromCenter) {
                            minDistFromCenter = distFromCenter;
                            bestPos = { x: testX, y: testY };
                            foundValidPosition = true;
                        }
                    }
                }
            }

            placed.push({
                ...bubble,
                x: bestPos.x,
                y: bestPos.y,
            });
        });

        return placed;
    }, [features]);

    return (
        <div className="relative w-full h-[400px] overflow-hidden">
            {/* Floating Bubbles */}
            <svg
                viewBox="0 0 500 360"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {/* CSS Keyframes for lightweight floating animation */}
                    <style>{`
                        @keyframes float-0 {
                            0%, 100% { transform: translate(0, 0); }
                            50% { transform: translate(2px, -4px); }
                        }
                        @keyframes float-1 {
                            0%, 100% { transform: translate(0, 0); }
                            50% { transform: translate(-3px, -3px); }
                        }
                        @keyframes float-2 {
                            0%, 100% { transform: translate(0, 0); }
                            50% { transform: translate(1px, -5px); }
                        }
                    `}</style>
                    {/* Glow filters */}
                    <filter id="glow-clay" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#D57E5F" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-sage" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feFlood floodColor="#87986A" floodOpacity="0.5" />
                        <feComposite in2="blur" operator="in" />
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {bubbleData.map((bubble, index) => {
                    const isRisk = bubble.type === 'risk';
                    const isHovered = hoveredFeature === bubble.feature;

                    return (
                        <motion.g
                            key={bubble.feature}
                            initial={{ scale: 0, x: 250, y: 180 }}
                            animate={{
                                scale: 1,
                                x: bubble.x,
                                y: bubble.y,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 100,
                                damping: 15,
                                delay: bubble.delay,
                            }}
                            style={{ originX: '50%', originY: '50%' }}
                        >
                            {/* Simple CSS-based floating effect for better performance */}
                            <g
                                style={{
                                    animation: `float-${index % 3} ${6 + index * 0.5}s ease-in-out infinite`,
                                    animationDelay: `${index * 0.3}s`,
                                }}
                            >
                                {/* Main bubble */}
                                <motion.ellipse
                                    cx={0}
                                    cy={0}
                                    rx={bubble.size / 2}
                                    ry={bubble.size / 2.2}
                                    fill={isRisk ? '#D57E5F' : '#87986A'}
                                    filter={isHovered ? (isRisk ? 'url(#glow-clay)' : 'url(#glow-sage)') : 'none'}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onMouseEnter={() => setHoveredFeature(bubble.feature)}
                                    onMouseLeave={() => setHoveredFeature(null)}
                                    onClick={() => onFeatureClick?.(bubble)}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                />

                                {/* Shine/highlight */}
                                <ellipse
                                    cx={-bubble.size * 0.15}
                                    cy={-bubble.size * 0.15}
                                    rx={bubble.size * 0.15}
                                    ry={bubble.size * 0.1}
                                    fill="rgba(255,255,255,0.3)"
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Feature label - always show */}
                                <text
                                    x={0}
                                    y={-bubble.size * 0.08}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#F5F2ED"
                                    fontSize={Math.max(9, Math.min(14, bubble.size / 6))}
                                    fontWeight="600"
                                    style={{
                                        pointerEvents: 'none',
                                        fontFamily: '"M PLUS Rounded 1c", sans-serif',
                                    }}
                                >
                                    {bubble.size > 55
                                        ? (bubble.feature.length > 10 ? bubble.feature.substring(0, 8) + '...' : bubble.feature)
                                        : (bubble.feature.length > 6 ? bubble.feature.substring(0, 4) + '..' : bubble.feature)
                                    }
                                </text>

                                {/* Importance value - always show */}
                                <text
                                    x={0}
                                    y={bubble.size * 0.18}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="rgba(245,242,237,0.9)"
                                    fontSize={Math.max(8, Math.min(12, bubble.size / 7))}
                                    fontWeight="500"
                                    style={{
                                        pointerEvents: 'none',
                                        fontFamily: '"M PLUS Rounded 1c", sans-serif',
                                    }}
                                >
                                    {(Math.abs(bubble.importance) * 100).toFixed(0)}%
                                </text>
                            </g>
                        </motion.g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredFeature && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 text-sm text-moss"
                    style={{ borderRadius: '2rem' }}
                >
                    <span className="font-bold">{hoveredFeature}</span>
                    {' - '}
                    {bubbleData.find(b => b.feature === hoveredFeature)?.type === 'risk'
                        ? '⬆️ Increases Risk'
                        : '⬇️ Decreases Risk'
                    }
                </motion.div>
            )}

            {/* Legend */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-clay" />
                    <span className="text-moss/70">Tăng Rủi Ro</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-sage" />
                    <span className="text-moss/70">Giảm Rủi Ro</span>
                </div>
            </div>
        </div>
    );
};

export default BubbleChart;
