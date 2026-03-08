'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const WarpLoading: React.FC<{ message?: string }> = ({ message = 'Consulting the Oracle...' }) => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
            {/* Warp Speed Lines */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `-20%`,
                            width: `${Math.random() * 40 + 20}%`,
                            rotate: `${(Math.random() - 0.5) * 10}deg`,
                        }}
                        animate={{
                            left: ['-20%', '120%'],
                            opacity: [0, 0.3, 0],
                        }}
                        transition={{
                            duration: Math.random() * 0.5 + 0.3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 text-center">
                <motion.div
                    className="w-24 h-24 rounded-full border-t-2 border-purple-500 shadow-purple-glow mx-auto mb-8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-display font-black nebula-text uppercase tracking-[0.3em]"
                >
                    {message}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.5 }}
                    className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 font-bold"
                >
                    Processing across dimensions
                </motion.p>
            </div>

            {/* Pulsing Core */}
            <motion.div
                className="absolute w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
};
