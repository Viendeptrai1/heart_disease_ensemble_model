import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorToast = ({ message, onClose }) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
            >
                <div
                    className="bg-clay/90 backdrop-blur-md shadow-lg px-6 py-4 flex items-center gap-4"
                    style={{
                        borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%',
                        minWidth: '320px',
                    }}
                >
                    <div className="flex-1">
                        <p className="text-sand font-bold text-sm">Lỗi kết nối</p>
                        <p className="text-sand/80 text-xs mt-1">{message}</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-sand hover:text-sand/70 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ErrorToast;
