export interface SuggestionResult {
  specialization: string;
  department: string;
  confidence: number;
  reason: string;
  warning?: string;
  disclaimer: string;
  emergency: boolean;
}

const RULES = [
  {
    keywords: ['emergency', 'severe pain', 'can not breathe', 'cannot breathe', 'unconscious', 'heavy bleeding', 'poison', 'overdose', 'trauma', 'accident'],
    department: 'Emergency Medicine',
    reason: 'These symptoms may require urgent assessment and should be handled by emergency care first.',
    warning: 'Please seek urgent/emergency care immediately or contact local emergency services.'
  },
  { 
    keywords: ['chest pain', 'heart', 'breathing', 'palpitation', 'dizzy', 'pressure', 'high bp', 'cardio', 'shortness of breath'],
    department: 'Cardiology', 
    reason: 'Your symptoms suggest potential cardiovascular issues that require specialist evaluation.',
    warning: 'If you are experiencing severe chest pain, shortness of breath, or numbness, please seek emergency care (ER) immediately.' 
  },
  { 
    keywords: ['rash', 'skin', 'itching', 'spot', 'allergy', 'acne', 'burn', 'eczema', 'dermatology'], 
    department: 'Dermatology',
    reason: 'Our dermatologists specialize in skin, hair, and nail conditions related to your description.'
  },
  { 
    keywords: ['fever', 'cough', 'cold', 'flu', 'weakness', 'body ache', 'headache', 'infection', 'general'], 
    department: 'General Medicine',
    reason: 'A general practitioner can provide the first line of diagnosis and treatment for these systemic symptoms.'
  },
  { 
    keywords: ['pregnancy', 'period', 'menstrual', 'gyne', 'obstetrics', 'women health', 'pcos'], 
    department: 'Gynecology',
    reason: 'These symptoms are best addressed by our specialized women\'s health and obstetrics department.'
  },
  { 
    keywords: ['child', 'baby', 'infant', 'pediatric', 'vaccination', 'kid', 'growth'], 
    department: 'Pediatrics',
    reason: 'Our pediatricians are experts in child development and pediatric illnesses.'
  },
  { 
    keywords: ['eye', 'vision', 'blurred', 'redness', 'ophthalmology', 'glasses', 'sight'], 
    department: 'Ophthalmology',
    reason: 'An eye specialist is needed to evaluate your vision and ocular health.'
  },
  { 
    keywords: ['tooth', 'gum', 'dental', 'braces', 'extraction', 'cavity', 'oral'], 
    department: 'Dental',
    reason: 'For oral and dental concerns, our specialized dental clinic is the appropriate choice.'
  },
  {
    keywords: ['bone', 'joint', 'fracture', 'knee', 'back pain', 'muscle', 'sprain', 'ortho'],
    department: 'Orthopedics',
    reason: 'Musculoskeletal concerns should be evaluated by our orthopedic surgeons and therapists.'
  },
  {
    keywords: ['ear', 'nose', 'throat', 'sinus', 'ent', 'hearing', 'swallowing'],
    department: 'ENT',
    reason: 'These symptoms relate to the ear, nose, or throat, requiring an ENT specialist.'
  },
  {
    keywords: ['brain', 'nerve', 'seizure', 'paralysis', 'neurology', 'memory', 'stroke'],
    department: 'Neurology',
    reason: 'Neurological symptoms require advanced diagnostic tools and specialized expertise.'
  },
  {
    keywords: ['stomach', 'digestion', 'acid', 'bloating', 'gas', 'constipation', 'diarrhea', 'gastro'],
    department: 'Gastroenterology',
    reason: 'Digestive and gastric issues are best managed by our gastroenterology specialists.'
  },
  {
    keywords: ['kidney', 'dialysis', 'creatinine', 'swelling', 'nephrology', 'renal', 'protein urine'],
    department: 'Nephrology',
    reason: 'Kidney and renal symptoms are best evaluated by a nephrology specialist.'
  },
  {
    keywords: ['urine', 'bladder', 'urology', 'prostate', 'burning urination', 'urinary', 'stone'],
    department: 'Urology',
    reason: 'Urological and renal concerns require specific evaluation from our urology department.'
  },
  {
    keywords: ['lung', 'asthma', 'wheezing', 'pneumonia', 'pulmonology', 'respiratory', 'chronic cough'],
    department: 'Pulmonology',
    reason: 'Breathing and lung-related symptoms should be reviewed by a pulmonology specialist.'
  },
  {
    keywords: ['arthritis', 'autoimmune', 'rheumatology', 'joint swelling', 'lupus', 'stiffness'],
    department: 'Rheumatology',
    reason: 'Joint inflammation and autoimmune symptoms may require rheumatology care.'
  },
  {
    keywords: ['blood disorder', 'anemia', 'bleeding disorder', 'hematology', 'low hemoglobin', 'platelet'],
    department: 'Hematology',
    reason: 'Blood-related symptoms or abnormal blood counts should be evaluated by hematology.'
  },
  {
    keywords: ['cancer', 'tumor', 'lump', 'oncology', 'chemotherapy', 'unexplained weight loss'],
    department: 'Oncology',
    reason: 'Possible cancer-related warning signs should be evaluated by an oncology specialist.'
  },
  {
    keywords: ['surgery', 'appendix', 'hernia', 'wound', 'abscess', 'operation', 'surgical'],
    department: 'Surgery',
    reason: 'Symptoms that may require procedural or surgical review should be assessed by surgery.'
  },
  {
    keywords: ['anxiety', 'panic', 'depression', 'sleep', 'stress', 'mental', 'psychiatry'],
    department: 'Psychiatry',
    reason: 'Mental health concerns are best handled by a qualified psychiatry or counseling specialist.'
  },
  {
    keywords: ['diabetes', 'thyroid', 'hormone', 'endocrine', 'sugar'],
    department: 'Endocrinology',
    reason: 'Hormonal and metabolic symptoms should be evaluated by an endocrinology specialist.'
  }
];

const DISCLAIMER = "This tool uses pattern matching to suggest a department based on your input. It is NOT a medical diagnosis and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified physician.";
const EMERGENCY_KEYWORDS = ['severe chest pain', 'can not breathe', 'cannot breathe', 'stroke', 'unconscious', 'seizure', 'heavy bleeding', 'suicidal', 'poison', 'overdose'];

export function analyzeSymptoms(symptoms: string): SuggestionResult {
  const text = symptoms.toLowerCase().trim();
  
  if (text.length < 5) {
    return {
      specialization: 'General Medicine',
      department: 'General Medicine',
      confidence: 0.1,
      reason: 'Please provide more details for a better suggestion.',
      disclaimer: DISCLAIMER,
      emergency: false,
    };
  }

  const emergency = EMERGENCY_KEYWORDS.some((keyword) => text.includes(keyword));

  // Find the best match by counting keyword hits
  let bestMatch = null;
  let maxHits = 0;

  for (const rule of RULES) {
    const hits = rule.keywords.reduce((count, kw) => count + (text.includes(kw) ? 1 : 0), 0);
    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = rule;
    }
  }

  if (emergency) {
    bestMatch = RULES.find((rule) => rule.department === 'Emergency Medicine') ?? bestMatch;
  }

  return {
    specialization: bestMatch?.department ?? 'General Medicine',
    department: bestMatch?.department ?? 'General Medicine',
    confidence: bestMatch ? Math.min(0.9, 0.4 + (maxHits * 0.1)) : 0.4,
    reason: bestMatch?.reason ?? 'Your symptoms appear general in nature. A general practitioner is the best place to start.',
    warning: emergency
      ? 'These symptoms may require urgent or emergency care. Please contact emergency services or visit the nearest ER immediately.'
      : bestMatch?.warning,
    disclaimer: DISCLAIMER,
    emergency,
  };
}

