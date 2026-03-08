'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        // Only show custom cursor on desktop with pointer devices
        const isTouch = window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) return;

        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        window.addEventListener('mousemove', moveMouse, { passive: true });

        return () => {
            window.removeEventListener('mousemove', moveMouse);
        };
    }, [mouseX, mouseY, isVisible]);

    if (!isVisible) return null;

    return (
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[999999]"
            style={{
                x: cursorX,
                y: cursorY,
            }}
        >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
                {/* Simple glow dot — no expensive animations */}
                <div className="w-6 h-6 rounded-full border border-purple-500/30" />
                <div className="absolute top-[9px] left-[9px] w-1.5 h-1.5 rounded-full bg-white shadow-purple-glow" />
            </div>
        </motion.div>
    );
};
