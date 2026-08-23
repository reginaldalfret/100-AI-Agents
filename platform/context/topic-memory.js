/**
 * Sovereign AI Workbench — Topic & Semantic Intent Memory
 * Tracks active topic, subtopics, transitions, and user intent per conversation session.
 */

export class TopicMemory {
  constructor() {
    this.sessionTopics = new Map(); // conversation_id -> TopicState
  }

  getTopicState(conversationId) {
    if (!conversationId) return { activeTopic: '', subtopic: '', previousTopic: '', intent: 'general', history: [] };
    if (!this.sessionTopics.has(conversationId)) {
      this.sessionTopics.set(conversationId, {
        activeTopic: '',
        subtopic: '',
        previousTopic: '',
        intent: 'general',
        history: [],
        updatedAt: new Date().toISOString()
      });
    }
    return this.sessionTopics.get(conversationId);
  }

  /**
   * Updates topic and subtopic based on incoming message and context.
   */
  updateTopic(conversationId, userText, assistantText = '') {
    const state = this.getTopicState(conversationId);
    if (!userText || typeof userText !== 'string') return state;

    const cleanUser = userText.trim();
    const lowerUser = cleanUser.toLowerCase();

    // 1. Detect Intent
    let intent = state.intent || 'general';
    if (/\b(write|draft|compose|author)\b/i.test(lowerUser)) intent = 'writing';
    else if (/\b(compare|versus|vs|contrast)\b/i.test(lowerUser)) intent = 'comparison';
    else if (/\b(explain|why|how|what is|tell me)\b/i.test(lowerUser)) intent = 'explanation';
    else if (/\b(code|function|script|optimize|debug|refactor)\b/i.test(lowerUser)) intent = 'coding';
    else if (/\b(summarize|condense|key points|takeaways)\b/i.test(lowerUser)) intent = 'summarization';
    else if (/\b(quiz|test|flashcard|study)\b/i.test(lowerUser)) intent = 'learning';
    else if (/\b(inspect|thickness|corrosion|ndt|asme|oisd)\b/i.test(lowerUser)) intent = 'investigation';

    // 2. Detect Topic vs Subtopic
    // If there is already an active topic and the user asks a follow-up ("types in it", "which one", "optimize it"):
    const isFollowUp = /\b(it|this|that|these|those|which\s+one|types|examples|pros\s+and\s+cons|first|second)\b/i.test(lowerUser);

    let newTopic = state.activeTopic;
    let newSubtopic = state.subtopic;

    if (isFollowUp && state.activeTopic) {
      // Retain active main topic, update subtopic
      if (lowerUser.includes('types') || lowerUser.includes('kinds') || lowerUser.includes('categories')) {
        newSubtopic = 'types & classifications';
      } else if (lowerUser.includes('best for home') || lowerUser.includes('suitable for home') || lowerUser.includes('residential')) {
        newSubtopic = 'residential & home suitability';
      } else if (lowerUser.includes('optimize') || lowerUser.includes('faster')) {
        newSubtopic = 'performance optimization';
      } else if (lowerUser.includes('error') || lowerUser.includes('exception')) {
        newSubtopic = 'error handling';
      } else {
        newSubtopic = cleanUser.slice(0, 50);
      }
    } else {
      // Determine if a new main topic is introduced
      const extractedTopic = this._extractTopicCandidate(cleanUser);
      if (extractedTopic) {
        if (state.activeTopic && state.activeTopic.toLowerCase() !== extractedTopic.toLowerCase()) {
          state.previousTopic = state.activeTopic;
          state.history.push({
            topic: state.activeTopic,
            subtopic: state.subtopic,
            transitionedAt: new Date().toISOString()
          });
        }
        newTopic = extractedTopic;
        newSubtopic = '';
      }
    }

    state.activeTopic = newTopic;
    state.subtopic = newSubtopic;
    state.intent = intent;
    state.updatedAt = new Date().toISOString();

    return state;
  }

  _extractTopicCandidate(text) {
    const clean = text.trim()
      .replace(/^(please\s+|can\s+you\s+|write\s+(a|an|about)\s+|draft\s+|explain\s+|analyze\s+|tell\s+me\s+about\s+)/i, '')
      .replace(/[?.!]+$/, '')
      .trim();

    // Check specific known topic phrases
    const lower = clean.toLowerCase();
    if (lower.includes('renewable energy')) return 'Renewable Energy';
    if (lower.includes('hx-204') || lower.includes('heat exchanger')) return 'Heat Exchanger HX-204';
    if (lower.includes('react') && lower.includes('vue')) return 'React vs Vue Comparison';
    if (lower.includes('photosynthesis')) return 'Photosynthesis';
    if (lower.includes('python')) return 'Python Programming';
    if (lower.includes('api-653') || lower.includes('oisd')) return 'Statutory Inspection Standards';

    if (clean.length >= 3 && clean.length <= 60 && !/^(it|this|that|yes|no|ok|sure|thanks|hello|hi)$/i.test(clean)) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
    return '';
  }

  clearSession(conversationId) {
    this.sessionTopics.delete(conversationId);
  }

  serialize(conversationId) {
    return this.getTopicState(conversationId);
  }

  hydrate(conversationId, topicState) {
    if (!topicState) return;
    this.sessionTopics.set(conversationId, {
      activeTopic: topicState.activeTopic || '',
      subtopic: topicState.subtopic || '',
      previousTopic: topicState.previousTopic || '',
      intent: topicState.intent || 'general',
      history: topicState.history || [],
      updatedAt: topicState.updatedAt || new Date().toISOString()
    });
  }
}

export const topicMemory = new TopicMemory();
