import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { patientDefaults } from '@/lib/schemas'

/**
 * Shared clinical session state.
 *
 * Replaces the old pattern of passing data through react-router `location.state`
 * (client/src/pages/MedicalReport.jsx), which blanked the report on refresh.
 * Everything here is mirrored to sessionStorage so a reload keeps the session.
 *
 * sessionStorage, not localStorage, on purpose: this is patient data on a shared
 * clinical workstation, and it should not outlive the browser tab.
 */

const STORAGE_KEY = 'phenorx.assessment.v1'

const initialState = {
  patient: patientDefaults,
  prediction: null,
  report: null,
  clinicianName: 'Attending Physician',
  startedAt: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload }

    case 'SET_PATIENT':
      return {
        ...state,
        patient: { ...state.patient, ...action.payload },
        startedAt: state.startedAt || new Date().toISOString(),
      }

    case 'SET_PREDICTION':
      // A new prediction invalidates the narrative written for the previous one.
      return { ...state, prediction: action.payload, report: null }

    case 'SET_REPORT':
      return { ...state, report: action.payload }

    case 'SET_CLINICIAN':
      return { ...state, clinicianName: action.payload }

    case 'RESET':
      return { ...initialState, patient: patientDefaults }

    default:
      return state
  }
}

function readStoredState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AssessmentContext = createContext(null)

export function AssessmentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Hydrate once on mount rather than in a useReducer initializer, so SSR-less
  // first paint never touches sessionStorage during render.
  useEffect(() => {
    const stored = readStoredState()
    if (stored) dispatch({ type: 'HYDRATE', payload: stored })
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Quota or private-mode failure is not worth breaking the workflow over.
    }
  }, [state])

  const setPatient = useCallback((patch) => dispatch({ type: 'SET_PATIENT', payload: patch }), [])
  const setPrediction = useCallback(
    (prediction) => dispatch({ type: 'SET_PREDICTION', payload: prediction }),
    [],
  )
  const setReport = useCallback((report) => dispatch({ type: 'SET_REPORT', payload: report }), [])
  const setClinician = useCallback(
    (name) => dispatch({ type: 'SET_CLINICIAN', payload: name }),
    [],
  )
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const value = useMemo(
    () => ({ ...state, setPatient, setPrediction, setReport, setClinician, reset }),
    [state, setPatient, setPrediction, setReport, setClinician, reset],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext)
  if (!ctx) throw new Error('useAssessment must be used inside an AssessmentProvider')
  return ctx
}
