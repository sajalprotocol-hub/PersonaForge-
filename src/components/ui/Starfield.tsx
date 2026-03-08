'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    baseSize: number;
    opacity: number;
}

export const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const animationId = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            particles.current = [];
            // Reduced particle count: max 60 (was 150) for much better perf
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 60);

            for (let i = 0; i < count; i++) {
                particles.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    baseSize: Math.random() * 1.5 + 0.5,
                    size: 0,
                    speedX: (Math.random() - 0.5) * 0.15,
                    speedY: (Math.random() - 0.5) * 0.15,
                    opacity: Math.random() * 0.4 + 0.1,
                });
            }
        };

        let lastFrame = 0;
        const TARGET_FPS = 30; // Cap at 30fps instead of 60 — halves GPU work
        const FRAME_INTERVAL = 1000 / TARGET_FPS;

        const animate = (timestamp: number) => {
            const delta = timestamp - lastFrame;
            if (delta < FRAME_INTERVAL) {
                animationId.current = requestAnimationFrame(animate);
                return;
            }
            lastFrame = timestamp;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.current.forEach((p) => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                p.size = p.baseSize;

                // Simple dot rendering — no expensive radial gradients
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
            });

            animationId.current = requestAnimationFrame(animate);
        };

        handleResize();
        init();
        animationId.current = requestAnimationFrame(animate);

        window.addEventListener('resize', handleResize);
        // Removed mousemove and scroll listeners — big perf win

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId.current);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* Simplified nebula glow — reduced from 3 to 2 and smaller blur */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/8 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/8 blur-[100px] rounded-full" />
        </div>
    );
};
