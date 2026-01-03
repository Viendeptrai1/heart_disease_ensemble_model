import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WavyTimeline = ({ events = [] }) => {
    const [expandedEvent, setExpandedEvent] = useState(null);

    // Generate wavy river path
    const generateRiverPath = (height) => {
        const segments = 8;
        const segmentHeight = height / segments;
        let path = 'M 100 0';

        for (let i = 1; i <= segments; i++) {
            const y = i * segmentHeight;
            const xOffset = i % 2 === 0 ? 30 : -30;
            const controlY1 = y - segmentHeight * 0.6;
            const controlY2 = y - segmentHeight * 0.4;
            path += ` C ${100 + xOffset / 2} ${controlY1}, ${100 + xOffset} ${controlY2}, ${100 + xOffset / 3} ${y}`;
        }
        return path;
    };

    const timelineHeight = events && Array.isArray(events) ? Math.max(events.length * 150, 600) : 600;
    const safeHeight = isNaN(timelineHeight) ? 600 : timelineHeight;
    const rawRiverPath = generateRiverPath(safeHeight);
    // Ensure path is valid
    const riverPath = (rawRiverPath && rawRiverPath.startsWith('M')) ? rawRiverPath : 'M 100 0 L 100 600';

    const handleEventClick = (eventId) => {
        setExpandedEvent(expandedEvent === eventId ? null : eventId);
    };

    return (
        <div className="relative w-full" style={{ height: `${timelineHeight}px` }}>
            {/* SVG River */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 200 ${timelineHeight}`}
                preserveAspectRatio="xMidYMid slice"
            >
                {/* Animated gradient for flow effect */}
                <defs>
                    <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#87986A" stopOpacity="0.3">
                            <animate attributeName="offset" values="0%;50%;0%" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" stopColor="#87986A" stopOpacity="0.6">
                            <animate attributeName="offset" values="50%;100%;50%" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#87986A" stopOpacity="0.3">
                            <animate attributeName="offset" values="100%;150%;100%" dur="4s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    {/* Flow texture filter */}
                    <filter id="flowTexture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3">
                            <animate attributeName="seed" values="0;100;0" dur="8s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" scale="3" />
                    </filter>
                </defs>

                {/* River shadow */}
                {riverPath && riverPath.startsWith('M') && (
                    <motion.path
                        d={riverPath}
                        initial={{ d: riverPath, pathLength: 0 }}
                        animate={{ d: riverPath, pathLength: 1 }}
                        fill="none"
                        stroke="rgba(135, 152, 106, 0.15)"
                        strokeWidth="35"
                        strokeLinecap="round"
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />
                )}

                {/* Main river */}
                {riverPath && riverPath.startsWith('M') && (
                    <motion.path
                        d={riverPath}
                        initial={{ d: riverPath, pathLength: 0 }}
                        animate={{ d: riverPath, pathLength: 1 }}
                        fill="none"
                        stroke="url(#riverGradient)"
                        strokeWidth="20"
                        strokeLinecap="round"
                        filter="url(#flowTexture)"
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />
                )}

                {/* River highlight */}
                {riverPath && riverPath.startsWith('M') && (
                    <motion.path
                        d={riverPath}
                        initial={{ d: riverPath, pathLength: 0 }}
                        animate={{ d: riverPath, pathLength: 1 }}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
                    />
                )}
            </svg>

            {/* Event Nodes (Stones) */}
            <div className="absolute inset-0">
                {events.map((event, index) => {
                    const yPosition = (index + 0.5) * 150;
                    const xOffset = index % 2 === 0 ? -60 : 60;
                    const isExpanded = expandedEvent === event.id;

                    return (
                        <motion.div
                            key={event.id}
                            className="absolute"
                            style={{
                                top: yPosition,
                                left: `calc(50% + ${xOffset}px)`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.15, type: "spring", stiffness: 200 }}
                        >
                            {/* Stone Node */}
                            <motion.button
                                onClick={() => handleEventClick(event.id)}
                                className="relative w-16 h-14 flex items-center justify-center cursor-pointer focus:outline-none"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-sand to-white shadow-lg"
                                    style={{
                                        borderRadius: event.type === 'hospitalization'
                                            ? '60% 40% 50% 50% / 50% 60% 40% 50%'
                                            : event.type === 'medication'
                                                ? '50% 50% 40% 60% / 60% 40% 50% 50%'
                                                : '55% 45% 45% 55% / 45% 55% 55% 45%',
                                        border: `3px solid ${event.severity === 'high' ? '#D57E5F' : '#87986A'}`,
                                    }}
                                />
                                <span className="relative z-10 text-xl">
                                    {event.type === 'hospitalization' ? '🏥' :
                                        event.type === 'medication' ? '💊' :
                                            event.type === 'test' ? '🔬' :
                                                event.type === 'surgery' ? '🩺' : '📋'}
                                </span>
                            </motion.button>

                            {/* Date Label */}
                            <motion.div
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-moss/70 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + index * 0.15 }}
                            >
                                {event.date}
                            </motion.div>

                            {/* Expanded Bubble */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        className="absolute z-20 w-64 p-4 bg-white/95 backdrop-blur-sm shadow-xl"
                                        style={{
                                            borderRadius: '30px 10px 30px 10px',
                                            left: xOffset > 0 ? '-280px' : '80px',
                                            top: '-20px',
                                        }}
                                        initial={{ opacity: 0, scale: 0.8, x: xOffset > 0 ? 20 : -20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: xOffset > 0 ? 20 : -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    >
                                        <h4 className="text-moss font-semibold text-sm mb-1">{event.title}</h4>
                                        <p className="text-moss/70 text-xs leading-relaxed">{event.description}</p>
                                        {event.doctor && (
                                            <p className="text-sage text-xs mt-2">👨‍⚕️ {event.doctor}</p>
                                        )}
                                        {/* Bubble tail */}
                                        <div
                                            className="absolute w-4 h-4 bg-white/95 transform rotate-45"
                                            style={{
                                                [xOffset > 0 ? 'right' : 'left']: '-6px',
                                                top: '28px',
                                                borderRadius: '2px',
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default WavyTimeline;
