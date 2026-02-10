/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                outfit: ["Outfit", "sans-serif"],
                inter: ["Inter", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                gold: {
                    DEFAULT: "hsl(var(--gold))",
                    foreground: "hsl(var(--gold-foreground))",
                    50: '#fff9e6',
                    100: '#ffefbf',
                    200: '#ffdf80',
                    300: '#ffcf40',
                    400: '#ffbf00', // IPL Gold
                    500: '#e6ac00',
                    600: '#b38600',
                    700: '#806000',
                    800: '#4d3900',
                    900: '#1a1300',
                },
                'ipl-cyan': {
                    DEFAULT: '#00E5FF', // Electric Cyan
                    dark: '#00B8D4', // Darker Cyan
                    light: '#84FFFF', // Light Cyan
                },
                'ipl-blue': {
                    DEFAULT: '#004BA0', // Royal Blue
                    dark: '#002D62', // Navy
                    light: '#1976D2',
                },
                'arena-dark': '#0f172a', // Deep slate/navy background
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: .5 },
                }
            },
        },
    },
    plugins: [],
}
