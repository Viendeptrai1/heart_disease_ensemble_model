import React from 'react';

const WidgetCard = ({ title, children, className = '', style = {} }) => (
    <div
        className={`glass p-6 text-moss relative overflow-hidden ${className}`}
        style={{ borderRadius: '50% 50% 20% 80% / 25% 80% 20% 75%', ...style }}
    >
        <h3 className="text-lg font-bold mb-4 relative z-10">{title}</h3>
        <div className="relative z-10">{children}</div>
    </div>
);

const PerformanceStats = ({ metrics }) => {
    // Use metrics from props or fallback values
    const modelConfidence = metrics?.modelConfidence ? (metrics.modelConfidence * 100).toFixed(1) : '94.2';
    const accuracy = metrics?.accuracy ? (metrics.accuracy * 100).toFixed(1) : '98.5';

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6 text-moss/80 pl-4">Thông số Hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Model Confidence */}
                <WidgetCard title="Độ tin cậy Mô hình">
                    <div className="h-32 flex items-center justify-center relative">
                        <div className="text-4xl font-bold text-moss z-10">{modelConfidence}%</div>
                        {/* Liquid Fill Background Sim */}
                        <div className={`absolute bottom-0 w-full bg-sage/20 rounded-[inherit] animate-breathing`}
                            style={{
                                borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%',
                                height: `${modelConfidence}%`
                            }} />
                    </div>
                </WidgetCard>

                {/* GNN Accuracy */}
                <WidgetCard
                    title="Độ chính xác GNN"
                    className="bg-white/10 px-10 py-10"
                    style={{ borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%' }}
                >
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <span>Huấn luyện</span>
                            <span className="font-bold">98.5%</span>
                        </div>
                        <div className="w-full bg-sand/50 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-clay w-[98.5%] rounded-full" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Kiểm thử</span>
                            <span className="font-bold">92.1%</span>
                        </div>
                        <div className="w-full bg-sand/50 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-sage w-[92.1%] rounded-full" />
                        </div>
                    </div>
                </WidgetCard>

                {/* SHAP Feature Importance */}
                <WidgetCard title="Độ quan trọng SHAP">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: 'Đau ngực', val: 1.0, col: 'bg-clay' },
                            { name: 'Nhịp tim', val: 0.8, col: 'bg-clay/80' },
                            { name: 'Mạch máu', val: 0.6, col: 'bg-sage' },
                            { name: 'Tuổi tác', val: 0.4, col: 'bg-sage/70' }
                        ].map((feature, i) => (
                            <div
                                key={feature.name}
                                className={`${feature.col} px-3 py-1 text-sand text-xs font-bold shadow-sm animate-float`}
                                style={{
                                    borderRadius: '50rem',
                                    animationDelay: `${i * 0.5}s`
                                }}
                            >
                                {feature.name}
                            </div>
                        ))}
                    </div>
                </WidgetCard>
            </div>
        </section>
    );
};

export default PerformanceStats;
