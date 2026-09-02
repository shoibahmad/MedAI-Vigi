import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Flask endpoints that are not under /api. The backend never namespaced these,
// so each one has to be proxied explicitly in dev.
const FLASK_ROUTES = [
  '/predict',
  '/mitigation_strategies',
  '/sample_data',
  '/get_drug_adrs',
  '/generate_report',
  '/generate_detailed_analysis',
  '/generate_medication_analysis',
  '/analyze_drug_interactions_ai',
  '/get_ai_drug_insights',
  '/get_lab_reference',
  '/get_medication_suggestions',
  '/interpret_lab_value',
  '/enhanced_lab_analysis',
  '/upload_liver_function',
  '/save_assessment',
  '/health',
  '/ready',
  '/live',
  '/metrics',
  '/status',
]

const target = process.env.VITE_API_TARGET || 'http://127.0.0.1:5000'

const proxy = Object.fromEntries(
  ['/api', ...FLASK_ROUTES].map((route) => [route, { target, changeOrigin: true }]),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy,
  },
})
