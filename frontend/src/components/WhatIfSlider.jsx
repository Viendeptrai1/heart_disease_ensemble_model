import React from 'react';
import { motion } from 'framer-motion';

/**
 * WhatIfSlider - Organic styled range input for simulation
 * Custom thick rounded track with bubble-shaped thumb
 */
const WhatIfSlider = ({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    unit = '',
    onChange,
    color = 'sage', // 'sage' | 'clay'
}) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const colorClasses = color === 'clay'
        ? { track: 'bg-clay', thumb: 'bg-clay', glow: 'shadow-clay/50' }
        : { track: 'bg-sage', thumb: 'bg-sage', glow: 'shadow-sage/50' };

    return (
        <div className="w-full">
            {/* Label Row */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-moss font-semibold text-sm">{label}</span>
                <motion.span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${colorClasses.track} text-sand`}
                    key={value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                    style={{ borderRadius: '2rem' }}
                >
                    {value}{unit}
                </motion.span>
            </div>

            {/* Slider Container */}
            <div className="relative h-8 flex items-center">
                {/* Track Background */}
                <div
                    className="absolute w-full h-4 bg-sand/50 backdrop-blur-sm"
                    style={{
                        borderRadius: '2rem',
                        boxShadow: 'inset 0 2px 8px rgba(78, 91, 68, 0.1)'
                    }}
                />

                {/* Filled Track */}
                <motion.div
                    className={`absolute h-4 ${colorClasses.track}`}
                    style={{
                        width: `${percentage}%`,
                        borderRadius: '2rem',
                        boxShadow: `0 2px 10px ${color === 'clay' ? 'rgba(213, 126, 95, 0.4)' : 'rgba(135, 152, 106, 0.4)'}`
                    }}
                    initial={false}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />

                {/* Track Wave Decoration */}
                <svg
                    className="absolute w-full h-full pointer-events-none opacity-20"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                >
                    <motion.path
                        d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10"
                        fill="none"
                        stroke={color === 'clay' ? '#D57E5F' : '#87986A'}
                        strokeWidth="1"
                        animate={{
                            d: [
                                "M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10",
                                "M0,10 Q10,15 20,10 T40,10 T60,10 T80,10 T100,10",
                                "M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10",
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </svg>

                {/* Invisible Range Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                    style={{ margin: 0 }}
                />

                {/* Custom Thumb */}
                <motion.div
                    className={`absolute w-7 h-7 ${colorClasses.thumb} ${colorClasses.glow} shadow-lg`}
                    style={{
                        left: `calc(${percentage}% - 14px)`,
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        transform: 'rotate(-10deg)',
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                >
                    {/* Thumb Highlight */}
                    <div
                        className="absolute top-1 left-1 w-2 h-2 bg-white/40 rounded-full"
                    />
                </motion.div>
            </div>

            {/* Min/Max Labels */}
            <div className="flex justify-between mt-2 text-xs text-moss/50">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

export default WhatIfSlider;
