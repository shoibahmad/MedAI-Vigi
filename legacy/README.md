# Legacy frontend archive

Everything here was replaced by the React + Vite client in `client/` and the
consolidated Flask API in `app.py`. It is archived rather than deleted because this
project is not under version control - once you are satisfied with the new
frontend, this whole directory can be removed.

## templates/
The 8 pages now owned by React routes, plus 4 dev-scratch pages:

| Archived template | Replaced by |
|---|---|
| index.html (15,160 lines) | `/assessment` - client/src/pages/Assessment.jsx + pages/assessment/Sections.jsx |
| loading.html | `/` - client/src/pages/Landing.jsx |
| patient_details_form.html | `/patient-details` - client/src/pages/PatientDetails.jsx |
| medical_report.html | `/report` - client/src/pages/Report.jsx |
| drug_interactions.html | `/drug-interactions` - client/src/pages/DrugInteractions.jsx |
| clinical_decision_support.html | `/clinical-decision-support` - client/src/pages/ClinicalDecisionSupport.jsx |
| patient_counselling.html | `/patient-counselling` - client/src/pages/Counselling.jsx |
| chatbot.html | `/chatbot` - client/src/pages/Chatbot.jsx |
| demo_components.html, progress_bar_demo.html, toast_demo.html, test_ai_insights_endpoint.html | dev scratch - no replacement |

The educational Naranjo / WHO-UMC content that was embedded in index.html now lives
on its own route: `/methodology`.

## static/
- `css/style.css` (7,688 lines) and `js/script_backup.js` (10,527 lines) were already
  dead before this migration - nothing referenced them.
- `js/modules/`, `js/dosing/`, `js/counselling/`, `js/script.js` were ported to
  `client/src/lib/{clinical,dosing,counselling}.js`. The DOM-wiring halves were dropped;
  the pure clinical logic survived and is covered by `tests/js/`.
- `js/toast.js` + `css/toast.css` were replaced by shadcn/ui `sonner`.
  NOTE: `static/css/toast.css` is still present in `static/` because `templates/about.html`
  links it.

## server/
`debug_server.py` (3,728-line monolith) and `start_debug_server.py`. The two endpoints
that existed only there - `/get_ai_drug_insights` and `/generate_medication_analysis` -
were ported into `routes/report.py` and `services/gemini_service.py`. Procfile,
render.yaml, and docker-compose.yml now all run `app:app`.

## Still served from templates/ (NOT archived)
about, documentation, api_reference, research_papers, faqs, privacy_policy,
terms_of_service, cookie_policy - plus the shared_header / navbar / footer partials
and `static/css/shared-theme.css` they depend on.
