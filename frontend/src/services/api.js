import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

/**
 * Fetch patient data with risk levels from the database
 * Uses the patient database for consistent data across all pages
 * @returns {Promise} Array of patients with risk info
 */
export const fetchPatientRisks = async () => {
    try {
        // Fetch real patients from database
        const response = await apiClient.get('/patients');

        // Transform to match frontend Hero component format
        return response.data.map((patient) => ({
            id: patient.id,
            name: patient.id, // Use patient ID as display name
            displayName: patient.name, // Keep actual name for other uses
            age: patient.age,
            gender: patient.gender,
            risk: patient.riskLevel, // 'high', 'medium', 'low' from CSV
            score: patient.healthScore / 100, // Convert 0-100 to 0-1
            confidence: patient.confidence,
            healthScore: patient.healthScore,
        }));
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * Predict risk for a single patient using AI model
 * Used when adding new patient - AI evaluates risk based on health metrics
 * @param {Object} patientData - Health metrics matching LifestyleInput schema
 * @returns {Promise} Prediction result with risk_score, risk_level, confidence
 */
export const predictPatientRisk = async (patientData) => {
    try {
        const response = await apiClient.post('/predict/lifestyle', {
            patients: [patientData]
        });

        if (response.data && response.data.length > 0) {
            return response.data[0];
        }
        throw new Error('No prediction result');
    } catch (error) {
        console.error('Prediction API Error:', error);
        throw error;
    }
};

/**
 * Calculate aggregate metrics from patient data
 * @param {Array} patients - Array of patient predictions
 * @returns {Object} Aggregate metrics
 */
export const calculateMetrics = (patients) => {
    if (!patients || patients.length === 0) {
        return {
            modelConfidence: 0,
            accuracy: 0,
            highRiskCount: 0,
            totalCount: 0
        };
    }

    const highRiskPatients = patients.filter(p => p.risk === 'high');
    const avgConfidence = patients.reduce((sum, p) => sum + p.confidence, 0) / patients.length;

    return {
        modelConfidence: avgConfidence,
        accuracy: 0.94, // Could be fetched from backend metrics endpoint
        highRiskCount: highRiskPatients.length,
        totalCount: patients.length
    };
};

/**
 * Fetch SHAP explanation for a clinical patient
 * @param {Object} patientData - Clinical patient data matching ClinicalInput schema
 * @returns {Promise} Object with feature importance values
 */
export const fetchSHAPExplanation = async (patientData) => {
    try {
        const response = await apiClient.post('/explain/shap', patientData);
        return response.data;
    } catch (error) {
        console.error('SHAP API Error:', error);
        throw error;
    }
};

/**
 * Fetch clinical prediction for patients
 * @param {Array} patients - Array of clinical patient data
 * @returns {Promise} Array of predictions
 */
export const fetchClinicalPrediction = async (patients) => {
    try {
        const response = await apiClient.post('/predict/clinical', {
            patients: patients
        });
        return response.data;
    } catch (error) {
        console.error('Clinical API Error:', error);
        throw error;
    }
};

/**
 * Check if backend is available
 * @returns {Promise<boolean>} True if backend is reachable
 */
export const checkBackendHealth = async () => {
    try {
        await apiClient.get('/docs', { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
};

/**
 * Compare predictions from ALL LIFESTYLE models for a single patient
 * Returns results from each model for comparison dialog
 * @param {Object} patientData - Health metrics matching LifestyleInput schema
 * @returns {Promise} Object with all_models array, best_model, and consensus
 */
export const compareAllModels = async (patientData) => {
    try {
        const response = await apiClient.post('/predict/lifestyle/compare', patientData);
        return response.data;
    } catch (error) {
        console.error('Compare Lifestyle Models API Error:', error);
        throw error;
    }
};

/**
 * Compare predictions from ALL CLINICAL models for a single patient
 * Returns results from each clinical model for comparison dialog
 * @param {Object} patientData - Clinical data matching ClinicalInput schema
 * @returns {Promise} Object with all_models array, best_model, and consensus
 */
export const compareClinicalModels = async (patientData) => {
    try {
        const response = await apiClient.post('/predict/clinical/compare', patientData);
        return response.data;
    } catch (error) {
        console.error('Compare Clinical Models API Error:', error);
        throw error;
    }
};

// =============================================================================
// TRAINING / CONTINUOUS LEARNING API
// =============================================================================


/**
 * Fetch training statistics for both lifestyle and clinical data
 * @returns {Promise} Training stats object
 */
export const fetchTrainingStats = async () => {
    try {
        const response = await apiClient.get('/training/stats');
        return response.data;
    } catch (error) {
        console.error('Training Stats API Error:', error);
        throw error;
    }
};

/**
 * Fetch lifestyle examinations
 * @returns {Promise} Array of lifestyle examinations
 */
export const fetchLifestyleExaminations = async () => {
    try {
        const response = await apiClient.get('/examinations/lifestyle');
        return response.data;
    } catch (error) {
        console.error('Lifestyle Examinations API Error:', error);
        throw error;
    }
};

/**
 * Fetch clinical examinations
 * @returns {Promise} Array of clinical examinations
 */
export const fetchClinicalExaminations = async () => {
    try {
        const response = await apiClient.get('/examinations/clinical');
        return response.data;
    } catch (error) {
        console.error('Clinical Examinations API Error:', error);
        throw error;
    }
};

/**
 * Create a lifestyle examination with auto prediction
 * @param {Object} examData - Examination data
 * @returns {Promise} Created examination with prediction
 */
export const createLifestyleExamination = async (examData) => {
    try {
        const response = await apiClient.post('/examinations/lifestyle', examData);
        return response.data;
    } catch (error) {
        console.error('Create Lifestyle Examination API Error:', error);
        throw error;
    }
};

/**
 * Update doctor diagnosis for an examination
 * @param {string} type - 'lifestyle' or 'clinical'
 * @param {number} examId - Examination ID
 * @param {number} diagnosis - 0 or 1
 * @returns {Promise} Updated examination
 */
export const updateExaminationDiagnosis = async (type, examId, diagnosis) => {
    try {
        const response = await apiClient.put(`/examinations/${type}/${examId}/diagnosis`, {
            doctor_diagnosis: diagnosis
        });
        return response.data;
    } catch (error) {
        console.error('Update Diagnosis API Error:', error);
        throw error;
    }
};

/**
 * Export training data for a specific type
 * @param {string} type - 'lifestyle' or 'clinical'
 * @returns {Promise} Training data
 */
export const exportTrainingData = async (type) => {
    try {
        const response = await apiClient.get(`/training/export/${type}`);
        return response.data;
    } catch (error) {
        console.error('Export Training Data API Error:', error);
        throw error;
    }
};


// =============================================================================
// PATIENTS API
// =============================================================================

/**
 * Fetch all patients from the backend
 * @returns {Promise} Array of patients
 */
export const fetchPatients = async () => {
    try {
        const response = await apiClient.get('/patients');
        return response.data;
    } catch (error) {
        console.error('Patients API Error:', error);
        throw error;
    }
};

/**
 * Fetch a single patient by ID
 * @param {string} patientId - Patient ID
 * @returns {Promise} Patient object
 */
export const fetchPatient = async (patientId) => {
    try {
        const response = await apiClient.get(`/patients/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Patient API Error:', error);
        throw error;
    }
};

/**
 * Fetch patient medical history
 * @param {string} patientId - Patient ID
 * @returns {Promise} Array of medical events
 */
export const fetchPatientHistory = async (patientId) => {
    try {
        const response = await apiClient.get(`/patients/${patientId}/history`);
        return response.data;
    } catch (error) {
        console.error('Patient History API Error:', error);
        throw error;
    }
};

/**
 * Fetch patient EKG data (24h)
 * @param {string} patientId - Patient ID
 * @returns {Promise} Array of EKG data points
 */
export const fetchPatientEKG = async (patientId) => {
    try {
        const response = await apiClient.get(`/patients/${patientId}/ekg`);
        return response.data;
    } catch (error) {
        console.error('Patient EKG API Error:', error);
        throw error;
    }
};

/**
 * Fetch patient medical documents
 * @param {string} patientId - Patient ID
 * @returns {Promise} Array of medical documents
 */
export const fetchPatientDocuments = async (patientId) => {
    try {
        const response = await apiClient.get(`/patients/${patientId}/documents`);
        return response.data;
    } catch (error) {
        console.error('Patient Documents API Error:', error);
        throw error;
    }
};

// =============================================================================
// TREATMENTS API
// =============================================================================

/**
 * Fetch available treatment protocols
 * @returns {Promise} Array of treatments
 */
export const fetchTreatments = async () => {
    try {
        const response = await apiClient.get('/treatments');
        return response.data;
    } catch (error) {
        console.error('Treatments API Error:', error);
        throw error;
    }
};

/**
 * Save treatment plan
 * @param {Object} plan - Treatment plan { patient_id, treatments, notes }
 * @returns {Promise} Response with success status
 */
export const saveTreatmentPlan = async (plan) => {
    try {
        const response = await apiClient.post('/treatments/plan', plan);
        return response.data;
    } catch (error) {
        console.error('Save Treatment Plan API Error:', error);
        throw error;
    }
};

// =============================================================================
// ADMIN/METRICS API
// =============================================================================

/**
 * Fetch model performance metrics
 * @param {string} modelKey - Optional model key to get specific model metrics
 * @returns {Promise} Model metrics object
 */
export const fetchModelMetrics = async (modelKey = null) => {
    try {
        const url = modelKey ? `/admin/metrics?model=${modelKey}` : '/admin/metrics';
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        console.error('Model Metrics API Error:', error);
        throw error;
    }
};

/**
 * Fetch status of all models
 * @returns {Promise} Array of model status objects
 */
export const fetchModelsStatus = async () => {
    try {
        const response = await apiClient.get('/admin/models');
        return response.data;
    } catch (error) {
        console.error('Models Status API Error:', error);
        throw error;
    }
};

/**
 * Fetch confusion matrix data
 * @param {string} modelKey - Optional model key to get specific model confusion matrix
 * @returns {Promise} Confusion matrix object
 */
export const fetchConfusionMatrix = async (modelKey = null) => {
    try {
        const url = modelKey ? `/admin/confusion?model=${modelKey}` : '/admin/confusion';
        const response = await apiClient.get(url);
        return response.data;
    } catch (error) {
        console.error('Confusion Matrix API Error:', error);
        throw error;
    }
};

/**
 * Fetch system statistics
 * @returns {Promise} System stats object
 */
export const fetchSystemStats = async () => {
    try {
        const response = await apiClient.get('/admin/stats');
        return response.data;
    } catch (error) {
        console.error('System Stats API Error:', error);
        throw error;
    }
};

// =============================================================================
// CREATE/UPDATE/DELETE OPERATIONS
// =============================================================================

/**
 * Create a new patient
 * @param {Object} patientData - Patient data
 * @returns {Promise} Created patient
 */
export const createPatient = async (patientData) => {
    try {
        const response = await apiClient.post('/patients', patientData);
        return response.data;
    } catch (error) {
        console.error('Create Patient API Error:', error);
        throw error;
    }
};

/**
 * Update a patient
 * @param {string} patientId - Patient ID
 * @param {Object} patientData - Updated patient data
 * @returns {Promise} Updated patient
 */
export const updatePatient = async (patientId, patientData) => {
    try {
        const response = await apiClient.put(`/patients/${patientId}`, patientData);
        return response.data;
    } catch (error) {
        console.error('Update Patient API Error:', error);
        throw error;
    }
};

/**
 * Delete a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise} Success message
 */
export const deletePatient = async (patientId) => {
    try {
        const response = await apiClient.delete(`/patients/${patientId}`);
        return response.data;
    } catch (error) {
        console.error('Delete Patient API Error:', error);
        throw error;
    }
};

/**
 * Create a new medical event for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} eventData - Event data
 * @returns {Promise} Created event
 */
export const createMedicalEvent = async (patientId, eventData) => {
    try {
        const response = await apiClient.post(`/patients/${patientId}/history`, eventData);
        return response.data;
    } catch (error) {
        console.error('Create Event API Error:', error);
        throw error;
    }
};

/**
 * Delete a medical event
 * @param {number} eventId - Event ID
 * @returns {Promise} Success message
 */
export const deleteMedicalEvent = async (eventId) => {
    try {
        const response = await apiClient.delete(`/events/${eventId}`);
        return response.data;
    } catch (error) {
        console.error('Delete Event API Error:', error);
        throw error;
    }
};

/**
 * Create a new document for a patient
 * @param {string} patientId - Patient ID
 * @param {Object} docData - Document data
 * @returns {Promise} Created document
 */
export const createDocument = async (patientId, docData) => {
    try {
        const response = await apiClient.post(`/patients/${patientId}/documents`, docData);
        return response.data;
    } catch (error) {
        console.error('Create Document API Error:', error);
        throw error;
    }
};

/**
 * Fetch database statistics
 * @returns {Promise} Database stats
 */
export const fetchDatabaseStats = async () => {
    try {
        const response = await apiClient.get('/admin/database-stats');
        return response.data;
    } catch (error) {
        console.error('Database Stats API Error:', error);
        throw error;
    }
};

export default apiClient;
