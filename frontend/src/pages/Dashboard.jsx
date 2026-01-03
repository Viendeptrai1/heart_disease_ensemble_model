import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import Hero from '../components/Hero';
import PerformanceStats from '../components/PerformanceStats';
import WavyDivider from '../components/WavyDivider';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorToast from '../components/ErrorToast';
import AddPatientWithAIModal from '../components/AddPatientWithAIModal';
import { fetchPatientRisks, calculateMetrics, createPatient } from '../services/api';

const Dashboard = ({ onPatientClick }) => {
    const [showError, setShowError] = useState(false);
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const queryClient = useQueryClient();

    const { data: patients, isLoading, error } = useQuery({
        queryKey: ['patientRisks'],
        queryFn: fetchPatientRisks,
        onError: () => {
            setShowError(true);
        },
    });

    const metrics = patients ? calculateMetrics(patients) : null;

    // Handle adding new patient
    const handleAddPatient = async (patientData) => {
        try {
            await createPatient(patientData);
            // Refresh patients list
            queryClient.invalidateQueries(['patientRisks']);
            queryClient.invalidateQueries(['patients']);
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    };

    return (
        <>
            {showError && error && (
                <ErrorToast
                    message="Không thể kết nối với backend. Vui lòng kiểm tra server đang chạy."
                    onClose={() => setShowError(false)}
                />
            )}

            <div className="max-w-7xl mx-auto space-y-2">
                {/* Add Patient Button */}
                <div className="px-4 flex justify-end mb-4">
                    <motion.button
                        onClick={() => setShowAddPatientModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-sage text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <UserPlus size={20} />
                        <span>Thêm Bệnh Nhân Mới</span>
                    </motion.button>
                </div>

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <Hero patients={patients} isLoading={isLoading} error={error} onPatientClick={onPatientClick} />

                        <WavyDivider />

                        <PerformanceStats metrics={metrics} />
                    </>
                )}
            </div>

            {/* Add Patient Modal with AI Evaluation */}
            <AddPatientWithAIModal
                isOpen={showAddPatientModal}
                onClose={() => setShowAddPatientModal(false)}
                onSubmit={handleAddPatient}
            />
        </>
    );
};

export default Dashboard;
