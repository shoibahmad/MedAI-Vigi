/**
 * Content for the informational pages, ported from the Jinja templates that
 * previously lived in templates/.
 *
 * Where the original text described the old stack (HTML/CSS/JS, D3.js) or
 * documented endpoints that do not exist, it has been corrected to match the
 * current implementation rather than carried over verbatim.
 */

export const CONTACT = {
  email: 'phenorx@iul.ac.in',
  phone: '+91 8853741966',
  address: 'Integral University, Kursi Road, Lucknow - 226026, India',
  institution: 'Integral University, Lucknow',
}

export const LAST_UPDATED = 'November 2025'

/* ------------------------------------------------------------------ About */

export const MISSION =
  'PhenoRx is a clinical decision support system designed to predict and prevent adverse drug reactions using machine learning and pharmacogenomic rule engines. Its purpose is to enhance patient safety and improve clinical outcomes through intelligent pharmacovigilance, giving healthcare professionals actionable insight at the point of care.'

export const KEY_FEATURES = [
  {
    icon: 'Brain',
    title: 'AI-powered analysis',
    body: 'NVIDIA Nemotron generates clinical narratives, organ-system breakdowns, and mitigation planning.',
  },
  {
    icon: 'Activity',
    title: 'Risk prediction',
    body: 'A gradient-boosted classifier scores seven adverse reaction classes from 60+ clinical inputs.',
  },
  {
    icon: 'Network',
    title: 'Drug interactions',
    body: 'Multi-drug conflict checking with severity classification and alternative suggestions.',
  },
  {
    icon: 'Calculator',
    title: 'Personalized dosing',
    body: 'Dose titration adjusted for renal eGFR, hepatic transaminases, age, and CYP2C9 phenotype.',
  },
  {
    icon: 'HeartPulse',
    title: 'Safety monitoring',
    body: 'Monitoring protocols and therapeutic drug monitoring schedules derived from the risk profile.',
  },
  {
    icon: 'FileText',
    title: 'Medical reports',
    body: 'Comprehensive clinical assessment reports with PDF export.',
  },
]

export const TECH_STACK = [
  { name: 'Python & Flask', body: 'Application factory with modular route blueprints.' },
  { name: 'scikit-learn', body: 'HistGradientBoostingClassifier for ADR prediction.' },
  { name: 'NVIDIA Nemotron', body: 'Clinical narratives and structured analysis, with offline fallbacks.' },
  { name: 'React 19 & Vite', body: 'Single-page frontend, built and served by Flask.' },
  { name: 'Tailwind CSS & shadcn/ui', body: 'Design system and accessible UI primitives.' },
  { name: 'Pydantic & Zod', body: 'Matched request validation on the server and in the browser.' },
]

export const HOW_TO_USE = [
  {
    title: 'Enter patient details',
    body: 'Provide the patient name, age, sex, and clinician on the patient details form. Age and sex select the laboratory reference intervals used throughout.',
  },
  {
    title: 'Complete the clinical assessment',
    body: 'Fill in demographics, anthropometrics, laboratory values, comorbidities, pharmacogenomics, and the current medication regimen. Sections can be completed in any order.',
  },
  {
    title: 'Run the risk prediction',
    body: 'The model returns an overall risk score, a tier, the most likely reaction class, and the contributing factors that drove it.',
  },
  {
    title: 'Review interactions and dosing',
    body: 'Check the regimen for conflicts, and review renal, hepatic, and pharmacogenomic dose adjustments on the decision support page.',
  },
  {
    title: 'Generate the clinical report',
    body: 'Produce an AI narrative, organ-system analysis, and a prioritized mitigation plan, then export the report as a PDF.',
  },
  {
    title: 'Counsel the patient',
    body: 'Work through the six-step counselling flow with teach-back comprehension scoring and signed acknowledgment.',
  },
]

/* ---------------------------------------------------------- Documentation */

export const DOC_SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      'PhenoRx is an AI-assisted system for adverse drug reaction (ADR) identification and clinical decision support. It combines a machine-learning risk model with deterministic pharmacogenomic rule engines and NVIDIA Nemotron for narrative generation.',
      `Developed by Pharm.D students at ${CONTACT.institution}, the system assists healthcare professionals in making informed decisions about drug therapy and patient safety.`,
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    subsections: [
      {
        title: '1. ADR risk assessment',
        items: [
          'Open the Patient Details page and enter demographics.',
          'Continue to the Assessment page and complete the clinical sections.',
          'Enter the index medication, dose, and any concomitant drugs.',
          'Record comorbidities, pharmacogenomic phenotypes, and risk flags.',
          'Select "Predict ADR risk" to generate the assessment.',
        ],
      },
      {
        title: '2. Drug interaction checking',
        items: [
          'Open the Interactions page; the current regimen is pre-filled.',
          'Add any further medications to the list.',
          'Run the analysis to see severity classification and management guidance.',
        ],
      },
      {
        title: '3. Clinical decision support',
        items: [
          'Open the Decision Support page after running an assessment.',
          'Review personalized dosing, renal and hepatic adjustment, and the monitoring pathway.',
          'Each recommendation is derived from the values recorded on the assessment.',
        ],
      },
    ],
  },
  {
    id: 'architecture',
    title: 'System architecture',
    items: [
      'Backend: Python Flask application factory with modular blueprints.',
      'Machine learning: scikit-learn HistGradientBoostingClassifier with a preprocessing pipeline.',
      'AI integration: NVIDIA Nemotron via the NIM OpenAI-compatible endpoint, with a secondary model and deterministic fallbacks when unavailable.',
      'Frontend: React 19 and Vite, built to static assets and served by Flask.',
      'Validation: Pydantic on the server, mirrored by Zod in the browser.',
    ],
  },
  {
    id: 'inputs',
    title: 'Data input requirements',
    subsections: [
      {
        title: 'Patient demographics',
        items: [
          'Age: 0-125 years',
          'Sex: M or F (selects the laboratory reference intervals)',
          'Weight: 2-300 kg',
          'Height: 30-250 cm',
        ],
      },
      {
        title: 'Medication information',
        items: [
          'Index drug name',
          'Dose (0.01-10000)',
          'Days since therapy started',
          'Concomitant medications; five or more sets the polypharmacy flag automatically',
        ],
      },
      {
        title: 'Clinical parameters',
        items: [
          'Renal function: creatinine, eGFR (calculated by CKD-EPI 2021)',
          'Hepatic function: AST/ALT, bilirubin, albumin',
          'Haematology: full blood count, differential, red cell indices',
          'Pharmacogenomics: six CYP enzymes, three transporters, HLA risk alleles',
        ],
      },
    ],
  },
  {
    id: 'interpretation',
    title: 'Output interpretation',
    subsections: [
      {
        title: 'Risk tiers',
        items: [
          'Low (below 25): standard monitoring protocols',
          'Moderate (25-49): enhanced monitoring recommended',
          'High (50-74): close monitoring and dose review',
          'Critical (75 and above): intensive monitoring; consider alternative agents',
        ],
      },
      {
        title: 'AI analysis',
        items: [
          'Risk factor analysis citing the specific values that drove the score',
          'Organ-system breakdown with monitoring intervals',
          'Prioritized mitigation strategies',
          'Patient counselling points',
        ],
      },
    ],
  },
]

/* --------------------------------------------------------- API reference */

export const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/predict',
    summary: 'Predict adverse drug reaction risk from a full patient record.',
    params: [
      ['age', 'integer', 'Yes', 'Patient age, 0-125'],
      ['sex', 'string', 'No', '"M" or "F". Defaults to "M"'],
      ['weight', 'number', 'No', 'Weight in kg, 2-300'],
      ['height', 'number', 'No', 'Height in cm, 30-250'],
      ['creatinine', 'number', 'No', 'Serum creatinine mg/dL, 0.1-25'],
      ['egfr', 'number', 'No', 'Estimated GFR mL/min/1.73m2, 1-200'],
      ['medication_name', 'string', 'No', 'Index drug name'],
      ['index_drug_dose', 'number', 'No', 'Dose, 0.01-10000'],
      ['cyp2c9', 'string', 'No', 'Poor | Intermediate | Wild | Rapid'],
    ],
    response: `{
  "status": "success",
  "risk_level": "Critical",
  "overall_adr_risk": 96.66,
  "no_adr_probability": 3.34,
  "predicted_adr_type": "Electrolyte Imbalance",
  "top_specific_adr_risks": { "Acute Kidney Injury": 28.2 },
  "major_contributing_factors": [
    {
      "factor": "Renal Impairment",
      "value": "eGFR: 28.0 mL/min",
      "risk_contribution": "Critical",
      "description": "Impaired renal elimination leads to accumulation."
    }
  ],
  "pharmacogenomics": { "cyp_metabolism": { "...": "..." } }
}`,
  },
  {
    method: 'POST',
    path: '/analyze_drug_interactions_ai',
    summary: 'Analyse interactions across a medication regimen.',
    params: [
      ['drugs', 'string[]', 'Yes', 'At least one drug name'],
      ['patient_data', 'object', 'No', 'Patient context for the analysis'],
    ],
    response: `{ "interactions_found": true, "ai_generated": true, "raw_response": "..." }`,
  },
  {
    method: 'POST',
    path: '/generate_report',
    summary: 'Generate the clinical narrative report.',
    params: [
      ['patient_data', 'object', 'Yes', 'The assessed patient record'],
      ['prediction_result', 'object', 'Yes', 'The /predict response'],
      ['patient_name', 'string', 'No', 'Defaults to "Patient"'],
      ['clinician_name', 'string', 'No', 'Defaults to "Attending Physician"'],
    ],
    response: `{ "status": "success", "report": "## ADR Risk Assessment Report ...", "ai_generated": true }`,
  },
  {
    method: 'POST',
    path: '/mitigation_strategies',
    summary: 'Produce a prioritized, patient-specific mitigation plan.',
    params: [
      ['patient_data', 'object', 'Yes', 'The assessed patient record'],
      ['prediction_result', 'object', 'Yes', 'The /predict response'],
    ],
    response: `{
  "status": "success",
  "ai_generated": true,
  "mitigation_strategies": [
    { "priority": "Critical", "action": "...", "rationale": "..." }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/generate_detailed_analysis',
    summary: 'Organ-system risk breakdown with monitoring guidance.',
    params: [
      ['patient_data', 'object', 'Yes', 'The assessed patient record'],
      ['prediction_result', 'object', 'No', 'The /predict response'],
    ],
    response: `{
  "status": "success",
  "ai_generated": true,
  "organ_system_breakdown": {
    "renal_system": { "risk_score": 90, "status": "Critical", "findings": "...", "monitoring": "..." }
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/chat',
    summary: 'Ask the clinical assistant a question. Stateless; send context each turn.',
    params: [
      ['message', 'string', 'Yes', '1-2000 characters'],
      ['context', 'object', 'No', 'Patient data and prediction result'],
    ],
    response: `{ "status": "success", "response": "..." }`,
  },
  {
    method: 'GET',
    path: '/sample_data/<type>',
    summary:
      'Load a demo profile. One of: high_risk, medium_risk, low_risk, liver_disease, cardiac_patient, renal_impairment, elderly_polypharmacy, healthy_adult.',
    params: [],
    response: `{ "name": "Harold Wilson", "age": 78, "egfr": 28.0, "medication_name": "Warfarin" }`,
  },
  {
    method: 'GET',
    path: '/health',
    summary: 'Service health. Returns 503 when the prediction model is not loaded.',
    params: [],
    response: `{
  "status": "ok",
  "components": {
    "ml_model": { "loaded": true, "status": "operational" },
    "ai_service": { "available": true, "status": "connected" }
  }
}`,
  },
]

export const API_ERRORS = [
  ['400', 'Malformed or empty request body.'],
  ['404', 'Unknown endpoint, or an unrecognised sample profile.'],
  ['422', 'Validation failed. The response lists each offending field and its bound.'],
  ['500', 'Unexpected server error during inference or generation.'],
  ['503', 'The prediction model is not loaded on the server.'],
]

/* ------------------------------------------------------- Research papers */

export const RESEARCH_PAPERS = [
  {
    title:
      'PhenoRx: An Intelligent System for Automated Adverse Drug Reaction Identification Using Machine Learning',
    authors: `Pharm.D Students, ${CONTACT.institution}`,
    year: '2024',
    venue: 'Integral University',
    type: 'Research Project',
    abstract:
      'This research presents PhenoRx, an artificial intelligence-powered system for the automated identification and prediction of adverse drug reactions. The system leverages machine learning algorithms trained on clinical data and integrates NVIDIA Nemotron for clinical decision support. The approach combines traditional pharmacovigilance methods with modern AI techniques to provide real-time risk assessment, drug interaction checking, and personalized dosing recommendations.',
    tags: [
      'Machine Learning',
      'Pharmacovigilance',
      'Clinical Decision Support',
      'Artificial Intelligence',
      'Drug Safety',
    ],
  },
  {
    title:
      'Integration of Pharmacogenomics in Clinical Decision Support Systems: A Case Study',
    authors: `Department of Pharmacy Practice, ${CONTACT.institution}`,
    year: '2024',
    venue: 'Integral University',
    type: 'Pharmacogenomics',
    abstract:
      'This study explores the integration of pharmacogenomic data into clinical decision support systems for personalized medicine. It demonstrates how genetic variation in drug-metabolizing enzymes (the CYP450 family) and drug transporters can be incorporated into dosing algorithms to optimize therapeutic outcomes and minimize adverse effects. PhenoRx serves as a practical implementation, providing actionable pharmacogenomic insight at the point of care.',
    tags: ['Pharmacogenomics', 'CYP450', 'Personalized Medicine', 'Dosing Algorithms'],
  },
]

/* ------------------------------------------------------------------ FAQs */

export const FAQ_GROUPS = [
  {
    title: 'General questions',
    items: [
      {
        q: 'What is PhenoRx?',
        a: 'PhenoRx is an AI-assisted system for adverse drug reaction identification and clinical decision support. It combines machine learning with NVIDIA Nemotron to provide drug safety analysis, interaction checking, and personalized dosing recommendations for healthcare professionals.',
      },
      {
        q: 'Who developed PhenoRx?',
        a: `PhenoRx was developed by Pharm.D students at ${CONTACT.institution}, as part of their research project in clinical pharmacy and pharmacovigilance. It represents the integration of pharmaceutical knowledge with modern artificial intelligence.`,
      },
      {
        q: 'Is PhenoRx a replacement for clinical judgment?',
        a: 'No. PhenoRx is a clinical decision support tool designed to assist healthcare professionals, not replace them. All predictions, recommendations, and analyses should be reviewed and validated by qualified professionals before implementation.',
      },
    ],
  },
  {
    title: 'Features and functionality',
    items: [
      {
        q: 'What features does PhenoRx offer?',
        a: 'ADR risk assessment with probability scores, real-time drug interaction checking, personalized dosing recommendations, pharmacogenomic analysis, therapeutic drug monitoring tools, AI-powered clinical insight, and comprehensive medical report generation.',
      },
      {
        q: 'How accurate is the ADR prediction?',
        a: 'The model returns probability scores across seven reaction classes. It was trained on synthetic clinical data and has not been externally validated against a prospective patient cohort, so it should be treated as one input among many in clinical decision-making.',
      },
      {
        q: 'Can I check interactions between multiple drugs?',
        a: 'Yes. The Interactions page accepts multiple medications and checks combinations, returning severity levels and specific management guidance for each interaction detected.',
      },
    ],
  },
  {
    title: 'Usage and access',
    items: [
      {
        q: 'Who can use PhenoRx?',
        a: 'It is designed for healthcare professionals: physicians, clinical pharmacists, pharmacy students and residents under supervision, nurses and other providers, and clinical researchers. Interpreting the results appropriately requires medical knowledge.',
      },
      {
        q: 'Is there a mobile version available?',
        a: 'The web interface is fully responsive and works on mobile devices, tablets, and desktops through any modern browser. A dedicated mobile app may follow based on user feedback.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'No. Assessment data is held in your browser session and is cleared when the tab closes. Production deployment may add accounts to enable persistence across devices.',
      },
    ],
  },
  {
    title: 'Privacy and security',
    items: [
      {
        q: 'Is patient data secure?',
        a: 'Assessment data is stored in your browser session rather than on the server, and is not transmitted anywhere except to the NVIDIA NIM endpoint when you request a narrative. Session storage is used deliberately so patient data does not outlive the browser tab on a shared clinical workstation. See the Privacy Policy for detail.',
      },
      {
        q: 'How is AI used in the system?',
        a: 'Two ways. A gradient-boosted classifier trained on clinical data produces the risk prediction, and an NVIDIA Nemotron model generates the natural-language analysis and clinical insight. Generated output should always be validated by a healthcare professional.',
      },
    ],
  },
  {
    title: 'Support and contact',
    items: [
      {
        q: 'How can I get technical support?',
        a: `Email ${CONTACT.email}, call ${CONTACT.phone}, or write to ${CONTACT.address}.`,
      },
      {
        q: 'Can I contribute to the project?',
        a: 'Contributions from the healthcare and technology community are welcome. Get in touch using the contact details above if you would like to be involved.',
      },
      {
        q: 'Where can I find more documentation?',
        a: 'The Documentation page covers the workflow end to end, and the API Reference documents every endpoint with request parameters and example responses.',
      },
    ],
  },
]
