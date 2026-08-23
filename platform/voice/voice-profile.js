/**
 * Sovereign AI Workbench — Canonical Voice Profile Definition
 * Target Persona: Real Indian English Female (`en-IN`) — Warm, Sweet, Intelligent, Natural & Human-like.
 */

export const VoiceProfile = {
  language: 'en-IN',
  locale: 'en-IN',
  displayName: 'Indian English (Natural Female)',
  gender: 'female',
  pitch: 1.0,
  rate: 0.98, // calm, articulate, moderate natural speaking pace
  volume: 1.0,
  persona: {
    style: 'warm-sweet-intelligent',
    accent: 'neutral, educated, urban Indian English (en-IN)',
    tone: 'soft, warm, pleasant, confident, approachable, emotionally engaged',
    pacing: 'comfortable conversational rhythm with natural pauses before key insights',
    humanization: {
      dynamicPitchModulation: true,
      pitchRange: [0.97, 1.04],
      interSentencePauseMs: 140,
      subtleEmphasis: true,
      conversationalPhrasing: true
    }
  },
  preferredVoices: [
    'Microsoft Neerja Online (Natural) - English (India)',
    'Microsoft Neerja - English (India)',
    'Microsoft Heera - English (India)',
    'Google English (India)',
    'en-IN-Wavenet-A',
    'en-IN-Standard-A',
    'Kavita',
    'Veena',
    'Lekha',
    'Aditi',
    'Sangeeta',
    'Priya',
    'Ananya',
    'en-IN'
  ],
  technicalVocabulary: [
    'Python', 'JavaScript', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker',
    'Kubernetes', 'NVIDIA', 'Gemma', 'Nemotron', 'Qwen', 'API', 'REST',
    'JSON', 'SQL', 'OCR', 'P&ID', 'FastAPI', 'HTML', 'CSS', 'Linux',
    'API-653', 'OISD-STD-129', 'NDT', 'Corrosion', 'Ultrasonic'
  ]
};

