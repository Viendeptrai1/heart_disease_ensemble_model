import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/**
 * MetricStoneCard - Asymmetrical stone-shaped metric card with mini sparkline
 */
const MetricStoneCard = ({
    title,
    value,
    unit = '%',
    sparklineData = [],
    color = 'sage',
    index = 0,
}) => {
    // Stone-like border radius variations
    const stoneShapes = [
        '40% 60% 70% 30% / 50% 40% 60% 50%',
        '60% 40% 30% 70% / 40% 60% 50% 50%',
        '50% 50% 60% 40% / 70% 30% 50% 50%',
        '30% 70% 50% 50% / 60% 40% 40% 60%',
    ];

    const colorMap = {
        sage: {
            bg: 'from-sage/20 to-sage/5',
            text: 'text-sage',
            stroke: '#87986A',
            fill: 'rgba(135, 152, 106, 0.3)',
        },
        clay: {
            bg: 'from-clay/20 to-clay/5',
            text: 'text-clay',
            stroke: '#D57E5F',
            fill: 'rgba(213, 126, 95, 0.3)',
        },
        moss: {
            bg: 'from-moss/20 to-moss/5',
            text: 'text-moss',
            stroke: '#4E5B44',
            fill: 'rgba(78, 91, 68, 0.3)',
        },
    };

    const colors = colorMap[color] || colorMap.sage;
    const shapeIndex = index % stoneShapes.length;

    return (
        <motion.div
            className={`relative p-6 bg-gradient-to-br ${colors.bg} backdrop-blur-sm shadow-lg overflow-hidden`}
            style={{ borderRadius: stoneShapes[shapeIndex] }}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: index * 0.1,
                type: 'spring',
                stiffness: 200,
                damping: 20,
            }}
            whileHover={{
                y: -5,
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(135, 152, 106, 0.2)',
            }}
        >
            {/* Background sparkline */}
            <div className="absolute inset-0 opacity-40">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={colors.stroke}
                            strokeWidth={2}
                            fill={`url(#gradient-${index})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <p className="text-sm font-medium text-moss/70 mb-2">{title}</p>
                <div className="flex items-baseline gap-1">
                    <motion.span
                        className={`text-4xl font-bold ${colors.text}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                    >
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </motion.span>
                    <span className="text-xl text-moss/50">{unit}</span>
                </div>
            </div>

            {/* Decorative blob */}
            <motion.div
                className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-20"
                style={{ backgroundColor: colors.stroke }}
                animate={{
                    scale: [1, 1.2, 1],
                    borderRadius: ['50%', '40% 60% 50% 50%', '50%'],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </motion.div>
    );
};

export default MetricStoneCard;
