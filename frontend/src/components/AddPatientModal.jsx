import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, Droplets, Heart } from 'lucide-react';

const AddPatientModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'Nam',
        phone: '',
        address: '',
        blood_type: 'O+',
        riskLevel: 'low',
        healthScore: 70,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'age' || name === 'healthScore' ? parseInt(value) || '' : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.age) {
            alert('Vui lòng nhập tên và tuổi!');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                confidence: formData.riskLevel === 'high' ? 0.85 : formData.riskLevel === 'medium' ? 0.75 : 0.9
            });
            setFormData({
                name: '',
                age: '',
                gender: 'Nam',
                phone: '',
                address: '',
                blood_type: 'O+',
                riskLevel: 'low',
                healthScore: 70,
            });
            onClose();
        } catch (error) {
            alert('Lỗi khi thêm bệnh nhân!');
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
                    <div className="bg-sage/20 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-moss flex items-center gap-2">
                            <User size={24} />
                            Thêm Bệnh Nhân Mới
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition-colors"
                        >
                            <X size={20} className="text-moss" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name & Age */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1">
                                    Họ và Tên *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1">
                                    Tuổi *
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    min="1"
                                    max="120"
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                    placeholder="50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Gender & Blood Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1">
                                    Giới tính
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <Droplets size={14} />
                                    Nhóm máu
                                </label>
                                <select
                                    name="blood_type"
                                    value={formData.blood_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                >
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                <Phone size={14} />
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                placeholder="0901234567"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                <MapPin size={14} />
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                placeholder="123 Nguyễn Huệ, Q.1, TP.HCM"
                            />
                        </div>

                        {/* Risk Level & Health Score */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1 flex items-center gap-1">
                                    <Heart size={14} />
                                    Mức độ rủi ro
                                </label>
                                <select
                                    name="riskLevel"
                                    value={formData.riskLevel}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-moss/80 mb-1">
                                    Điểm sức khỏe (0-100)
                                </label>
                                <input
                                    type="number"
                                    name="healthScore"
                                    value={formData.healthScore}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 rounded-2xl bg-sand/30 border border-sand focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-sage text-white font-semibold rounded-2xl shadow-lg disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Đang lưu...' : 'Thêm Bệnh Nhân'}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddPatientModal;
