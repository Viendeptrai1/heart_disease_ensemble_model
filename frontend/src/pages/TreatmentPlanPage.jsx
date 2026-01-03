import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { fetchPatients, fetchTreatments, saveTreatmentPlan } from '../services/api';

// Initial Notes Data
const initialNotes = [
    { id: 'note1', text: 'Theo dõi huyết áp hàng ngày', x: 30, y: 30, color: 'sage' },
    { id: 'note2', text: 'Tái khám sau 2 tuần', x: 200, y: 30, color: 'clay' },
];

/* ============================================
   DRAGGABLE PROTOCOL CARD COMPONENT
   ============================================ */
const ProtocolCard = ({ treatment, isDragging }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: treatment.id,
        data: treatment,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const categoryColor = treatment.category === 'critical' ? 'bg-clay' : 'bg-sage';

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                flex-shrink-0 w-28 h-44 ${categoryColor} text-sand
                flex flex-col items-center justify-center gap-2 p-4
                cursor-grab active:cursor-grabbing
                shadow-lg hover:shadow-xl transition-shadow
                ${isDragging ? 'opacity-50' : 'opacity-100'}
            `}
            css={{
                borderRadius: '50% / 30%',
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            <span className="text-3xl">{treatment.icon}</span>
            <span className="text-xs font-bold text-center leading-tight">{treatment.name}</span>
            <span className="text-[10px] opacity-70">{treatment.type}</span>
        </motion.div>
    );
};

/* ============================================
   ACTIVE PLAN DROP ZONE COMPONENT
   ============================================ */
const ActivePlanDropZone = ({ activePlan, onRemove }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'active-plan-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                relative min-h-[300px] p-8
                transition-all duration-300 overflow-hidden
                ${isOver ? 'ring-4 ring-sage/50' : ''}
            `}
            style={{
                borderRadius: '40% 60% 60% 40% / 30% 30% 70% 70%',
                background: 'linear-gradient(145deg, #e8e5e0, #ffffff)',
                boxShadow: `
                    inset 8px 8px 16px rgba(78, 91, 68, 0.15),
                    inset -8px -8px 16px rgba(255, 255, 255, 0.9)
                `,
            }}
        >
            {/* Water Texture Background */}
            <svg
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                preserveAspectRatio="none"
            >
                <defs>
                    <pattern id="water-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <motion.path
                            d="M0,50 Q25,30 50,50 T100,50 T150,50"
                            fill="none"
                            stroke="#87986A"
                            strokeWidth="2"
                            animate={{
                                d: [
                                    "M0,50 Q25,30 50,50 T100,50 T150,50",
                                    "M0,50 Q25,70 50,50 T100,50 T150,50",
                                    "M0,50 Q25,30 50,50 T100,50 T150,50",
                                ]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M0,70 Q25,50 50,70 T100,70 T150,70"
                            fill="none"
                            stroke="#87986A"
                            strokeWidth="1.5"
                            animate={{
                                d: [
                                    "M0,70 Q25,50 50,70 T100,70 T150,70",
                                    "M0,70 Q25,90 50,70 T100,70 T150,70",
                                    "M0,70 Q25,50 50,70 T100,70 T150,70",
                                ]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#water-pattern)" />
            </svg>

            {/* Drop Zone Label */}
            <div className="text-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-moss/70">Kế Hoạch Điều Trị</h3>
                <p className="text-sm text-moss/50">Kéo thả phác đồ vào đây</p>
            </div>

            {/* Active Plan Items */}
            <div className="flex flex-wrap gap-4 justify-center relative z-10">
                <AnimatePresence mode="popLayout">
                    {activePlan.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-moss/40 text-sm py-12"
                        >
                            Chưa có phác đồ nào được chọn
                        </motion.div>
                    ) : (
                        activePlan.map((treatment) => (
                            <motion.div
                                key={treatment.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    }
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.05 }}
                                layout
                                className={`
                                    relative w-24 h-36 flex flex-col items-center justify-center gap-2 p-3
                                    text-sand cursor-pointer
                                    ${treatment.category === 'critical' ? 'bg-clay' : 'bg-sage'}
                                `}
                                style={{ borderRadius: '50% / 30%' }}
                                onClick={() => onRemove(treatment.id)}
                            >
                                {/* Ripple effect indicator */}
                                <motion.div
                                    className="absolute inset-0 bg-white/30"
                                    style={{ borderRadius: '50% / 30%' }}
                                    initial={{ scale: 0.8, opacity: 0.5 }}
                                    animate={{ scale: 1.2, opacity: 0 }}
                                    transition={{ duration: 0.6 }}
                                />
                                <span className="text-2xl relative z-10">{treatment.icon}</span>
                                <span className="text-[10px] font-bold text-center leading-tight relative z-10">
                                    {treatment.name}
                                </span>
                                <motion.span
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-moss text-sand rounded-full text-xs flex items-center justify-center"
                                    whileHover={{ scale: 1.2 }}
                                >
                                    ✕
                                </motion.span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ============================================
   GOOEY NOTE COMPONENT
   ============================================ */
const GooeyNote = ({ note, onDrag, allNotes, containerBounds, containerRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const noteRef = React.useRef(null);

    // Clamp position within container bounds
    const clampPosition = (x, y) => {
        const noteSize = 80; // w-20 h-20 = 80px
        const padding = 8;
        const minX = padding;
        const maxX = Math.max(padding, containerBounds.width - noteSize - padding);
        const minY = padding;
        const maxY = Math.max(padding, containerBounds.height - noteSize - padding);

        return {
            x: Math.max(minX, Math.min(maxX, x)),
            y: Math.max(minY, Math.min(maxY, y)),
        };
    };

    // Check if this note is close to another note
    const isNearOther = allNotes.some(other => {
        if (other.id === note.id) return false;
        const dx = note.x - other.x;
        const dy = note.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 80;
    });

    const bgColor = note.color === 'clay' ? 'bg-clay' : 'bg-sage';

    return (
        <motion.div
            ref={noteRef}
            key={note.id}
            className={`
                absolute w-20 h-20 ${bgColor} text-sand
                flex items-center justify-center p-2 text-[10px] text-center
                cursor-grab active:cursor-grabbing font-medium
                ${isNearOther ? 'scale-110' : ''}
            `}
            style={{
                left: note.x,
                top: note.y,
                borderRadius: '50%',
                filter: isNearOther ? 'url(#gooey)' : 'none',
                zIndex: isDragging ? 100 : 10,
                touchAction: 'none',
            }}
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={containerRef}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
                setIsDragging(false);
                // Calculate new position based on current position + offset
                const rawX = note.x + info.offset.x;
                const rawY = note.y + info.offset.y;
                const clamped = clampPosition(rawX, rawY);
                onDrag(note.id, clamped.x, clamped.y);
            }}
            whileHover={{ scale: 1.1 }}
            animate={{
                scale: isDragging ? 1.15 : isNearOther ? 1.1 : 1,
                x: 0,
                y: 0,
            }}
            transition={{
                x: { duration: 0 },
                y: { duration: 0 },
            }}
        >
            {note.text}
        </motion.div>
    );
};

/* ============================================
   COLLABORATIVE NOTES SECTION
   ============================================ */
const CollaborativeNotes = ({ notes, onUpdateNote, onAddNote }) => {
    const [newNoteText, setNewNoteText] = useState('');
    const containerRef = React.useRef(null);
    const [containerBounds, setContainerBounds] = useState({ width: 600, height: 350 });

    // Update container bounds on mount and resize
    useEffect(() => {
        const updateBounds = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerBounds({ width: rect.width, height: rect.height });
            }
        };
        updateBounds();
        window.addEventListener('resize', updateBounds);
        return () => window.removeEventListener('resize', updateBounds);
    }, []);

    // Find a position that doesn't overlap with existing notes (deterministic)
    const findNonOverlappingPosition = (existingNotes, maxX, maxY) => {
        const noteSize = 80;
        const minDistance = 100; // Minimum distance between notes to prevent overlap
        const padding = 16;
        const maxAttempts = 50;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Use deterministic positions based on attempt number
            const angle = (attempt * 137.5) * (Math.PI / 180); // Golden angle for good distribution
            const radius = 50 + attempt * 15;
            const centerX = (maxX - padding) / 2;
            const centerY = (maxY - padding) / 2;
            const x = Math.max(padding, Math.min(maxX - padding, centerX + Math.cos(angle) * radius));
            const y = Math.max(padding, Math.min(maxY - padding, centerY + Math.sin(angle) * radius));

            // Check if this position overlaps with any existing note
            const hasOverlap = existingNotes.some(note => {
                const dx = x - note.x;
                const dy = y - note.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < minDistance;
            });

            if (!hasOverlap) {
                return { x, y };
            }
        }

        // If no non-overlapping position found, use grid-based positioning
        const gridCols = Math.floor((maxX - padding) / minDistance);
        const noteIndex = existingNotes.length;
        const col = noteIndex % Math.max(1, gridCols);
        const row = Math.floor(noteIndex / Math.max(1, gridCols));
        return {
            x: padding + col * minDistance,
            y: padding + row * minDistance,
        };
    };

    const handleAddNote = () => {
        if (newNoteText.trim()) {
            // Generate position that doesn't overlap with existing notes
            const noteSize = 80;
            const padding = 16;
            const maxX = Math.max(padding, containerBounds.width - noteSize - padding);
            const maxY = Math.max(padding, containerBounds.height - noteSize - padding);

            const { x, y } = findNonOverlappingPosition(notes, maxX, maxY);

            onAddNote({
                id: `note-${Date.now()}`,
                text: newNoteText,
                x,
                y,
                color: notes.length % 2 === 0 ? 'sage' : 'clay',
            });
            setNewNoteText('');
        }
    };

    return (
        <motion.section
            className="glass p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ borderRadius: '24px' }}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 bg-clay/20 flex items-center justify-center text-xl"
                        style={{ borderRadius: '50%' }}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        📝
                    </motion.div>
                    <div>
                        <h2 className="text-lg font-bold text-moss">Ghi Chú Cộng Tác</h2>
                        <p className="text-sm text-moss/60">Kéo các ghi chú lại gần nhau để nhóm chúng</p>
                    </div>
                </div>

                {/* Note count badge */}
                <div className="px-3 py-1 bg-sage/20 text-sage text-sm font-medium" style={{ borderRadius: '1rem' }}>
                    {notes.length} ghi chú
                </div>
            </div>

            {/* Add Note Input */}
            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Thêm ghi chú mới..."
                    className="flex-1 px-4 py-3 bg-white/70 text-moss placeholder:text-moss/40 outline-none border-2 border-transparent focus:border-sage/30 transition-colors"
                    style={{ borderRadius: '1rem' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <motion.button
                    onClick={handleAddNote}
                    className="px-6 py-3 bg-sage text-sand font-bold flex items-center gap-2"
                    style={{ borderRadius: '1rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span>➕</span>
                    <span>Thêm</span>
                </motion.button>
            </div>

            {/* Notes Container with Gooey Filter */}
            <div
                ref={containerRef}
                className="relative bg-gradient-to-br from-sand/60 to-white/40 border-2 border-dashed border-moss/20"
                style={{
                    borderRadius: '20px',
                    minHeight: '350px',
                    overflow: 'hidden',
                }}
            >
                {/* Grid lines for visual guidance */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #4E5B44 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Empty state */}
                {notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-moss/40">
                        <div className="text-center">
                            <span className="text-4xl block mb-2">📝</span>
                            <span>Thêm ghi chú đầu tiên của bạn</span>
                        </div>
                    </div>
                )}

                {notes.map(note => (
                    <GooeyNote
                        key={note.id}
                        note={note}
                        allNotes={notes}
                        containerBounds={containerBounds}
                        containerRef={containerRef}
                        onDrag={(id, x, y) => onUpdateNote(id, x, y)}
                    />
                ))}
            </div>

            {/* Helper text */}
            <p className="text-xs text-moss/40 mt-3 text-center">
                💡 Kéo ghi chú lại gần nhau để nhóm chúng • Các ghi chú sẽ tự động nằm trong vùng này
            </p>
        </motion.section>
    );
};

/* ============================================
   PATIENT SELECTION CARD
   ============================================ */
const PatientCard = ({ patient, isSelected, onSelect }) => {
    const riskColor = patient.risk === 'high' ? 'bg-clay' : 'bg-sage';
    const riskText = patient.risk === 'high' ? 'Cao' : 'Thấp';

    // Toggle selection - if already selected, deselect it
    const handleClick = () => {
        if (isSelected) {
            onSelect(null); // Deselect
        } else {
            onSelect(patient); // Select
        }
    };

    return (
        <motion.div
            onClick={handleClick}
            className={`
                relative p-4 cursor-pointer transition-all
                ${isSelected ? 'ring-4 ring-clay/50' : ''}
            `}
            style={{
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                background: 'linear-gradient(145deg, #ffffff, #e8e5e0)',
                boxShadow: isSelected
                    ? 'inset 4px 4px 8px rgba(78, 91, 68, 0.2), inset -4px -4px 8px rgba(255, 255, 255, 0.9)'
                    : '4px 4px 12px rgba(78, 91, 68, 0.1), -4px -4px 12px rgba(255, 255, 255, 0.9)',
            }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <motion.div
                    className={`w-14 h-14 ${riskColor} text-sand flex items-center justify-center text-xl font-bold`}
                    style={{ borderRadius: '50%' }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {patient.gender === 'Nam' ? '👨' : '👩'}
                </motion.div>

                {/* Info */}
                <div className="flex-1">
                    <h3 className="font-bold text-moss">{patient.name}</h3>
                    <p className="text-sm text-moss/60">{patient.code} • {patient.age} tuổi</p>
                </div>

                {/* Risk Badge */}
                <div className={`px-3 py-1 ${riskColor} text-sand text-xs font-bold`} style={{ borderRadius: '2rem' }}>
                    Rủi ro {riskText}
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="mt-3">
                <div className="flex justify-between text-xs text-moss/60 mb-1">
                    <span>Độ tin cậy</span>
                    <span>{Math.round(patient.confidence * 100)}%</span>
                </div>
                <div className="h-2 bg-moss/10 overflow-hidden" style={{ borderRadius: '1rem' }}>
                    <motion.div
                        className={`h-full ${riskColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${patient.confidence * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />
                </div>
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-clay text-sand flex items-center justify-center"
                    style={{ borderRadius: '50%' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                >
                    ✓
                </motion.div>
            )}
        </motion.div>
    );
};

/* ============================================
   PATIENT SELECTION SECTION
   ============================================ */
const PatientSelection = ({ patients, selectedPatient, onSelectPatient }) => {
    return (
        <motion.section
            className="glass p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: '20% 80% 80% 20% / 10% 10% 10% 10%' }}
        >
            <div className="flex items-center gap-3 mb-6">
                <motion.div
                    className="w-12 h-12 bg-sage/20 flex items-center justify-center text-2xl"
                    style={{ borderRadius: '50%' }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    👥
                </motion.div>
                <div>
                    <h2 className="text-xl font-bold text-moss">Bước 1: Chọn Bệnh Nhân</h2>
                    <p className="text-sm text-moss/60">Chọn bệnh nhân để lên kế hoạch điều trị</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patients.map(patient => (
                    <PatientCard
                        key={patient.id}
                        patient={patient}
                        isSelected={selectedPatient?.id === patient.id}
                        onSelect={onSelectPatient}
                    />
                ))}
            </div>

            {!selectedPatient && (
                <motion.p
                    className="text-center text-moss/50 mt-6 py-4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    👆 Vui lòng chọn một bệnh nhân để tiếp tục
                </motion.p>
            )}
        </motion.section>
    );
};

/* ============================================
   FLOATING ACTION BUTTON
   ============================================ */
const FloatingActionButton = ({ onClick, disabled }) => {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`
                fixed bottom-8 right-8 w-20 h-20 text-sand font-bold text-sm 
                flex flex-col items-center justify-center gap-1 shadow-xl z-50
                ${disabled ? 'bg-moss/30 cursor-not-allowed' : 'bg-clay cursor-pointer'}
            `}
            style={{
                borderRadius: '60% 40% 50% 50% / 50% 60% 40% 50%',
            }}
            animate={disabled ? {} : {
                y: [0, -8, 0],
                borderRadius: [
                    '60% 40% 50% 50% / 50% 60% 40% 50%',
                    '50% 50% 40% 60% / 60% 50% 50% 40%',
                    '60% 40% 50% 50% / 50% 60% 40% 50%',
                ],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.9 }}
        >
            <span className="text-xl">✓</span>
            <span className="text-[10px]">Hoàn Tất</span>
        </motion.button>
    );
};

/* ============================================
   MAIN TREATMENT PLAN PAGE
   ============================================ */
const TreatmentPlanPage = ({ patient: patientProp, onBack }) => {
    // Patient selection state - use prop or allow manual selection
    const [selectedPatient, setSelectedPatient] = useState(patientProp || null);
    const [suggestions, setSuggestions] = useState([]);
    const [activePlan, setActivePlan] = useState([]);
    const [notes, setNotes] = useState(initialNotes);
    const [activeId, setActiveId] = useState(null);

    // API States
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingTreatments, setLoadingTreatments] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch patients on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingPatients(true);
                setLoadingTreatments(true);
                const [patientsData, treatmentsData] = await Promise.all([
                    fetchPatients(),
                    fetchTreatments()
                ]);
                // Transform patients data to match component expectations
                setPatients(patientsData.map(p => ({
                    ...p,
                    code: p.id,
                    risk: p.riskLevel,
                })));
                setSuggestions(treatmentsData);
            } catch (err) {
                console.error('Error loading data:', err);
            } finally {
                setLoadingPatients(false);
                setLoadingTreatments(false);
            }
        };
        loadData();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);

        if (over?.id === 'active-plan-zone') {
            const treatment = suggestions.find(t => t.id === active.id);
            if (treatment && !activePlan.find(t => t.id === treatment.id)) {
                setActivePlan(prev => [...prev, treatment]);
                setSuggestions(prev => prev.filter(t => t.id !== treatment.id));
            }
        }
    }, [suggestions, activePlan]);

    const handleRemoveFromPlan = useCallback((id) => {
        const treatment = activePlan.find(t => t.id === id);
        if (treatment) {
            setActivePlan(prev => prev.filter(t => t.id !== id));
            setSuggestions(prev => [...prev, treatment]);
        }
    }, [activePlan]);

    const handleUpdateNote = useCallback((id, x, y) => {
        setNotes(prev => prev.map(note =>
            note.id === id ? { ...note, x, y } : note
        ));
    }, []);

    const handleAddNote = useCallback((note) => {
        setNotes(prev => [...prev, note]);
    }, []);

    const handleFinalize = useCallback(async () => {
        if (!selectedPatient) return;

        try {
            setSaving(true);
            const result = await saveTreatmentPlan({
                patient_id: selectedPatient.id,
                treatments: activePlan.map(t => t.id),
                notes: notes,
            });
            alert(result.message);
        } catch (err) {
            console.error('Error saving plan:', err);
            alert('Lỗi khi lưu kế hoạch điều trị');
        } finally {
            setSaving(false);
        }
    }, [activePlan, notes, selectedPatient]);

    const activeTreatment = activeId ? suggestions.find(t => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen pb-24">
                {/* Animated Background */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute -top-1/2 -right-1/4 w-[150%] h-[100%] opacity-10"
                        animate={{
                            x: [0, -50, 0],
                            y: [0, 30, 0],
                            rotate: [0, -5, 0],
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <svg viewBox="0 0 1000 500" className="w-full h-full">
                            <path
                                d="M0,250 Q250,150 500,250 T1000,250 L1000,500 L0,500 Z"
                                fill="#87986A"
                            />
                        </svg>
                    </motion.div>
                    <motion.div
                        className="absolute -bottom-1/4 -left-1/4 w-[150%] h-[100%] opacity-5"
                        animate={{
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                            rotate: [0, 3, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    >
                        <svg viewBox="0 0 1000 500" className="w-full h-full">
                            <path
                                d="M0,100 Q250,200 500,100 T1000,100 L1000,0 L0,0 Z"
                                fill="#D57E5F"
                            />
                        </svg>
                    </motion.div>
                </div>

                {/* Header */}
                <motion.header
                    className="glass mb-8 mx-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderRadius: '0% 40% 40% 0% / 0% 100% 100% 0%' }}
                >
                    <div className="px-8 py-6 flex items-center justify-between">
                        {onBack && (
                            <motion.button
                                onClick={onBack}
                                className="mr-6 p-2 rounded-full hover:bg-moss/10 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg className="w-6 h-6 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </motion.button>
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-moss">Kế Hoạch Điều Trị</h1>
                            <p className="text-sm text-moss/60">Intervention & Treatment Planning</p>
                        </div>

                        {/* Selected Patient Badge */}
                        {selectedPatient && (
                            <motion.div
                                className={`px-4 py-2 mr-4 flex items-center gap-2 ${selectedPatient.risk === 'high' ? 'bg-clay' : 'bg-sage'} text-sand font-bold`}
                                style={{ borderRadius: '2rem' }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                <span>{selectedPatient.gender === 'Nam' ? '👨' : '👩'}</span>
                                <span>{selectedPatient.name}</span>
                                <span className="text-xs opacity-70">({selectedPatient.code})</span>
                            </motion.div>
                        )}

                        <motion.div
                            className="px-6 py-2 bg-sage text-sand font-bold flex items-center gap-2"
                            style={{ borderRadius: '2rem' }}
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span>📋</span>
                            <span>{activePlan.length} phác đồ đã chọn</span>
                        </motion.div>
                    </div>
                </motion.header>

                <div className="px-4">
                    {/* Step 1: Patient Selection */}
                    {loadingPatients ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-sage" />
                            <span className="ml-3 text-moss/60">Đang tải...</span>
                        </div>
                    ) : (
                        <PatientSelection
                            patients={patients}
                            selectedPatient={selectedPatient}
                            onSelectPatient={setSelectedPatient}
                        />
                    )}

                    {/* Step 2: Treatment Planning - Only show when patient is selected */}
                    {selectedPatient ? (
                        <>
                            {/* Protocol Suggestion Cards - Carousel */}
                            <motion.section
                                className="glass p-6 mb-8"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                style={{ borderRadius: '10% 40% 40% 10% / 20% 20% 20% 20%' }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <motion.div
                                        className="w-10 h-10 bg-sage/20 flex items-center justify-center text-xl"
                                        style={{ borderRadius: '50%' }}
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        🎴
                                    </motion.div>
                                    <div>
                                        <h2 className="text-lg font-bold text-moss">Bước 2: Đề Xuất Phác Đồ (Smart Deck)</h2>
                                        <p className="text-sm text-moss/60">Kéo thả vào vùng kế hoạch để thêm</p>
                                    </div>
                                </div>

                                {/* Horizontal Scrollable Carousel */}
                                <div className="overflow-x-auto pb-4 -mx-2 px-2">
                                    <div className="flex gap-4 min-w-max">
                                        {suggestions.map(treatment => (
                                            <ProtocolCard
                                                key={treatment.id}
                                                treatment={treatment}
                                                isDragging={activeId === treatment.id}
                                            />
                                        ))}
                                        {suggestions.length === 0 && (
                                            <div className="text-moss/50 py-8 px-4">
                                                Tất cả phác đồ đã được thêm vào kế hoạch
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.section>

                            {/* Active Plan Drop Zone */}
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <ActivePlanDropZone
                                    activePlan={activePlan}
                                    onRemove={handleRemoveFromPlan}
                                />
                            </motion.section>

                            {/* Collaborative Notes */}
                            <CollaborativeNotes
                                notes={notes}
                                onUpdateNote={handleUpdateNote}
                                onAddNote={handleAddNote}
                            />
                        </>
                    ) : (
                        <motion.div
                            className="glass p-12 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                        >
                            <motion.div
                                className="text-6xl mb-4"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                ⬆️
                            </motion.div>
                            <h3 className="text-xl font-bold text-moss mb-2">Chọn Bệnh Nhân Trước</h3>
                            <p className="text-moss/60">Vui lòng chọn bệnh nhân ở bước 1 để tiếp tục lên kế hoạch điều trị</p>
                        </motion.div>
                    )}
                </div>

                {/* Floating Action Button - Disabled if no patient or no treatments */}
                <FloatingActionButton
                    onClick={handleFinalize}
                    disabled={!selectedPatient || activePlan.length === 0}
                />

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeTreatment && (
                        <motion.div
                            className={`
                                w-28 h-44 flex flex-col items-center justify-center gap-2 p-4
                                text-sand shadow-2xl
                                ${activeTreatment.category === 'critical' ? 'bg-clay' : 'bg-sage'}
                            `}
                            style={{ borderRadius: '50% / 30%' }}
                            initial={{ scale: 1.1, rotate: 5 }}
                            animate={{ scale: 1.15, rotate: 0 }}
                        >
                            <span className="text-3xl">{activeTreatment.icon}</span>
                            <span className="text-xs font-bold text-center leading-tight">{activeTreatment.name}</span>
                            <span className="text-[10px] opacity-70">{activeTreatment.type}</span>
                        </motion.div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default TreatmentPlanPage;
