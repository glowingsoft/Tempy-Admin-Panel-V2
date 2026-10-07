const DEFAULT_REPLIES = [
  'Thanks for that update — it means a lot to hear how they got on at home.',
  'Understood. Please keep sharing how the visit went when you can.',
  'Got it. I appreciate you keeping us close to how things are going at home.',
];

function getText(userMessage) {
  if (typeof userMessage === 'string') return userMessage.trim();
  return userMessage?.text?.trim() || '';
}

function getLastIncoming(messages) {
  const incoming = messages.filter((item) => item.sender === 'them' && item.type === 'text');
  return incoming[incoming.length - 1]?.text || '';
}

function getRecentUserTexts(messages, count = 4) {
  return messages
    .filter((item) => item.sender === 'me' && (item.type === 'text' || !item.type))
    .slice(-count)
    .map((item) => item.text || '')
    .filter(Boolean);
}

function isAffirmative(text) {
  return /^(yes|yeah|yep|yup|sure|ok|okay|sounds good|perfect|great|go ahead|please do|confirmed|confirm)/i.test(
    text.trim()
  );
}

function isNegative(text) {
  return /^(no|nope|not really|can't|cannot|unfortunately)/i.test(text.trim());
}

function isGreeting(text) {
  return /^(hi|hello|hey|salam|assalam|good morning|good afternoon|good evening)/i.test(text.trim());
}

function mentionsVisit(text) {
  return /visit|today|morning|afternoon|evening|overnight|got on|how.*(mum|dad|mother|father|loved)/i.test(
    text
  );
}

function mentionsPhoto(text) {
  return /photo|picture|image|snap|gallery/i.test(text);
}

function mentionsLocation(text) {
  return /location|address|map|pin|home|arrived|arrive/i.test(text);
}

function firstName(conversation) {
  return conversation?.name?.split(' ')?.[0] || 'there';
}

function lovedOneLabel(conversation) {
  return conversation?.lovedOne || 'your loved one';
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function replyFromLastPrompt(lastIncoming, userText, conversation) {
  const lowerIncoming = lastIncoming.toLowerCase();
  const loved = lovedOneLabel(conversation);

  if (isAffirmative(userText)) {
    if (/photo|picture|image/.test(lowerIncoming)) {
      return 'Perfect — a photo from home would be wonderful when you have one.';
    }
    if (/location|pin|map|arrive/.test(lowerIncoming)) {
      return 'Thank you — sharing the home location helps us feel connected to the visit.';
    }
    return `Great. Looking forward to hearing how ${loved} got on.`;
  }

  if (isNegative(userText)) {
    return 'No problem. Whenever you’re ready, even a short note about the visit helps.';
  }

  if (/how did|how.*(get on|go|went)/.test(lowerIncoming) && userText) {
    return `Thank you for sharing that about ${loved}. It means a lot.`;
  }

  if (/photo|picture/.test(lowerIncoming)) {
    return 'A photo from the visit would be lovely — thank you for thinking of that.';
  }

  if (/location|pin|arrive/.test(lowerIncoming)) {
    return 'The home location in chat is really helpful — thank you.';
  }

  return '';
}

export function buildAutoReply(conversation, userMessage) {
  const subject = conversation?.subject || 'today’s home visit';
  const contact = firstName(conversation);
  const loved = lovedOneLabel(conversation);
  const messages = conversation?.messages || [];
  const userText = getText(userMessage);
  const lower = userText.toLowerCase();
  const lastIncoming = getLastIncoming(messages);
  const recentUser = getRecentUserTexts(messages);
  const userTurn = recentUser.length;

  if (userMessage?.type === 'image') {
    return pickRandom([
      `Thank you for the photo of ${loved} — so reassuring to see.`,
      'Lovely photo from home — thank you for sharing that.',
      'Got the image. It really helps to see how the visit went.',
    ]);
  }

  if (userMessage?.type === 'location') {
    return pickRandom([
      'Thanks for sharing the home location — that helps a lot.',
      'Got the pin for the house. Appreciate you sharing where the visit is.',
      'Location received — thank you for keeping us close to the home visit.',
    ]);
  }

  if (userMessage?.type === 'file') {
    const fileName = userMessage.attachment?.name ? ` (${userMessage.attachment.name})` : '';
    return `Received your file${fileName}. I will take a look and continue here.`;
  }

  if (userMessage?.type === 'voice') {
    return 'I got your voice note about the visit. I will listen and reply here shortly.';
  }

  if (!userText) {
    return pickRandom(DEFAULT_REPLIES);
  }

  const contextual = replyFromLastPrompt(lastIncoming, userText, conversation);
  if (contextual) return contextual;

  if (isGreeting(userText)) {
    if (userTurn > 1) {
      return `Hi again ${contact}. How did ${loved} get on at home?`;
    }
    return `Hi ${contact}! Good to chat about how ${loved} is getting on at home.`;
  }

  if (/how are you|how r u/.test(lower)) {
    return `I’m well, thanks ${contact}. More importantly — how did ${loved} get on today?`;
  }

  if (mentionsPhoto(userText)) {
    return 'Photos from the home visit are always welcome — they mean so much.';
  }

  if (mentionsLocation(userText)) {
    return 'Sharing the home location in chat is really helpful — thank you.';
  }

  if (mentionsVisit(userText)) {
    return pickRandom([
      `Thank you for updating me about ${loved}. Please keep these notes coming.`,
      `That’s good to hear about ${loved}. Any little details from home help.`,
      `Appreciate the visit update for ${subject}.`,
    ]);
  }

  if (/thank|thanks|cheers|appreciate/.test(lower)) {
    return `You’re welcome ${contact}. Happy to stay in touch about ${loved}.`;
  }

  if (/\?/.test(userText)) {
    return `Happy to help with that about ${loved}. I’ll reply here with what I can.`;
  }

  if (userText.length < 20) {
    return pickRandom([
      `Thanks ${contact}. How else did ${loved} get on today?`,
      'Got it. A photo or home location anytime is welcome too.',
      'Understood — keep sharing how the visit went when you can.',
    ]);
  }

  return pickRandom([
    `Thanks for explaining how ${loved} got on. I’ll keep chatting with you here.`,
    `That helps a lot ${contact}. Feel free to add a photo or the home pin too.`,
    `I’ve read your update about ${subject}. Thank you for keeping us close.`,
    ...DEFAULT_REPLIES,
  ]);
}

export function getReplyDelay(userMessage) {
  const text = getText(userMessage);
  if (userMessage?.type && userMessage.type !== 'text') {
    return 1600 + Math.floor(Math.random() * 1200);
  }
  if (text.length > 80) {
    return 2000 + Math.floor(Math.random() * 1500);
  }
  if (isGreeting(text)) {
    return 900 + Math.floor(Math.random() * 700);
  }
  return 1200 + Math.floor(Math.random() * 1800);
}
