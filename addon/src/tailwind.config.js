/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ha: {
          bg:      'var(--fpeditor-bg,      #111827)',
          surface: 'var(--fpeditor-surface, #1f2937)',
          border:  'var(--fpeditor-border,  #374151)',
          text:    'var(--fpeditor-text,    #f9fafb)',
          muted:   'var(--fpeditor-muted,   #9ca3af)',
          accent:  'var(--fpeditor-accent,  #3b82f6)',
        },
      },
    },
  },
  plugins: [],
};
