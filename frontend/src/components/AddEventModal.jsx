import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Stethoscope, FileText, User } from 'lucide-react';

const AddEventModal = ({ isOpen, onClose, onSubmit, patientName }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'checkup',
        title: '',
        description: '',
        doctor: '',
        severity: 'low',
    });
    const [loading, setLoading] = useState(false);

    const eventTypes = [
        { value: 'checkup', label: 'Khám định kỳ', icon: '🩺' },
        { value: 'test', label: 'Xét nghiệm', icon: '🧪' },
        { value: 'medication', label: 'Điều chỉnh thuốc', icon: '💊' },
        { value: 'hospitalization', label: 'Nhập viện', icon: '🏥' },
        { value: 'surgery', label: 'Phẫu thuật', icon: '⚕️' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.doctor) {
            alert('Vui lòng nhập tiêu đề và bác sĩ!');
            return;
        }

        setLoading(true);
        try {
            // Format date to DD/MM/YYYY
            const dateParts = formData.date.split('-');
            const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

            await onSubmit({
                ...formData,
                date: formattedDate,
            });
            setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'checkup',
                title: '',
                description: '',
                doctor: '',
                severity: 'low',
            });
            onClose();
        } catch (error) {
            alert('Lỗi khi thêm sự kiện!');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white/95 backdrop-blur-md w-full max-w-lg shadow-xl overflow-hidden"
                    style={{ borderRadius: '30px' }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-clay/20 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-moss flex items-center gap-2">
                                <FileText size={24} />
                                Thêm Sự Kiện Y Tế
                            </h2>
                            {patientName && (
                                <p className="text-sm text-moss/60 mt-1">
                                    Bệnh nhân: {patientName}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition-colors"
                        >
                            <X size={20} className="text-moss" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Date & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <Calendar size={14} />
                                    Ngày
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <Stethoscope size={14} />
                                    Loại sự kiện
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                >
                                    {eventTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-moss/80 mb-1">
                                Tiêu đề *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                placeholder="VD: Xét nghiệm máu định kỳ"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-moss/80 mb-1">
                                Mô tả chi tiết
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                                placeholder="Kết quả, ghi chú, chỉ định..."
                            />
                        </div>

                        {/* Doctor & Severity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <User size={14} />
                                    Bác sĩ *
                                </label>
                                <input
                                    type="text"
                                    name="doctor"
                                    value={formData.doctor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                    placeholder="BS. Nguyễn Văn A"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1">
                                    Mức độ
                                </label>
                                <select
                                    name="severity"
                                    value={formData.severity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                >
                                    <option value="low">🟢 Nhẹ</option>
                                    <option value="medium">🟡 Trung bình</option>
                                    <option value="high">🔴 Nghiêm trọng</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-clay text-white font-semibold rounded-2xl shadow-lg disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Đang lưu...' : 'Thêm Sự Kiện'}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddEventModal;
