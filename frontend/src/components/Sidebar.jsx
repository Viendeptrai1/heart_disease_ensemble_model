import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, HeartPulse, Microscope, ClipboardList, Clock, BarChart3, Brain } from 'lucide-react';

const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Phân loại' },
    { id: 'history', icon: Clock, label: 'Lịch sử' },
    { id: 'diagnostics', icon: Microscope, label: 'Chẩn đoán' },
    { id: 'treatment', icon: ClipboardList, label: 'Điều trị' },
    { id: 'training', icon: Brain, label: 'Training' },
    { id: 'admin', icon: BarChart3, label: 'Hệ thống' },
];

const Sidebar = ({ currentPage = 'dashboard', onNavigate }) => {
    const active = currentPage;

    return (
        <aside className="fixed left-6 top-6 bottom-6 w-24 glass rounded-blob-3 flex flex-col items-center justify-between py-6 z-50">
            {/* Logo - Top */}
            <div className="text-clay flex items-center justify-center w-14 h-14">
                <HeartPulse size={36} strokeWidth={2.5} className="animate-breathing" />
            </div>

            {/* Navigation - Center */}
            <nav className="flex flex-col items-center gap-4">
                {menuItems.map((item) => {
                    const isActive = active === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate?.(item.id)}
                            className="relative w-12 h-12 flex items-center justify-center group"
                            title={item.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeBlob"
                                    className="absolute inset-0 bg-sage/30 rounded-blob-1"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={22}
                                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-moss' : 'text-moss/60 group-hover:text-moss'}`}
                                strokeWidth={2.5}
                            />
                        </button>
                    );
                })}
            </nav>

            {/* Spacer - Bottom (for balance) */}
            <div className="w-14 h-14" />
        </aside>
    );
};

export default Sidebar;

