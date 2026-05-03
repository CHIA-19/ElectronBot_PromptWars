import axios from 'axios';

// ============================================================
// ElectionBot Google Services Integration
// Integrates Google Civic Information API, Google Maps, and Google Calendar.
// Security: All API keys are loaded from environment variables.
// ============================================================

const CIVIC_API_KEY = import.meta.env.VITE_CIVIC_INFO_API_KEY;
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Validates that an API key exists and is not a placeholder.
 * @param {string} key - The API key to validate
 * @returns {boolean} - True if valid
 */
const isValidKey = (key) => key && !key.includes('your_') && !key.includes('YOUR_');

/**
 * Google Civic Information API — Fetches voter info and ballot data.
 * Provides polling location, registration deadlines, and contest information.
 * 
 * @param {string} address - The voter's registered address
 * @param {string|null} electionId - Optional specific election ID
 * @returns {Promise<Object>} - Structured polling and election data
 */
export const getPollingData = async (address, electionId = null) => {
  if (!isValidKey(CIVIC_API_KEY)) {
    console.warn('Civic API Key missing — returning mock data for demo.');
    return getMockPollingData(address);
  }

  try {
    const params = {
      key: CIVIC_API_KEY,
      address,
      officialOnly: true,
    };
    if (electionId) params.electionId = electionId;

    const response = await axios.get(
      'https://www.googleapis.com/civicinfo/v2/voterinfo',
      { params, timeout: 8000 }
    );
    const data = response.data;

    const pollingPlace = data.pollingLocations?.[0];
    const location = pollingPlace?.address;
    const state = data.state?.[0];

    return {
      name: location?.locationName || 'Your Polling Location',
      address: location
        ? `${location.line1}, ${location.city}, ${location.state} ${location.zip}`
        : address,
      hours: pollingPlace?.pollingHours || 'Hours not specified',
      notes: pollingPlace?.notes || '',
      accessibility: {
        wheelchair: pollingPlace?.notes?.toLowerCase().includes('wheelchair') ?? true,
        language: pollingPlace?.notes?.toLowerCase().includes('language') ?? false,
      },
      registration: {
        url: state?.electionAdministrationBody?.electionRegistrationUrl || 'https://vote.gov',
        deadline: state?.electionAdministrationBody?.registrationDeadline || 'Check local guidelines',
      },
      contests: data.contests || [],
      election: data.election,
    };
  } catch (error) {
    console.error('Civic API Error:', error.message);
    // Graceful degradation — return mock data so the UI still functions
    return getMockPollingData(address);
  }
};

/**
 * Mock polling data — used when the Civic API key is unavailable.
 * Ensures the UI remains functional during demos.
 * @param {string} address - The user's address
 * @returns {Object} - Mock election data
 */
const getMockPollingData = (address) => ({
  name: 'Lincoln Community Center',
  address: address || '123 Democracy Ave, Springfield, USA',
  hours: '7:00 AM – 8:00 PM',
  notes: 'Accessible entrance available.',
  accessibility: { wheelchair: true, language: true },
  registration: {
    url: 'https://vote.gov',
    deadline: '30 days before Election Day',
  },
  contests: [],
  election: { name: 'General Election', electionDay: '2024-11-05' },
});

/**
 * Builds a Google Maps embed URL for directions to a polling place.
 * Uses the Google Maps Embed API for seamless map integration.
 * 
 * @param {string} destination - The polling place address
 * @param {string} origin - Starting location (defaults to current location)
 * @returns {string} - Google Maps embed URL
 */
export const getMapsEmbedUrl = (destination, origin = 'current location') => {
  if (!isValidKey(MAPS_API_KEY)) return '';
  const encodedDest = encodeURIComponent(destination);
  const encodedOrigin = encodeURIComponent(origin);
  return `https://www.google.com/maps/embed/v1/directions?key=${MAPS_API_KEY}&origin=${encodedOrigin}&destination=${encodedDest}&mode=driving`;
};

/**
 * Constructs a Google Calendar event creation URL.
 * Allows voters to add election deadlines and voting reminders to their calendar.
 * 
 * @param {string} title - Event title (e.g., "Election Day")
 * @param {string} date - Event date in YYYY-MM-DD format
 * @param {string} location - Event location
 * @param {string} details - Event description
 * @returns {string} - Google Calendar URL
 */
export const getCalendarEventUrl = (title, date, location, details) => {
  if (!date) return 'https://calendar.google.com';
  const formattedDate = date.replace(/-/g, '');
  const start = `${formattedDate}T090000Z`;
  const end = `${formattedDate}T170000Z`;
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&location=${encodeURIComponent(location || '')}&details=${encodeURIComponent(details || '')}`;
};

/**
 * YouTube search URL builder for candidate debates.
 * @param {string} candidateName - The candidate's name
 * @returns {string} - YouTube search URL
 */
export const getYouTubeSearchUrl = (candidateName) => {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(candidateName + ' debate 2024')}`;
};

/**
 * Google Maps directions URL builder.
 * @param {string} destination - The destination address
 * @returns {string} - Google Maps directions URL
 */
export const getDirectionsUrl = (destination) => {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
};
