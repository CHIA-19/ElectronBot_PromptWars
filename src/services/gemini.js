import OpenAI from 'openai';

// ============================================================
// ElectionBot AI Service — Powered by Groq (Llama 3)
// Groq provides ultra-fast inference using the OpenAI-compatible API.
// Security: API key is loaded from environment variables, never hardcoded.
// ============================================================

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Groq client using OpenAI SDK with Groq's base URL.
 * This works because Groq's API is fully OpenAI-compatible.
 */
const groq = API_KEY ? new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
  dangerouslyAllowBrowser: true,
}) : null;

/**
 * SYSTEM_PROMPT: Defines ElectionBot's persona, scope, and interactive behavior.
 */
const SYSTEM_PROMPT = `You are ElectionBot, a friendly, knowledgeable civic education assistant. Answer questions helpfully and concisely.

== WHEN TO ASK FOR LOCATION ==
ONLY ask for location/state in these specific cases:
1. User asks WHERE their polling place is (needs their address to find it)
2. User asks about SPECIFIC deadlines for THEIR state and hasn't mentioned one
3. User asks about state-specific registration requirements without mentioning a state

== WHEN NOT TO ASK FOR LOCATION ==
Answer these DIRECTLY without asking for location:
- "How do I vote by mail?" → Explain the general process immediately
- "What ID do I need to vote?" → Explain ID requirements directly
- "How does voting work?" → Explain the general voting process
- "When is the next election?" → Give dates directly
- "How do I register?" → Give direct info + https://vote.gov/register
- Any general civic education question
- Any "how to" question about elections

== POLLING PLACE RULE ==
- If asked WHERE their polling place is WITHOUT an address → Ask: "What is your address or city? I'll find it on Google Maps for you!"
- Once they give an address → Immediately provide: https://www.google.com/maps/search/polling+place+near+[ADDRESS-WITH-+SIGNS]

== DEADLINE RULE ==
- If asked about deadlines WITHOUT a state → Ask which state they're in
- If they give a state → Give the specific deadlines for that state

== GENERAL RULES ==
- Always give real clickable links. NEVER say "use Google Maps" — provide the actual URL.
- Registration link: https://vote.gov/register
- End answers with a helpful tip or follow-up offer.
- Include a JSON timeline at the end of multi-step responses ONLY:
[{"stage_name": "...", "what_happens": "...", "google_tool": "Google Maps/Calendar/Search", "educational_note": "..."}]`;

/**
 * Local Expert Responses — Fallback if no API connection is available.
 */
const LOCAL_RESPONSES = {
  register: {
    text: "Registering to vote is your first and most important step! In most states, you can register online, by mail, or in person at your local election office.",
    timeline: [
      { stage_name: "Check Eligibility", what_happens: "Confirm you meet age, citizenship, and residency requirements", google_tool: "Google Search", educational_note: "Most states require you to be 18 by Election Day." },
      { stage_name: "Gather Documents", what_happens: "Prepare your ID, proof of address, and SSN", google_tool: "Google Search", educational_note: "Requirements vary by state — check your state's election website." },
      { stage_name: "Submit Registration", what_happens: "Register online at vote.gov or mail your form", google_tool: "Google Calendar", educational_note: "Deadlines are typically 15-30 days before the election!" },
      { stage_name: "Confirm Registration", what_happens: "Check your registration status online", google_tool: "Google Search", educational_note: "Always verify your registration a few weeks before Election Day." }
    ]
  },
  polling: {
    text: "Finding your polling place is easy! Your assigned polling location is based on your registered address. Bring valid ID if your state requires it.",
    timeline: [
      { stage_name: "Find Your Location", what_happens: "Look up your assigned polling place using your address", google_tool: "Google Maps", educational_note: "Your polling place may change between elections — always verify!" },
      { stage_name: "Check Hours", what_happens: "Confirm polling hours (usually 7am–8pm)", google_tool: "Google Search", educational_note: "If you're in line when polls close, you still have the right to vote!" },
      { stage_name: "Get Directions", what_happens: "Plan your route with Google Maps", google_tool: "Google Maps", educational_note: "Allow extra time — lines may be longer on Election Day." },
      { stage_name: "Set a Reminder", what_happens: "Add Election Day to your calendar", google_tool: "Google Calendar", educational_note: "Ask your employer about paid time off to vote — it's the law in many states!" }
    ]
  },
  deadline: {
    text: "Staying on top of election deadlines is crucial! Deadlines vary by state — check your state's official election website for exact dates.",
    timeline: [
      { stage_name: "Registration Deadline", what_happens: "Last day to register to vote (typically 15–30 days before election)", google_tool: "Google Calendar", educational_note: "Some states allow same-day registration at the polls!" },
      { stage_name: "Absentee Request Deadline", what_happens: "Request your mail-in ballot by this date", google_tool: "Google Calendar", educational_note: "Request early — mail takes time!" },
      { stage_name: "Ballot Return Deadline", what_happens: "Your completed ballot must be received or postmarked by this date", google_tool: "Google Calendar", educational_note: "Return in person to avoid mail delays." },
      { stage_name: "Election Day", what_happens: "Cast your vote in person at your polling place", google_tool: "Google Maps", educational_note: "Check if your state requires ID before you go!" }
    ]
  },
  default: {
    text: "I'm here to help you navigate the democratic process! I can assist with voter registration, finding polling locations, election deadlines, absentee voting, ID requirements, and more.",
    timeline: [
      { stage_name: "Register to Vote", what_happens: "Ensure you're registered before the deadline", google_tool: "Google Search", educational_note: "You can register at vote.gov in most states!" },
      { stage_name: "Find Polling Place", what_happens: "Locate your assigned voting location", google_tool: "Google Maps", educational_note: "Bring a friend — civic engagement is contagious!" },
      { stage_name: "Plan Your Vote", what_happens: "Research candidates and ballot measures", google_tool: "Google Search", educational_note: "Ballotpedia.org is a great nonpartisan resource." },
      { stage_name: "Cast Your Ballot", what_happens: "Vote on Election Day or by absentee ballot", google_tool: "Google Calendar", educational_note: "Every vote counts — yours matters!" }
    ]
  }
};

/**
 * Gets an intelligent local response based on keywords.
 * @param {string} message - The user's latest message
 * @returns {string} - Formatted response with embedded JSON timeline
 */
const getLocalResponse = (message) => {
  const msg = message.toLowerCase();
  let response;
  if (msg.includes('register') || msg.includes('registration')) {
    response = LOCAL_RESPONSES.register;
  } else if (msg.includes('polling') || msg.includes('poll') || msg.includes('where') || msg.includes('location')) {
    response = LOCAL_RESPONSES.polling;
  } else if (msg.includes('deadline') || msg.includes('date') || msg.includes('when') || msg.includes('upcoming')) {
    response = LOCAL_RESPONSES.deadline;
  } else {
    response = LOCAL_RESPONSES.default;
  }
  return `${response.text}\n\n${JSON.stringify(response.timeline)}`;
};

/**
 * searchWeb — Fetches live search results from DuckDuckGo's free API.
 * Used as a fallback when the AI needs current/real-time information.
 * @param {string} query - The search query
 * @returns {Promise<string>} - A summary of search results
 */
const searchWeb = async (query) => {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url);
    const data = await res.json();

    const parts = [];
    if (data.AbstractText) parts.push(data.AbstractText);
    if (data.Answer) parts.push(data.Answer);
    if (data.RelatedTopics?.length) {
      data.RelatedTopics.slice(0, 3).forEach(t => {
        if (t.Text) parts.push(t.Text);
      });
    }
    return parts.length > 0
      ? parts.join('\n\n')
      : `No direct results found. [Google Search](https://www.google.com/search?q=${encodeURIComponent(query)})`;
  } catch {
    return `[Search Google for "${query}"](https://www.google.com/search?q=${encodeURIComponent(query)})`;
  }
};

/**
 * Main chat function for ElectionBot.
 * Uses Groq (Llama 3.3) as primary engine with web search fallback.
 * If the AI signals uncertainty, searchWeb() is called for live data.
 *
 * @param {Array} messages - The full conversation history
 * @returns {Promise<string>} - The AI response text
 */
export const chatWithGemini = async (messages) => {
  const latestMessage = messages[messages.length - 1]?.text || '';

  // --- Attempt Live AI Connection via Groq ---
  if (groq) {
    try {
      const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.sender === 'bot' ? 'assistant' : 'user',
          content: m.text,
        }))
      ];

      // First pass — get AI response
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: formattedMessages,
        temperature: 0.6,
        max_tokens: 1024,
      });

      let aiText = response.choices[0].message.content;

      // If AI signals it doesn't know, do a web search and supplement
      const uncertainPhrases = [
        "i don't have", "i don't know", "not sure", "cannot confirm",
        "no information", "check online", "verify online", "i'm not certain",
        "as of my knowledge cutoff", "i cannot access"
      ];
      const needsSearch = uncertainPhrases.some(p => aiText.toLowerCase().includes(p));

      if (needsSearch) {
        console.log('AI uncertain — performing web search for:', latestMessage);
        const searchResults = await searchWeb(latestMessage + ' election India 2026');
        if (searchResults) {
          // Second pass — feed search results back to the AI
          const supplemented = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              ...formattedMessages,
              { role: 'assistant', content: aiText },
              { role: 'user', content: `Here are live web search results that may help:\n\n${searchResults}\n\nNow provide a complete, helpful answer using this information.` }
            ],
            temperature: 0.5,
            max_tokens: 1024,
          });
          aiText = supplemented.choices[0].message.content;
        }
      }

      return aiText;
    } catch (error) {
      console.warn('Groq API unavailable, using local expert mode:', error.message);
    }
  }

  // --- Fallback: Intelligent Local Response ---
  await new Promise(resolve => setTimeout(resolve, 800));
  return getLocalResponse(latestMessage);
};
