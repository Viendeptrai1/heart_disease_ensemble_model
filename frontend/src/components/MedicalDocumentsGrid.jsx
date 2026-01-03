import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, FlaskConical, Stethoscope, Download } from 'lucide-react';

const MedicalDocumentsGrid = ({ documents = [] }) => {
    const getDocumentIcon = (type) => {
        switch (type) {
            case 'pdf':
                return FileText;
            case 'xray':
            case 'image':
                return Image;
            case 'lab':
                return FlaskConical;
            case 'report':
                return Stethoscope;
            default:
                return FileText;
        }
    };

    const getDocumentColor = (type) => {
        switch (type) {
            case 'pdf':
                return 'from-clay/20 to-clay/10';
            case 'xray':
            case 'image':
                return 'from-moss/20 to-moss/10';
            case 'lab':
                return 'from-sage/30 to-sage/10';
            case 'report':
                return 'from-sand to-white';
            default:
                return 'from-sand to-white';
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-moss font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📁</span>
                Tài liệu y tế
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {documents.map((doc, index) => {
                    const IconComponent = getDocumentIcon(doc.type);
                    const colorClass = getDocumentColor(doc.type);

                    return (
                        <motion.div
                            key={doc.id}
                            className={`
                                relative group cursor-pointer
                                bg-gradient-to-br ${colorClass}
                                p-4 rounded-full
                                border border-white/50
                                shadow-md
                                transition-all duration-300
                                hover:shadow-xl hover:-translate-y-1
                            `}
                            style={{
                                borderRadius: '9999px',
                                minHeight: '100px',
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-2">
                                <motion.div
                                    className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shadow-sm"
                                    whileHover={{ rotate: 5 }}
                                >
                                    <IconComponent size={20} className="text-moss" />
                                </motion.div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-moss truncate">
                                        {doc.name}
                                    </p>
                                    <p className="text-xs text-moss/60 mt-0.5">
                                        {doc.date}
                                    </p>
                                </div>

                                {/* Download button on hover */}
                                <motion.button
                                    className="absolute bottom-2 right-4 w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(135, 152, 106, 0.4)' }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Download size={14} className="text-moss" />
                                </motion.button>
                            </div>

                            {/* File size badge */}
                            {doc.size && (
                                <span className="absolute top-2 right-4 text-xs text-moss/50 bg-white/60 px-2 py-0.5 rounded-full">
                                    {doc.size}
                                </span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {documents.length === 0 && (
                <div className="text-center py-12 text-moss/50">
                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                    <p>Chưa có tài liệu nào</p>
                </div>
            )}
        </div>
    );
};

export default MedicalDocumentsGrid;
