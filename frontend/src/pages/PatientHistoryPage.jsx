import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, User, Heart, Search, Users, Loader2, Plus, UserPlus, FilePlus } from 'lucide-react';
import WavyTimeline from '../components/WavyTimeline';
import FluidEKGChart from '../components/FluidEKGChart';
import HealthBlob from '../components/HealthBlob';
import MedicalDocumentsGrid from '../components/MedicalDocumentsGrid';
import AddPatientModal from '../components/AddPatientModal';
import AddEventModal from '../components/AddEventModal';
import {
    fetchPatients,
    fetchPatientHistory,
    fetchPatientEKG,
    fetchPatientDocuments,
    createPatient,
    createMedicalEvent
} from '../services/api';

// Patient Selection Component
const PatientSelector = ({ patients, onSelect, searchQuery, onSearchChange }) => {
    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'bg-clay/20 text-clay border-clay/30';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'low': return 'bg-sage/20 text-sage border-sage/30';
            default: return 'bg-sand text-moss border-sand';
        }
    };

    const getRiskLabel = (level) => {
        switch (level) {
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'N/A';
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage/20 mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Users size={40} className="text-sage" />
                </motion.div>
                <h1 className="text-2xl font-bold text-moss mb-2">Chọn bệnh nhân</h1>
                <p className="text-moss/60">Vui lòng chọn bệnh nhân để xem lịch sử bệnh án</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-moss/40" />
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc mã bệnh nhân..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-sage/20 text-moss placeholder:text-moss/40 focus:outline-none focus:border-sage/50 transition-colors"
                    style={{ borderRadius: '30px' }}
                />
            </div>

            {/* Patient Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPatients.map((patient, index) => (
                    <motion.button
                        key={patient.id}
                        onClick={() => onSelect(patient)}
                        className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm border-2 border-transparent hover:border-sage/30 shadow-md hover:shadow-lg transition-all text-left group"
                        style={{ borderRadius: '25px 10px 25px 10px' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sage/30 to-moss/20 flex items-center justify-center flex-shrink-0 group-hover:from-sage/50 group-hover:to-moss/30 transition-all">
                            <User size={24} className="text-moss" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-moss truncate">{patient.name}</p>
                            <p className="text-sm text-moss/60">
                                {patient.age} tuổi • {patient.gender} • {patient.id}
                            </p>
                        </div>

                        {/* Risk Badge */}
                        <span className={`px-3 py-1 text-xs font-medium border rounded-full ${getRiskColor(patient.riskLevel)}`}>
                            {getRiskLabel(patient.riskLevel)}
                        </span>
                    </motion.button>
                ))}
            </div>

            {filteredPatients.length === 0 && (
                <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-moss/50">Không tìm thấy bệnh nhân nào</p>
                </motion.div>
            )}
        </motion.div>
    );
};

const PatientHistoryPage = ({ patient: patientProp, onBack }) => {
    const [selectedPatient, setSelectedPatient] = useState(patientProp);
    const [searchQuery, setSearchQuery] = useState('');

    // API Data States
    const [patients, setPatients] = useState([]);
    const [events, setEvents] = useState([]);
    const [ekgData, setEkgData] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Loading States
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState(null);

    // Fetch patients list on mount
    useEffect(() => {
        const loadPatients = async () => {
            try {
                setLoadingPatients(true);
                const data = await fetchPatients();
                setPatients(data);
            } catch (err) {
                console.error('Error loading patients:', err);
                setError('Không thể tải danh sách bệnh nhân');
            } finally {
                setLoadingPatients(false);
            }
        };
        loadPatients();
    }, []);

    // Fetch patient data when selected
    useEffect(() => {
        if (!selectedPatient) return;

        const loadPatientData = async () => {
            try {
                setLoadingData(true);
                const [historyData, ekgResult, docsData] = await Promise.all([
                    fetchPatientHistory(selectedPatient.id),
                    fetchPatientEKG(selectedPatient.id),
                    fetchPatientDocuments(selectedPatient.id)
                ]);
                setEvents(historyData);
                setEkgData(ekgResult);
                setDocuments(docsData);
            } catch (err) {
                console.error('Error loading patient data:', err);
                setError('Không thể tải dữ liệu bệnh nhân');
            } finally {
                setLoadingData(false);
            }
        };
        loadPatientData();
    }, [selectedPatient]);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
    };

    const handleDeselectPatient = () => {
        setSelectedPatient(null);
        setSearchQuery('');
    };

    // Modal States
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [showAddEventModal, setShowAddEventModal] = useState(false);

    // Reload patients list
    const reloadPatients = async () => {
        try {
            setLoadingPatients(true);
            const data = await fetchPatients();
            setPatients(data);
        } catch (err) {
            console.error('Error reloading patients:', err);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Reload patient events
    const reloadEvents = async () => {
        if (!selectedPatient) return;
        try {
            const historyData = await fetchPatientHistory(selectedPatient.id);
            setEvents(historyData);
        } catch (err) {
            console.error('Error reloading events:', err);
        }
    };

    // Handle create patient
    const handleCreatePatient = async (patientData) => {
        const newPatient = await createPatient(patientData);
        await reloadPatients();
        // Auto-select the new patient
        setSelectedPatient(newPatient);
    };

    // Handle create event
    const handleCreateEvent = async (eventData) => {
        await createMedicalEvent(selectedPatient.id, eventData);
        await reloadEvents();
    };

    // If no patient selected, show patient selection screen
    if (!selectedPatient) {
        return (
            <div className="max-w-7xl mx-auto pb-8">
                {/* Header */}
                <motion.header
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <motion.button
                                onClick={onBack}
                                className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <ArrowLeft size={20} className="text-moss" />
                            </motion.button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-moss flex items-center gap-2">
                                <Heart size={28} className="text-clay" />
                                Lịch sử bệnh án
                            </h1>
                            <p className="text-moss/60 text-sm mt-1">
                                Theo dõi hành trình sức khỏe
                            </p>
                        </div>
                    </div>
                    {/* Add Patient Button */}
                    <motion.button
                        onClick={() => setShowAddPatientModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Thêm Bệnh Nhân</span>
                    </motion.button>
                </motion.header>

                {loadingPatients ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-sage" />
                        <span className="ml-3 text-moss/60">Đang tải danh sách bệnh nhân...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-clay">
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-sage text-white rounded-full"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <PatientSelector
                        patients={patients}
                        onSelect={handlePatientSelect}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                )}

                {/* Modals */}
                <AddPatientModal
                    isOpen={showAddPatientModal}
                    onClose={() => setShowAddPatientModal(false)}
                    onSubmit={handleCreatePatient}
                />
            </div>
        );
    }

    // Patient history view
    return (
        <div className="max-w-7xl mx-auto pb-8">
            {/* Header */}
            <motion.header
                className="flex items-center justify-between mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={handleDeselectPatient}
                        className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ArrowLeft size={20} className="text-moss" />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold text-moss flex items-center gap-2">
                            <Heart size={28} className="text-clay" />
                            Lịch sử bệnh án
                        </h1>
                        <p className="text-moss/60 text-sm mt-1">
                            Theo dõi hành trình sức khỏe
                        </p>
                    </div>
                </div>

                {/* Patient Info Card */}
                <motion.div
                    className="flex items-center gap-4 px-6 py-3 bg-white/70 backdrop-blur-sm shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ borderRadius: '30px 12px 30px 12px' }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={handleDeselectPatient}
                    title="Click để chọn bệnh nhân khác"
                >
                    <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
                        <User size={24} className="text-sage" />
                    </div>
                    <div>
                        <p className="font-semibold text-moss">{selectedPatient.name}</p>
                        <p className="text-xs text-moss/60">
                            {selectedPatient.age} tuổi • {selectedPatient.id}
                        </p>
                    </div>
                </motion.div>
            </motion.header>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key="history-content"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    style={{ minHeight: '70vh' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Left Column - Timeline */}
                    <motion.div
                        className="lg:col-span-1 flex flex-col"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div
                            className="bg-white/40 backdrop-blur-sm p-6 shadow-lg flex-1 flex flex-col"
                            style={{
                                borderRadius: '30px 15px 30px 15px',
                                maxHeight: '80vh',
                            }}
                        >
                            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                                <h2 className="text-lg font-semibold text-moss flex items-center gap-2">
                                    <Calendar size={20} />
                                    Dòng thời gian sức khỏe
                                </h2>
                                <motion.button
                                    onClick={() => setShowAddEventModal(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-clay/20 text-clay rounded-full text-sm hover:bg-clay/30 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <FilePlus size={14} />
                                    Thêm
                                </motion.button>
                            </div>
                            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                                {loadingData ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-sage" />
                                    </div>
                                ) : (
                                    <WavyTimeline events={events} />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - EKG, Health Blob, Documents */}
                    <motion.div
                        className="lg:col-span-2 flex flex-col"
                        style={{ maxHeight: '80vh' }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        {/* Top Row - EKG and Health Blob */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-shrink-0">
                            {/* EKG Chart */}
                            <div className="md:col-span-2">
                                <FluidEKGChart
                                    data={ekgData}
                                    normalMin={60}
                                    normalMax={100}
                                />
                            </div>

                            {/* Health Blob */}
                            <div
                                className="flex items-center justify-center p-6 bg-white/40 backdrop-blur-sm shadow-lg"
                                style={{ borderRadius: '15px 30px 15px 30px' }}
                            >
                                <HealthBlob healthScore={selectedPatient.healthScore ?? 68} size={140} />
                            </div>
                        </div>

                        {/* Documents Grid - Flexible height with scroll */}
                        <motion.div
                            className="bg-white/40 backdrop-blur-sm p-6 shadow-lg flex-1 flex flex-col min-h-0"
                            style={{ borderRadius: '15px 30px 15px 30px' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loadingData ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-sage" />
                                    </div>
                                ) : (
                                    <MedicalDocumentsGrid documents={documents} />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Modals */}
            <AddPatientModal
                isOpen={showAddPatientModal}
                onClose={() => setShowAddPatientModal(false)}
                onSubmit={handleCreatePatient}
            />
            <AddEventModal
                isOpen={showAddEventModal}
                onClose={() => setShowAddEventModal(false)}
                onSubmit={handleCreateEvent}
                patientName={selectedPatient?.name}
            />
        </div>
    );
};

export default PatientHistoryPage;
