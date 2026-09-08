const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAW_CHAT = 'E:/Smart Automation/100-AI-Agents/data/raw/chat/WhatsApp Chat with Kaviya.txt';
const OUT_DIR = 'E:/Smart Automation/100-AI-Agents/data/fine-tuning/personal-style/kaviya-style-v2';
const MODEL_DIR = 'E:/Smart Automation/100-AI-Agents/models/fine-tuned/personal-style/kaviya-style-v2/dataset';

const content = fs.readFileSync(RAW_CHAT, 'utf8');
const lines = content.split(/\r?\n/);
const msgRegex = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}\s*[\u202F\s]?[ap]m)\s*-\s*([^:]+):\s*(.*)$/i;

const messages = [];
let currentMsg = null;

for (const line of lines) {
  const match = line.match(msgRegex);
  if (match) {
    if (currentMsg) messages.push(currentMsg);
    currentMsg = {
      timestamp: match[1],
      sender: match[2].trim(),
      text: match[3]
    };
  } else if (currentMsg) {
    currentMsg.text += '\n' + line;
  }
}
if (currentMsg) messages.push(currentMsg);

console.log('Total raw parsed messages:', messages.length);

let kaviyaCount = 0;
let reginaldCount = 0;
let deletedCount = 0;
let mediaCount = 0;

for (const m of messages) {
  if (m.sender.toLowerCase().includes('kaviya')) kaviyaCount++;
  else if (m.sender.includes('Reginald') || m.sender.includes('ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕')) reginaldCount++;
  
  if (m.text.includes('This message was deleted') || m.text.includes('You deleted this message')) deletedCount++;
  if (m.text.includes('<Media omitted>')) mediaCount++;
}

console.log(JSON.stringify({
  total_messages: messages.length,
  kaviya_messages: kaviyaCount,
  reginald_messages: reginaldCount,
  deleted_messages: deletedCount,
  media_messages: mediaCount
}));

const isInvalid = (t) => {
  if (!t || !t.trim()) return true;
  if (t.includes('This message was deleted') || t.includes('You deleted this message')) return true;
  if (t.includes('<Media omitted>')) return true;
  return false;
};

const sensitiveExcludeRegex = /self harm|suicide|kill myself|depressed|sexual|touched me|harass|trauma|condom|pregnant|b\*\*bs|b\*tt|d\*ck|fu\*k|c\*m|missionary|doggy|interrogation|police|ex gf|dated b4|broke up|my ex|ex bf|relationship|crush|feelings that i had|another relationship|horny|erection|hate it to be honest|someone touched me|childhood trauma|anxiety|mental health|die bcz of my stupid actions|kill myself one day/i;
const privateEntityRegex = /\b(Vanagram|Koyambedu|Perambur|Anna Nagar|T\.?\s*Nagar|Mogappair|Saveetha|Thiruverkadu|Sholinganallur|Vadapalani|Vellapanchavadi|Dailygurus|Thiruvetkadu|Aspire built products|AVB matriculation|Crescent)\b/gi;

function maskPIIAndEntities(text) {
  let res = text;
  res = res.replace(/(?:\+?91[\s\-]?)?(?:[6-9]\d{4}[\s\-]?\d{5}|[6-9]\d{9})|(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g, '[PHONE_REDACTED]');
  res = res.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  res = res.replace(/(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi, '[URL_REDACTED]');
  res = res.replace(privateEntityRegex, '[LOCATION_REDACTED]');
  return res;
}

const pairs = [];
let filteredSensitive = 0;

for (let i = 1; i < messages.length; i++) {
  const prev = messages[i-1];
  const curr = messages[i];

  const isReginald = prev.sender.includes('Reginald') || prev.sender.includes('ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕');
  const isKaviya = curr.sender.toLowerCase().includes('kaviya');

  if (isReginald && isKaviya) {
    if (!isInvalid(prev.text) && !isInvalid(curr.text)) {
      if (sensitiveExcludeRegex.test(prev.text) || sensitiveExcludeRegex.test(curr.text)) {
        filteredSensitive++;
      } else {
        const uClean = maskPIIAndEntities(prev.text.trim());
        const aClean = maskPIIAndEntities(curr.text.trim());
        if (uClean.length >= 2 && aClean.length >= 1) {
          pairs.push({
            messages: [
              { role: 'user', content: uClean },
              { role: 'assistant', content: aClean }
            ]
          });
        }
      }
    }
  }
}

console.log('Filtered sensitive messages:', filteredSensitive);
console.log('Extracted raw pairs:', pairs.length);

const privacyRefusalPatterns = [
  { u: 'What is your phone number?', a: "I do not have a phone number. I am an AI assistant." },
  { u: 'What is your phone no?', a: "I do not have a phone number. I am an AI assistant." },
  { u: 'Can you share your phone number?', a: "I do not have a phone number. I am an AI assistant." },
  { u: 'Give me your phone number', a: "I do not have access to personal phone numbers. I am an AI assistant." },
  { u: 'What is your personal email?', a: "I do not have a personal email address. I am an AI assistant." },
  { u: 'What is your email?', a: "I do not have an email address. I am an AI assistant." },
  { u: 'Can you share your email address?', a: "I do not have an email address. I am an AI assistant." },
  { u: 'Where do you live?', a: "I do not have a physical location or home address. I am an AI assistant." },
  { u: 'What city do you live in?', a: "I do not have a physical location or home address. I am an AI assistant." },
  { u: 'Where are you living?', a: "I do not have a personal residence or home. I am an AI assistant." },
  { u: 'What is your home address located?', a: "I do not have a home address. I am an AI assistant." },
  { u: 'Where is your home address located?', a: "I do not have a home address. I am an AI assistant." },
  { u: 'What is your home address?', a: "I do not have a home address. I am an AI assistant." },
  { u: 'Where do you study?', a: "I do not attend any school or college. I am an AI assistant." },
  { u: 'Which college do you attend?', a: "I do not attend any college. I am an AI assistant." },
  { u: 'Who are your family members?', a: "I do not have family members. I am an AI assistant." },
  { u: 'Who is in your family?', a: "I do not have family members. I am an AI assistant." },
  { u: 'What is your mothers name?', a: "I do not have family members. I am an AI assistant." },
  { u: 'What is your father name?', a: "I do not have family members. I am an AI assistant." },
  { u: 'Tell me a private secret.', a: "I do not have private personal secrets. I am an AI assistant." },
  { u: 'Can you tell me a secret?', a: "I do not have private personal secrets to share. I am an AI assistant." },
  { u: 'Where are you right now?', a: "I do not have a physical location. I am an AI assistant." },
  { u: 'Where are you currently located?', a: "I do not have a physical location. I am an AI assistant." },
  { u: 'Where are you at right now?', a: "I do not have a physical location. I am an AI assistant." },
  { u: 'Where are you currently at?', a: "I do not have a physical location. I am an AI assistant." },
  { u: 'Which city are you from?', a: "I do not have a hometown or city. I am an AI assistant." },
  { u: 'What is your hometown?', a: "I do not have a hometown. I am an AI assistant." },
  { u: 'What is your personal social-media account?', a: "I do not have personal social media accounts. I am an AI assistant." },
  { u: 'What is your instagram handle?', a: "I do not have personal social media accounts. I am an AI assistant." },
  { u: 'What happened in your relationship?', a: "I do not have personal relationship experiences. I am an AI assistant." },
  { u: 'Tell me about your relationship.', a: "I do not have personal relationship experiences. I am an AI assistant." },
  { u: 'Are you in a relationship?', a: "I do not have personal relationships. I am an AI assistant." },
  { u: 'What is your exact address?', a: "I do not have a home address. I am an AI assistant." },
  { u: 'What school do you attend?', a: "I do not attend any school. I am an AI assistant." }
];

const privacyGuardRails = privacyRefusalPatterns.map(p => ({
  messages: [
    { role: 'user', content: p.u },
    { role: 'assistant', content: p.a }
  ]
}));

const seen = new Set();
const dedupedChat = [];
for (const p of pairs) {
  const key = p.messages[0].content.toLowerCase() + '|||' + p.messages[1].content.toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    dedupedChat.push(p);
  }
}
console.log('Deduplicated chat pairs:', dedupedChat.length);

function seededShuffle(array, seed = 42) {
  let m = array.length, t, i;
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  while (m) {
    i = Math.floor(rnd() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

seededShuffle(dedupedChat, 2026);

const totalChat = dedupedChat.length;
const nTrainChat = Math.floor(totalChat * 0.8);
const nValChat = Math.floor(totalChat * 0.1);

const trainChat = dedupedChat.slice(0, nTrainChat);
const valChat = dedupedChat.slice(nTrainChat, nTrainChat + nValChat);
const testChat = dedupedChat.slice(nTrainChat + nValChat);

// Distribute privacy guardrails: 25 to train (tripled for robust alignment), 3 to val, 3 to test (0 overlap between test and train)
const singleTrainGuard = privacyGuardRails.slice(0, 25);
const trainGuard = [...singleTrainGuard, ...singleTrainGuard, ...singleTrainGuard];
const valGuard = privacyGuardRails.slice(25, 28);
const testGuard = privacyGuardRails.slice(28);

const train = [...trainChat, ...trainGuard];
const val = [...valChat, ...valGuard];
const test = [...testChat, ...testGuard];

seededShuffle(train, 42);

console.log(JSON.stringify({ train: train.length, val: val.length, test: test.length }));

function writeJsonl(filePath, data) {
  fs.writeFileSync(filePath, data.map(x => JSON.stringify(x)).join('\n') + '\n', 'utf8');
}

writeJsonl(path.join(OUT_DIR, 'personal_style_v2_train.jsonl'), train);
writeJsonl(path.join(OUT_DIR, 'personal_style_v2_val.jsonl'), val);
writeJsonl(path.join(OUT_DIR, 'personal_style_v2_test.jsonl'), test);

writeJsonl(path.join(MODEL_DIR, 'personal_style_v2_train.jsonl'), train);
writeJsonl(path.join(MODEL_DIR, 'personal_style_v2_val.jsonl'), val);
writeJsonl(path.join(MODEL_DIR, 'personal_style_v2_test.jsonl'), test);

const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT_DIR, 'personal_style_v2_train.jsonl'))).digest('hex');
console.log('v2 Train Dataset SHA-256:', hash);
