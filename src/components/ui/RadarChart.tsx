'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RadarData {
    label: string;
    value: number; // 0 to 100
}

interface RadarChartProps {
    data: RadarData[];
    size?: number;
    color?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
    data,
    size = 300,
    color = '#9333ea' // purple-600
}) => {
    const padding = 40;
    const center = size / 2;
    const radius = size / 2 - padding;
    const angleStep = (Math.PI * 2) / data.length;

    // Generate points for the shape
    const points = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (d.value / 100) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    // Generate axis lines and labels
    const axes = data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        const labelX = center + (radius + 20) * Math.cos(angle);
        const labelY = center + (radius + 20) * Math.sin(angle);

        return { x2, y2, labelX, labelY, label: d.label };
    });

    // Webs (circles)
    const webs = [0.2, 0.4, 0.6, 0.8, 1].map(scale => {
        const r = scale * radius;
        return r;
    });

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="overflow-visible">
                {/* Webs */}
                {webs.map((r, i) => (
                    <circle
                        key={i}
                        cx={center}
                        cy={center}
                        r={r}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axes */}
                {axes.map((axis, i) => (
                    <g key={i}>
                        <line
                            x1={center}
                            y1={center}
                            x2={axis.x2}
                            y2={axis.y2}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                        />
                        <text
                            x={axis.labelX}
                            y={axis.labelY}
                            fill="#94a3b8"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-display uppercase tracking-widest"
                        >
                            {axis.label}
                        </text>
                    </g>
                ))}

                {/* The Data Shape */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    points={pointsString}
                    fill={`${color}33`} // 20% opacity
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]"
                />

                {/* Data Points */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill={color}
                    />
                ))}
            </svg>
        </div>
    );
};
