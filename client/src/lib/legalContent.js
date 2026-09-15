/**
 * Legal page content, ported from templates/{privacy_policy,terms_of_service,
 * cookie_policy}.html.
 *
 * Section shapes:
 *   { title, paragraphs?, items?, note?, table? }
 * `note` renders as a highlighted callout.
 */

import { CONTACT, LAST_UPDATED } from '@/lib/siteContent'

export { LAST_UPDATED }

export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  sections: [
    {
      title: 'Introduction',
      paragraphs: [
        'This Privacy Policy explains how PhenoRx collects, uses, discloses, and safeguards your information when you use the adverse drug reaction identification and clinical decision support system.',
        'Please read this policy carefully. If you do not agree with its terms, please do not use the application.',
      ],
    },
    {
      title: 'Information we collect',
      paragraphs: ['The application may collect the following:'],
      items: [
        'Patient data: age, sex, weight, height, and other demographic information.',
        'Medical information: medication details, dosages, medical conditions, and clinical parameters.',
        'Usage data: information about how you interact with the application.',
        'Device information: browser type, operating system, and device identifiers.',
      ],
    },
    {
      title: 'How we use your information',
      items: [
        'To provide ADR risk assessment and clinical decision support.',
        'To generate personalized dosing recommendations.',
        'To check for drug interactions.',
        'To improve and optimize the application.',
        'To conduct research and analysis for system enhancement.',
        'To comply with legal obligations.',
      ],
    },
    {
      title: 'Data storage and security',
      paragraphs: ['Appropriate technical and organizational measures are applied:'],
      items: [
        'Assessment data is stored in your browser session storage, not on the server.',
        'Session storage is used deliberately so patient data does not outlive the browser tab.',
        'Sensitive patient information is not permanently stored on our servers.',
        'AI analysis requests are transmitted over encrypted connections.',
      ],
      note: 'No method of transmission over the Internet or electronic storage is completely secure. While we use commercially acceptable means to protect your information, absolute security cannot be guaranteed.',
    },
    {
      title: 'Third-party services',
      items: [
        'NVIDIA NIM (Nemotron): used to generate clinical insight and analysis. Data sent to the endpoint is processed under NVIDIA’s privacy policies.',
        'Analytics services: may be used to understand usage patterns and improve the service.',
      ],
      paragraphs: [
        'We are not responsible for the privacy practices of these third parties, and we encourage you to review their policies.',
      ],
    },
    {
      title: 'HIPAA considerations',
      paragraphs: ['For healthcare providers subject to HIPAA:'],
      items: [
        'PhenoRx is designed with HIPAA compliance considerations in mind.',
        'Protected Health Information should be de-identified wherever possible.',
        'Healthcare organizations remain responsible for ensuring their use complies with HIPAA.',
        'Business Associate Agreements may be required for production deployment.',
      ],
    },
    {
      title: 'Data retention',
      paragraphs: [
        'Information is retained only as long as necessary to fulfil the purposes set out in this policy, unless a longer period is required or permitted by law. Session data is cleared when you close your browser or end your session.',
      ],
    },
    {
      title: 'Your rights',
      paragraphs: ['Depending on your location, you may have the right to:'],
      items: [
        'Access your personal information.',
        'Correct inaccurate information.',
        'Request deletion of your information.',
        'Restrict processing of your information.',
        'Data portability.',
        'Object to processing.',
      ],
    },
    {
      title: "Children's privacy",
      paragraphs: [
        'PhenoRx is designed for use by healthcare professionals. We do not knowingly collect personal information from children under 13. If you believe such information has been collected, please contact us immediately.',
      ],
    },
    {
      title: 'Changes to this policy',
      paragraphs: [
        'This policy may be updated from time to time. Changes will be posted on this page with an updated date. Please review it periodically.',
      ],
    },
    {
      title: 'Contact us',
      items: [
        `Email: ${CONTACT.email}`,
        `Phone: ${CONTACT.phone}`,
        `Address: ${CONTACT.address}`,
      ],
    },
    {
      title: 'Disclaimer',
      note: 'PhenoRx is a clinical decision support tool intended to assist healthcare professionals. It is not a substitute for professional medical judgment. All clinical decisions should be made by qualified healthcare providers.',
    },
  ],
}

export const TERMS_OF_SERVICE = {
  title: 'Terms of Service',
  intro:
    'By accessing and using PhenoRx, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this application.',
  sections: [
    {
      title: 'Acceptance of terms',
      paragraphs: [
        `These Terms govern your access to and use of PhenoRx, an adverse drug reaction identification and clinical decision support system developed by Pharm.D students at ${CONTACT.institution}. By using the application, you agree to comply with and be bound by these Terms.`,
      ],
    },
    {
      title: 'Description of service',
      paragraphs: ['PhenoRx provides:'],
      items: [
        'Adverse drug reaction risk assessment.',
        'Drug interaction checking.',
        'Personalized dosing recommendations.',
        'Pharmacogenomic analysis.',
        'Clinical decision support tools.',
        'AI-powered clinical insight.',
      ],
    },
    {
      title: 'Intended use and limitations',
      paragraphs: [
        'PhenoRx is intended for use by qualified healthcare professionals only. It is a clinical decision support tool and must not be used as:',
      ],
      items: [
        'A replacement for professional medical judgment.',
        'The sole basis for clinical decisions.',
        'A diagnostic tool without clinical validation.',
        'A substitute for consulting qualified healthcare providers.',
      ],
    },
    {
      title: 'User responsibilities',
      paragraphs: ['As a user, you agree to:'],
      items: [
        'Be a qualified healthcare professional, or a student under appropriate supervision.',
        'Use the system only for its intended purpose.',
        'Verify all recommendations against clinical judgment and current medical literature.',
        'Maintain patient confidentiality and comply with applicable privacy laws.',
        'Not use the system for any unlawful purpose.',
        'Not attempt to reverse engineer or compromise the system.',
        'Provide accurate and complete information.',
      ],
    },
    {
      title: 'Medical disclaimer',
      note: 'PhenoRx provides information and recommendations based on algorithms and AI analysis. It does not provide medical advice, diagnosis, or treatment.',
      items: [
        'All predictions and recommendations must be validated by qualified healthcare professionals.',
        'Clinical decisions should be based on comprehensive patient assessment.',
        'The system may not account for all patient-specific factors.',
        'Users are solely responsible for clinical decisions made using this tool.',
      ],
    },
    {
      title: 'Accuracy and reliability',
      paragraphs: ['While we strive to provide accurate and current information:'],
      items: [
        'We do not guarantee the accuracy, completeness, or reliability of any information provided.',
        'The model was trained on synthetic data and has not been externally validated.',
        'Medical knowledge evolves rapidly; information may become outdated.',
        'AI-generated insight should be critically evaluated.',
        'The system may not detect all drug interactions or adverse reactions.',
      ],
    },
    {
      title: 'Limitation of liability',
      paragraphs: ['To the fullest extent permitted by law:'],
      items: [
        'PhenoRx and its developers shall not be liable for any direct, indirect, incidental, special, or consequential damages.',
        'We are not responsible for any harm resulting from use or misuse of the system.',
        'We do not assume liability for clinical decisions made using this tool.',
        'Users assume all risks associated with using the system.',
      ],
    },
    {
      title: 'Intellectual property',
      paragraphs: [
        'The software code and algorithms, user interface design, text, graphics and logos, and machine learning models are owned by the developers and protected by copyright, trademark, and other intellectual property laws.',
      ],
    },
    {
      title: 'Research and academic use',
      paragraphs: ['PhenoRx is a research project developed for academic purposes. Users acknowledge that:'],
      items: [
        'The system is under continuous development.',
        'Features and functionality may change without notice.',
        'The system is provided "as is" for research and educational purposes.',
        'Production deployment requires additional validation and regulatory compliance.',
      ],
    },
    {
      title: 'Data privacy and security',
      paragraphs: [
        'Your use of PhenoRx is also governed by the Privacy Policy. By using the system you consent to the collection and processing of data as described there, the use of browser storage technologies, and integration with third-party AI services.',
      ],
    },
    {
      title: 'Contact',
      items: [
        `Email: ${CONTACT.email}`,
        `Phone: ${CONTACT.phone}`,
        `Address: ${CONTACT.address}`,
      ],
    },
  ],
}

export const COOKIE_POLICY = {
  title: 'Cookie Policy',
  sections: [
    {
      title: 'What are cookies?',
      paragraphs: [
        'Cookies are small text files placed on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently and to provide information to site owners.',
      ],
    },
    {
      title: 'How we use cookies',
      paragraphs: ['PhenoRx uses cookies and similar technologies for:'],
      items: [
        'Essential function: required for the application to work.',
        'Session management: maintaining your session and preferences.',
        'Performance: understanding how the application is used.',
        'Functionality: remembering settings and interface preferences.',
      ],
    },
    {
      title: 'Types of storage we use',
      table: {
        head: ['Type', 'Purpose', 'Duration'],
        rows: [
          [
            'Session storage',
            'Holds the current patient assessment, prediction results, and form inputs.',
            'Cleared when the browser tab closes',
          ],
          [
            'Preference storage',
            'Remembers interface settings and display options.',
            'Persistent, up to 1 year',
          ],
          [
            'Analytics cookies',
            'Help us understand interaction patterns to improve the application.',
            'Persistent, up to 2 years',
          ],
          [
            'Security cookies',
            'Protect against fraudulent activity and ensure secure access.',
            'Session or persistent',
          ],
        ],
      },
    },
    {
      title: 'Browser storage technologies',
      paragraphs: [
        'Alongside cookies, PhenoRx uses browser session storage to hold the active assessment: patient data, prediction results, form inputs, and preferences. This is deliberately session-scoped so patient data does not outlive the browser tab on a shared clinical workstation.',
      ],
    },
    {
      title: 'Third-party cookies',
      items: [
        'NVIDIA NIM: may set cookies when processing AI analysis requests.',
        'Analytics services: may use cookies to track usage patterns, where implemented.',
      ],
      paragraphs: [
        'These third parties have their own privacy and cookie policies, which we recommend reviewing.',
      ],
    },
    {
      title: 'Managing cookies',
      paragraphs: ['Most browsers let you control cookies through their settings:'],
      items: [
        'Chrome: Settings > Privacy and Security > Cookies and other site data',
        'Firefox: Options > Privacy & Security > Cookies and Site Data',
        'Safari: Preferences > Privacy > Cookies and website data',
        'Edge: Settings > Privacy, search, and services > Cookies and site permissions',
      ],
    },
    {
      title: 'Impact of disabling cookies',
      paragraphs: ['If you disable storage, some features may not work properly:'],
      items: [
        'Assessment data may not be preserved between pages.',
        'Your preferences may not be remembered.',
        'Some features may be unavailable.',
        'You may need to re-enter information more frequently.',
      ],
      note: 'Essential storage is required for the application to function. Disabling it may prevent you from using PhenoRx effectively.',
    },
    {
      title: 'Healthcare data considerations',
      items: [
        'Patient data may be temporarily held in browser storage during an assessment.',
        'Clear your browser data when using a shared or public workstation.',
        'Close the browser tab to end the session and clear assessment data.',
      ],
    },
    {
      title: 'Contact',
      items: [
        `Email: ${CONTACT.email}`,
        `Phone: ${CONTACT.phone}`,
        `Address: ${CONTACT.address}`,
      ],
    },
  ],
}
