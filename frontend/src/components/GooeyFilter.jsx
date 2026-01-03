import React from 'react';

const GooeyFilter = () => {
    return (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
                <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                        result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
            </defs>
        </svg>
    );
};

export default GooeyFilter;
