# ElectionBot: AI-Powered Civic Education Assistant 🗳️🇮🇳

ElectionBot is an intelligent, highly interactive civic education assistant built to empower voters in India. It leverages the latest AI models to provide precise, actionable, and state-specific guidance on voter registration, polling locations, and election timelines according to the rules of the Election Commission of India (ECI).

## 🏆 Chosen Vertical
**Civic Education & Voter Empowerment**
This project tackles the challenge of voter apathy and information asymmetry by creating an accessible, user-friendly platform that distills complex election rules into simple, interactive, and actionable steps.

## 🧠 Approach and Logic
Our approach focused on **Accuracy, Accessibility, and Actionability**:
1. **Accuracy (Strict Prompt Engineering)**: Instead of allowing the AI to hallucinate general answers, we engineered a strict system prompt that forces the AI to exclusively use Indian Election Commission (ECI) rules (e.g., explaining that Postal Ballots are only for specific groups like PwD and senior citizens, and that EPIC is the primary ID).
2. **Accessibility (Responsive UI & Localization)**: Built a premium React-based UI with glassmorphism, dark/light modes, and micro-animations. The interface is designed to be intuitive for first-time voters, featuring suggested quick-action chips to reduce the barrier to entry.
3. **Actionability (Dynamic Tooling)**: The bot doesn't just give text. It dynamically detects locations and generates clickable Google Maps links for polling places, Google Calendar links for deadlines, and direct links to the official Voters' Services Portal (`voters.eci.gov.in`).

## ⚙️ How the Solution Works
1. **Groq + Llama 3.3 Engine**: The core logic is powered by `llama-3.3-70b-versatile` via the Groq SDK, providing lightning-fast inference.
2. **Live Web Search Fallback**: If the user asks a question about a rapidly changing topic (e.g., live election news) and the AI signals uncertainty, the application automatically triggers a DuckDuckGo API search, retrieves real-time data, and feeds it back to the AI context window to generate an accurate response.
3. **State-Aware UI Integration**: The sidebar features a dynamic State-to-District selector containing real election data for 29 Indian States/UTs. Selecting a district automatically updates the live countdown timer to the next relevant election (e.g., Haryana Municipal Corporation elections on May 10, 2026).
4. **Automated Testing & CI/CD**: The application is fully tested using Vitest and React Testing Library (achieving 100% test coverage) and is deployed automatically to Firebase Hosting via GitHub Actions.

## 🤔 Assumptions Made
- **Target Audience Context**: We assumed the primary user base is in India. Therefore, the AI is explicitly instructed to ignore general US-centric election rules and strictly apply Indian ECI guidelines.
- **API Availability**: We assume the user has internet access for the Groq API and DuckDuckGo fallback to function. However, we also built a "Local Expert" fallback system containing hardcoded timelines in case the APIs are temporarily unavailable.
- **Election Data Accuracy**: The countdown timer data is based on currently scheduled or projected 2026/2027 election cycles sourced from public records, which are subject to change by the Election Commission.

## 🛠️ Tech Stack & Google Services Integration
- **Frontend**: React (Vite), Framer Motion, CSS Modules
- **AI**: Groq SDK (Llama-3.3-70b)
- **Google Services Integration**: 
  - **Google Maps**: Dynamically generated routing URLs for polling locations based on AI entity extraction.
  - **Google Calendar**: Encoded template URLs for adding customized election day and registration deadlines to the user's calendar.
  - **Firebase**: Secure, high-performance edge hosting.
- **Testing**: Vitest, React Testing Library, JSDOM

## 🚀 Getting Started
\`\`\`bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Run the automated test suite
npm run test
\`\`\`
