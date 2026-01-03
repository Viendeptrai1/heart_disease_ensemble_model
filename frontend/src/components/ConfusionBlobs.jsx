import React from 'react';
import { motion } from 'framer-motion';

/**
 * ConfusionBlobs - Organic Confusion Matrix using 4 morphing blobs
 * Replaces traditional 2x2 grid with living blob visualization
 */
const ConfusionBlobs = ({
    trueNegative = 4521,
    falsePositive = 312,
    falseNegative = 298,
    truePositive = 3869,
}) => {
    const total = trueNegative + falsePositive + falseNegative + truePositive;

    // Calculate sizes based on values (min 60px, max 140px)
    const getSize = (value) => {
        if (!total || total === 0) return 60;
        const safeValue = value || 0;
        const ratio = safeValue / total;
        return Math.max(60, Math.min(140, 60 + ratio * 300));
    };

    // Blob configurations
    const blobs = [
        {
            id: 'tn',
            label: 'True Negative',
            shortLabel: 'TN',
            value: trueNegative,
            color: '#87986A', // Sage
            bgClass: 'from-sage/80 to-sage/60',
            position: { top: '10%', left: '15%' },
            size: getSize(trueNegative),
            radiusKeyframes: [
                '60% 40% 50% 50% / 50% 60% 40% 50%',
                '50% 50% 40% 60% / 60% 40% 50% 50%',
                '40% 60% 50% 50% / 50% 50% 60% 40%',
                '55% 45% 45% 55% / 45% 55% 55% 45%',
            ],
        },
        {
            id: 'fp',
            label: 'False Positive',
            shortLabel: 'FP',
            value: falsePositive,
            color: '#E8DFD5', // Sand
            bgClass: 'from-amber-200/80 to-amber-100/60',
            textColor: 'text-amber-800',
            position: { top: '15%', right: '20%' },
            size: getSize(falsePositive),
            radiusKeyframes: [
                '70% 30% 40% 60% / 40% 70% 30% 60%',
                '40% 60% 70% 30% / 60% 30% 70% 40%',
                '50% 50% 30% 70% / 70% 40% 60% 30%',
                '35% 65% 55% 45% / 55% 35% 65% 45%',
            ],
        },
        {
            id: 'fn',
            label: 'False Negative',
            shortLabel: 'FN',
            value: falseNegative,
            color: '#4E5B44', // Moss
            bgClass: 'from-moss/80 to-moss/60',
            position: { bottom: '20%', left: '20%' },
            size: getSize(falseNegative),
            radiusKeyframes: [
                '30% 70% 60% 40% / 60% 30% 70% 40%',
                '60% 40% 30% 70% / 40% 60% 30% 70%',
                '45% 55% 65% 35% / 35% 65% 45% 55%',
                '55% 45% 35% 65% / 65% 35% 55% 45%',
            ],
        },
        {
            id: 'tp',
            label: 'True Positive',
            shortLabel: 'TP',
            value: truePositive,
            color: '#D57E5F', // Clay
            bgClass: 'from-clay/80 to-clay/60',
            position: { bottom: '10%', right: '15%' },
            size: getSize(truePositive),
            radiusKeyframes: [
                '50% 50% 60% 40% / 40% 60% 50% 50%',
                '60% 40% 50% 50% / 50% 50% 40% 60%',
                '45% 55% 55% 45% / 55% 45% 45% 55%',
                '55% 45% 45% 55% / 45% 55% 55% 45%',
            ],
        },
    ];

    // Calculate accuracy and other metrics
    const accuracy = ((truePositive + trueNegative) / total * 100).toFixed(1);
    const precision = (truePositive / (truePositive + falsePositive) * 100).toFixed(1);
    const recall = (truePositive / (truePositive + falseNegative) * 100).toFixed(1);

    return (
        <motion.div
            className="bg-white/50 backdrop-blur-sm p-6 shadow-lg"
            style={{ borderRadius: '15px 30px 15px 30px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-moss flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Confusion Matrix
                </h3>
                <div className="text-sm text-moss/60">
                    Total: <span className="font-semibold text-moss">{total.toLocaleString()}</span>
                </div>
            </div>

            {/* Blobs Container */}
            <div className="relative h-80 mb-6">
                {/* Connection lines (subtle) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#87986A" strokeWidth="1" strokeDasharray="4" />
                    <line x1="30%" y1="30%" x2="30%" y2="70%" stroke="#87986A" strokeWidth="1" strokeDasharray="4" />
                    <line x1="70%" y1="30%" x2="70%" y2="70%" stroke="#87986A" strokeWidth="1" strokeDasharray="4" />
                    <line x1="30%" y1="70%" x2="70%" y2="70%" stroke="#87986A" strokeWidth="1" strokeDasharray="4" />
                </svg>

                {/* Axis Labels */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-moss/50 font-medium">
                    Predicted
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-moss/50 font-medium -rotate-90 origin-center">
                    Actual
                </div>

                {/* Blobs */}
                {blobs.map((blob, index) => (
                    <motion.div
                        key={blob.id}
                        className={`absolute flex flex-col items-center justify-center bg-gradient-to-br ${blob.bgClass} shadow-lg cursor-pointer`}
                        style={{
                            ...blob.position,
                            width: blob.size,
                            height: blob.size,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            borderRadius: blob.radiusKeyframes,
                        }}
                        transition={{
                            scale: { delay: index * 0.1, type: 'spring', stiffness: 200 },
                            opacity: { delay: index * 0.1 },
                            borderRadius: {
                                duration: 4 + index,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            },
                        }}
                        whileHover={{
                            scale: 1.1,
                            zIndex: 10,
                            boxShadow: `0 10px 30px ${blob.color}40`,
                        }}
                    >
                        {/* Value */}
                        <motion.span
                            className={`text-xl font-bold ${blob.textColor || 'text-white'} drop-shadow-md`}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {blob.value.toLocaleString()}
                        </motion.span>
                        {/* Label */}
                        <span className={`text-xs ${blob.textColor || 'text-white/80'} font-medium mt-1`}>
                            {blob.shortLabel}
                        </span>
                    </motion.div>
                ))}

                {/* Center info */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                        <span className="text-xs text-moss/60">Accuracy</span>
                        <p className="text-lg font-bold text-sage">{accuracy}%</p>
                    </div>
                </motion.div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {blobs.map((blob) => (
                    <div key={blob.id} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: blob.color }}
                        />
                        <div>
                            <p className="text-moss font-medium">{blob.label}</p>
                            <p className="text-moss/50">{blob.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Metrics Summary */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-sage/20">
                <div className="text-center">
                    <p className="text-xs text-moss/50">Precision</p>
                    <p className="text-sm font-semibold text-sage">{precision}%</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-moss/50">Recall</p>
                    <p className="text-sm font-semibold text-clay">{recall}%</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-moss/50">Accuracy</p>
                    <p className="text-sm font-semibold text-moss">{accuracy}%</p>
                </div>
            </div>
        </motion.div>
    );
};

export default ConfusionBlobs;
