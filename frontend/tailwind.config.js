import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 브랜드 코랄 핑크 (Primary) - 500이 공식 로고 메인 컬러(#FF8A7A)
        brand: {
          50: '#FFF3F1',
          100: '#FFE4E0',
          200: '#FFC9C1',
          300: '#FFAD9F',
          400: '#FF9C8C',
          500: '#FF8A7A',
          600: '#E5604F', // 흰 배경 위 텍스트용 (대비비 확보)
          700: '#C24535',
          800: '#9A3629',
          900: '#7A2D23',
          foreground: '#4A1F18', // 코랄 면 위의 글자색 (대비비 약 7:1)
        },
        // 민트 티얼 (Secondary Accent)
        mint: {
          50: '#EDFBFA',
          100: '#D3F5F3',
          300: '#8FE3DD',
          400: '#6EE0D7',
          500: '#4ECDC4',
          600: '#2FA9A0',
          700: '#25857E',
          800: '#1C645F',
          900: '#144643',
          950: '#0B2927',
          foreground: '#0B3D39',
        },
        // 크림 아이보리 (Background Neutral)
        cream: {
          DEFAULT: '#FFFDF7',
          50: '#FFFEFB',
          100: '#FFF8EA',
          200: '#FBEFD9',
        },
        // 소비기한 D-Day 신호등 색상 (06 가이드 4.4절)
        dday: {
          urgent: '#EF4444', // D-3 이내 (빨강)
          warning: '#F97316', // D-7 이내 (주황)
          safe: '#10B981', // D-7 초과 (초록)
          info: '#3B82F6', // D-7 초과 (파랑)
          expired: '#991B1B', // 기한 초과 (Deep Red)
        },
        // shadcn 시맨틱 토큰 (index.css의 CSS 변수와 연결)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(255, 138, 122, 0.25)',
        card: '0 2px 12px -2px rgba(74, 31, 24, 0.08)',
        // 중앙 FAB 전용 입체 그림자
        fab: '0 10px 24px -6px rgba(255, 138, 122, 0.65), 0 4px 10px -2px rgba(229, 96, 79, 0.35)',
      },
      spacing: {
        // 레이아웃 높이 단일 출처 (Header / BottomNav)
        header: '3.5rem',
        tabbar: '4.5rem',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
        yanolja: [
          '"Yanolja Yache"',
          'Yanolja',
          'Pretendard',
          '-apple-system',
          'sans-serif',
        ],
        heading: [
          '"Yanolja Yache"',
          'Yanolja',
          'Pretendard',
          '-apple-system',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 138, 122, 0.55)' },
          '100%': { boxShadow: '0 0 0 14px rgba(255, 138, 122, 0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 2.2s ease-out infinite',
      },
    },
  },
  plugins: [animate],
}
