import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="relative w-32 h-32">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="absolute w-12 h-12 bg-clay/70 rounded-full gooey"
                        style={{
                            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                        }}
                        animate={{
                            x: [0, 20, 0],
                            y: [0, -10, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: index * 0.3,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
                <p className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-moss/80 text-sm font-medium">
                    Đang tải dữ liệu...
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
