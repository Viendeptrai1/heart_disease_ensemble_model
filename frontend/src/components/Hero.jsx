import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// Fallback data if no patients provided
const defaultPatients = [
    { id: 1, risk: 'high', name: 'P-042', score: 0.92 },
    { id: 2, risk: 'stable', name: 'P-043', score: 0.12 },
];

const Hero = ({ patients = defaultPatients, isLoading = false, error = null, onPatientClick }) => {
    const containerRef = useRef(null);
    const rotationVelocity = useSpring(0, { stiffness: 50, damping: 20 });
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        let animationFrame;
        const updateRotation = () => {
            const velocity = rotationVelocity.get();
            // Invert velocity if needed to match "move right -> rotate right" natural feel
            // If mouse is right (pos xOffset), velocity is pos. Rotation increases.
            setRotation(prev => prev + velocity * 0.5);
            animationFrame = requestAnimationFrame(updateRotation);
        };
        animationFrame = requestAnimationFrame(updateRotation);
        return () => cancelAnimationFrame(animationFrame);
    }, [rotationVelocity]);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const xOffset = e.clientX - centerX;

        // Sensitivity factor
        rotationVelocity.set(xOffset / 100);
    };

    const handleMouseLeave = () => {
        rotationVelocity.set(0);
    };

    const radius = 320; // Increased from 200 for larger orbit
    const count = patients.length;
    const angleStep = 360 / count;

    return (
        <section className="mb-0 overflow-visible h-[500px]">
            <h1 className="text-3xl font-bold mb-4 text-moss/90 pl-4">Phân loại Ưu tiên</h1>

            <div
                ref={containerRef}
                className="h-full w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ perspective: '1000px' }}
            >
                {/* Carousel scene - centered pivot point */}
                <div
                    style={{
                        width: '1px',
                        height: '1px',
                        transformStyle: 'preserve-3d',
                        transform: `rotateY(${rotation}deg)`,
                    }}
                >
                    {patients.map((patient, i) => {
                        const angle = i * angleStep;
                        // Water drop size - increased to fit more info
                        const dropSize = 160;

                        return (
                            <div
                                key={patient.id}
                                style={{
                                    position: 'absolute',
                                    width: `${dropSize}px`,
                                    height: `${dropSize}px`,
                                    // Center the item on the pivot point
                                    marginLeft: `-${dropSize / 2}px`,
                                    marginTop: `-${dropSize / 2}px`,
                                    // Rotate around Y axis then push out
                                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                <motion.div
                                    className="w-full h-full relative cursor-pointer"
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onPatientClick?.({
                                        id: patient.id || patient.name,
                                        name: patient.displayName || patient.name,
                                        age: patient.age || (40 + (typeof patient.id === 'number' ? patient.id : 1) % 30),
                                        gender: patient.gender || 'Nam',
                                        riskLevel: patient.risk === 'high' ? 'High' : patient.risk === 'medium' ? 'Medium' : 'Low',
                                        confidence: patient.confidence || patient.score,
                                        healthScore: patient.healthScore,
                                        // Pass health metrics for accurate simulation
                                        cholesterol: patient.cholesterol,
                                        gluc: patient.gluc,
                                        smoke: patient.smoke,
                                        alco: patient.alco,
                                        active: patient.active,
                                        age_bin: patient.age_bin,
                                        BMI_Class: patient.BMI_Class,
                                        MAP_Class: patient.MAP_Class,
                                        cluster: patient.cluster,
                                        risk_score: patient.risk_score,
                                    })}
                                    style={{
                                        // Counter-rotate so face always visible
                                        transform: `rotateY(${-angle}deg)`,
                                    }}
                                >
                                    <div
                                        className={`w-full h-full shadow-lg backdrop-blur-md
                                            ${patient.risk === 'high' ? 'bg-clay/90 shadow-clay/40'
                                                : patient.risk === 'medium' ? 'bg-amber-500/90 shadow-amber-500/40'
                                                    : 'bg-sage/90 shadow-sage/40'}
                                        `}
                                        style={{
                                            borderTopLeftRadius: '0%',
                                            borderTopRightRadius: '50%',
                                            borderBottomRightRadius: '50%',
                                            borderBottomLeftRadius: '50%',
                                            transform: 'rotate(45deg)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* Internal content wrapper that counter-rotates */}
                                        <div
                                            className="w-full h-full flex flex-col items-center justify-center"
                                            style={{ transform: 'rotate(-45deg)' }}
                                        >
                                            {/* Content positioned in center of drop */}
                                            <div className="flex flex-col items-center justify-center text-center px-2 space-y-0.5">
                                                {/* Show short ID or name */}
                                                <span className="text-sand font-bold text-xs leading-tight truncate max-w-[80px]">
                                                    {patient.name?.slice(-8) || patient.id}
                                                </span>

                                                {/* Risk Probability % - Use risk_score from best model */}
                                                <div className="bg-sand/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                    <span className="text-sand text-[11px] font-bold">
                                                        {(() => {
                                                            const displayValue = patient.risk_score ?? patient.score ?? patient.confidence ?? 0.5;
                                                            console.log(`[Hero] Patient ${patient.id}: risk_score=${patient.risk_score}, score=${patient.score}, displaying=${displayValue}`);
                                                            return (displayValue * 100).toFixed(2);
                                                        })()}%
                                                    </span>
                                                </div>

                                                {/* Model Name (shortened) */}
                                                <span className="text-sand/80 text-[8px] font-medium leading-tight truncate max-w-[90px]">
                                                    {patient.modelUsed?.split(' ')[0] || 'Stacking'}
                                                </span>

                                                {/* Confidence */}
                                                <div className="flex items-center gap-0.5">
                                                    <span className="text-sand/70 text-[7px]">Tin cậy:</span>
                                                    <span className="text-sand text-[8px] font-semibold">
                                                        {((patient.confidence || 0.5) * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pulsating Glow for High/Medium Risk */}
                                        {patient.risk === 'high' && (
                                            <div className="absolute inset-0 bg-clay rounded-[inherit] -z-10 animate-ping opacity-30" />
                                        )}
                                        {patient.risk === 'medium' && (
                                            <div className="absolute inset-0 bg-amber-500 rounded-[inherit] -z-10 animate-pulse opacity-20" />
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Hero;
