import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f4ff',
                    100: '#dbe4ff',
                    200: '#bac8ff',
                    300: '#91a7ff',
                    400: '#748ffc',
                    500: '#5c7cfa',
                    600: '#4c6ef5',
                    700: '#4263eb',
                    800: '#3b5bdb',
                    900: '#364fc7',
                },
                accent: {
                    DEFAULT: '#7C3AED',
                    hover: '#8B5CF6',
                    glow: '#7C3AED22',
                },
                cosmic: {
                    black: '#000000',
                    gray: '#9CA3AF',
                    purple: '#7C3AED',
                    violet: '#8B5CF6',
                },
                status: {
                    success: '#22C55E',
                    error: '#EF4444',
                    warning: '#EAB308',
                },
                surface: {
                    50: '#f8f9fa',
                    100: '#f1f3f5',
                    200: '#e9ecef',
                    300: '#dee2e6',
                    400: '#ced4da',
                    500: '#adb5bd',
                    600: '#868e96',
                    700: '#495057',
                    800: '#343a40',
                    900: '#212529',
                    950: '#000000',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'slide-up': 'slide-up 0.5s ease-out',
                'slide-down': 'slide-down 0.3s ease-out',
                'slide-right': 'slide-right 0.3s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'scale-in': 'scale-in 0.3s ease-out',
                'shimmer': 'shimmer 2s linear infinite',
                'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
                'gradient-x': 'gradient-x 3s ease infinite',
                'star-twinkle': 'twinkle 4s ease-in-out infinite',
                'nebula-pulse': 'nebula-pulse 8s ease-in-out infinite',
                'orb-float': 'orb-float 4s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-down': {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-right': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'scale-in': {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'gradient-x': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                twinkle: {
                    '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
                    '50%': { opacity: '1', transform: 'scale(1.2)' },
                },
                'nebula-pulse': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.05)' },
                },
                'orb-float': {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)', filter: 'drop-shadow(0 0 10px #7C3AED)' },
                    '33%': { transform: 'translate(10px, -15px) scale(1.05)', filter: 'drop-shadow(0 0 20px #8B5CF6)' },
                    '66%': { transform: 'translate(-5px, 10px) scale(0.95)', filter: 'drop-shadow(0 0 15px #7C3AED)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
                'hero-pattern': 'linear-gradient(135deg, #000000 0%, #1a0b2e 100%)',
                'nebula-glow': 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
            },
            boxShadow: {
                'purple-glow': '0 0 20px 0 rgba(124, 58, 237, 0.3)',
                'purple-glow-lg': '0 0 40px 0 rgba(124, 58, 237, 0.5)',
            },
        },
    },
    plugins: [],
};

export default config;
