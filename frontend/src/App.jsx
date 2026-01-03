import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import DiagnosticsPage from './pages/DiagnosticsPage';
import TreatmentPlanPage from './pages/TreatmentPlanPage';
import PatientHistoryPage from './pages/PatientHistoryPage';
import AdminPage from './pages/AdminPage';
import TrainingDashboardPage from './pages/TrainingDashboardPage';
import Sidebar from './components/Sidebar';
import GooeyFilter from './components/GooeyFilter';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Navigate to diagnostics page with patient data
  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setCurrentPage('diagnostics');
  };

  // Navigate back to dashboard
  const handleBack = () => {
    setCurrentPage('dashboard');
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-screen bg-sand text-moss font-sans relative selection:bg-sage selection:text-sand">
      <GooeyFilter />
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          if (page === 'dashboard') setSelectedPatient(null);
        }}
      />
      <main className="pl-36 pr-8 py-8 transition-all duration-300">
        {currentPage === 'dashboard' && (
          <Dashboard onPatientClick={handlePatientClick} />
        )}
        {currentPage === 'history' && (
          <PatientHistoryPage
            patient={selectedPatient}
            onBack={handleBack}
          />
        )}
        {currentPage === 'diagnostics' && (
          <DiagnosticsPage
            patient={selectedPatient}
            onBack={handleBack}
          />
        )}
        {currentPage === 'treatment' && (
          <TreatmentPlanPage
            patient={selectedPatient}
            onBack={handleBack}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage />
        )}
        {currentPage === 'training' && (
          <TrainingDashboardPage onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

export default App;
