import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { applyDerivedMetrics } from '@/lib/schemas'

/**
 * One hook per backend endpoint. Endpoint paths match routes/ in the Flask app;
 * the Vite proxy forwards them in dev and they are same-origin in production.
 */

/** POST /predict -> routes/predict.py:17 */
export function usePredict() {
  return useMutation({
    mutationKey: ['predict'],
    mutationFn: (patientData) => post('/predict', applyDerivedMetrics(patientData)),
  })
}

/** POST /generate_report -> routes/report.py:16 (LLM narrative, with rule-based fallback) */
export function useGenerateReport() {
  return useMutation({
    mutationKey: ['generate_report'],
    mutationFn: (body) => post('/generate_report', body),
  })
}

/** POST /generate_detailed_analysis -> routes/report.py:38 */
export function useDetailedAnalysis() {
  return useMutation({
    mutationKey: ['detailed_analysis'],
    mutationFn: (body) => post('/generate_detailed_analysis', body),
  })
}

/** POST /analyze_drug_interactions_ai -> routes/report.py:65 */
export function useDrugInteractions() {
  return useMutation({
    mutationKey: ['drug_interactions'],
    mutationFn: ({ drugs, patient_data }) =>
      post('/analyze_drug_interactions_ai', { drugs, patient_data }),
  })
}

/** GET /get_ai_drug_insights - ported from debug_server.py in Phase 4 */
export function useAiDrugInsights() {
  return useMutation({
    mutationKey: ['ai_drug_insights'],
    mutationFn: (body) => post('/get_ai_drug_insights', body),
  })
}

/** POST /mitigation_strategies -> routes/predict.py:47 */
export function useMitigationStrategies() {
  return useMutation({
    mutationKey: ['mitigation_strategies'],
    mutationFn: (body) => post('/mitigation_strategies', body),
  })
}

/** POST /api/chat -> routes/report.py:81. Stateless server-side; history lives in the client. */
export function useChat() {
  return useMutation({
    mutationKey: ['chat'],
    mutationFn: ({ message, context }) => post('/api/chat', { message, context }),
  })
}

/** POST /interpret_lab_value -> routes/clinical.py:47 */
export function useLabInterpretation() {
  return useMutation({
    mutationKey: ['interpret_lab_value'],
    mutationFn: ({ test_name, value, sex }) =>
      post('/interpret_lab_value', { test_name, value, sex }),
  })
}

/** POST /enhanced_lab_analysis -> routes/clinical.py:64 */
export function useEnhancedLabAnalysis() {
  return useMutation({
    mutationKey: ['enhanced_lab_analysis'],
    mutationFn: (patientData) => post('/enhanced_lab_analysis', patientData),
  })
}

/** POST /upload_liver_function -> routes/clinical.py:84. JSON body despite the name. */
export function useLiverFunctionAnalysis() {
  return useMutation({
    mutationKey: ['liver_function'],
    mutationFn: (body) => post('/upload_liver_function', body),
  })
}

/** POST /save_assessment -> routes/clinical.py:108 (in-memory store, lost on restart) */
export function useSaveAssessment() {
  return useMutation({
    mutationKey: ['save_assessment'],
    mutationFn: ({ patient_id, patient_data, prediction }) =>
      post('/save_assessment', { patient_id, patient_data, prediction }),
  })
}

/** POST /api/counselling/submit -> routes/clinical.py:126 */
export function useSubmitCounselling() {
  return useMutation({
    mutationKey: ['counselling_submit'],
    mutationFn: (body) => post('/api/counselling/submit', body),
  })
}

/** GET /sample_data/<type> -> routes/predict.py:85. Fired on demand, not on mount. */
export function useSampleData() {
  return useMutation({
    mutationKey: ['sample_data'],
    mutationFn: (sampleType) => get(`/sample_data/${sampleType}`),
  })
}

/** GET /get_drug_adrs?drug= -> routes/predict.py:139 */
export function useDrugAdrs(drug) {
  return useQuery({
    queryKey: ['drug_adrs', drug],
    queryFn: () => get('/get_drug_adrs', { params: { drug } }),
    enabled: Boolean(drug),
    staleTime: 60 * 60 * 1000,
  })
}

/** GET /get_medication_suggestions -> routes/clinical.py:24 */
export function useMedicationSuggestions() {
  return useQuery({
    queryKey: ['medication_suggestions'],
    queryFn: () => get('/get_medication_suggestions'),
    staleTime: Infinity,
  })
}

/** GET /get_lab_reference -> routes/clinical.py:18 */
export function useLabReference() {
  return useQuery({
    queryKey: ['lab_reference'],
    queryFn: () => get('/get_lab_reference'),
    staleTime: Infinity,
  })
}

/** GET /health -> routes/health.py:24. 503 when the model pickle failed to load. */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => get('/health'),
    retry: false,
    refetchInterval: 60000,
  })
}
