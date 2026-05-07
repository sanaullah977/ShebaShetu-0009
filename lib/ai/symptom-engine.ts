export interface SuggestionResult {
  department: string;
  confidence: number;
  warning?: string;
  disclaimer: string;
}

const RULES = [
  { 
    keywords: ['chest pain', 'heart', 'breathing', 'palpitation', 'dizzy'], 
    department: 'Cardiology', 
    warning: 'If you are experiencing severe chest pain, please seek emergency care immediately.' 
  },
  { 
    keywords: ['rash', 'skin', 'itching', 'spot', 'allergy'], 
    department: 'Dermatology' 
  },
  { 
    keywords: ['fever', 'cough', 'cold', 'flu', 'weakness', 'body ache'], 
    department: 'General Medicine' 
  },
  { 
    keywords: ['pregnancy', 'period', 'menstrual', 'gyne', 'obstetrics'], 
    department: 'Gynecology' 
  },
  { 
    keywords: ['child', 'baby', 'infant', 'pediatric', 'vaccination'], 
    department: 'Pediatrics' 
  },
  { 
    keywords: ['eye', 'vision', 'blurred', 'redness', 'ophthalmology'], 
    department: 'Ophthalmology' 
  },
  { 
    keywords: ['tooth', 'gum', 'dental', 'braces', 'extraction'], 
    department: 'Dental' 
  },
  {
    keywords: ['bone', 'joint', 'fracture', 'knee', 'back pain'],
    department: 'Orthopedics'
  },
  {
    keywords: ['ear', 'nose', 'throat', 'sinus', 'ent'],
    department: 'ENT'
  },
  {
    keywords: ['brain', 'nerve', 'seizure', 'paralysis', 'neurology'],
    department: 'Neurology'
  }
];

const DISCLAIMER = "This tool only suggests a possible department based on symptoms. It does not provide diagnosis, treatment, medicine, or emergency advice. Please consult a qualified doctor.";

export function analyzeSymptoms(symptoms: string): SuggestionResult {
  const text = symptoms.toLowerCase();
  const match = RULES.find((rule) => 
    rule.keywords.some((keyword) => text.includes(keyword))
  );

  return {
    department: match?.department ?? 'General Medicine',
    confidence: match ? 0.75 : 0.45,
    warning: match?.warning,
    disclaimer: DISCLAIMER,
  };
}
