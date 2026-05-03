import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Vote, MapPin, Calendar, Languages, Info, Search, Menu, Copy, Check, Sun, Moon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithGemini } from './services/gemini';
import { getPollingData, getCalendarEventUrl } from './services/google-apis';
import './App.css';
import ReactMarkdown from 'react-markdown';

// ── Suggested question chips shown below the input ──────────────────────────
const SUGGESTED_CHIPS = [
  "How do I register to vote?",
  "Where is my polling place?",
  "What ID do I need to vote?",
  "How do I vote by mail?",
  "When is the registration deadline?",
];

// ── Election data: All Indian States/UTs + US States ─────────────────────────
const ELECTION_DATA = {
  "Haryana":           { type: "Local Body Elections", isoDate: "2026-05-10", districts: { "Ambala": { body: "Ambala Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Panchkula": { body: "Panchkula Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Sonipat": { body: "Sonipat Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Faridabad": { body: "Faridabad Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Gurugram": { body: "Gurugram Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Rohtak": { body: "Rohtak Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Hisar": { body: "Hisar Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" }, "Karnal": { body: "Karnal Municipal Corporation", date: "2026-05-10", type: "Municipal Corp" } } },
  "Himachal Pradesh":  { type: "Local Body Elections", isoDate: "2026-06-15", districts: { "Shimla": { body: "Shimla Municipal Corporation", date: "2026-06-15", type: "Municipal Corp" }, "Dharamshala": { body: "Dharamshala Municipal Corporation", date: "2026-06-15", type: "Municipal Corp" }, "Mandi": { body: "Mandi Municipal Council", date: "2026-06-15", type: "Municipal Council" }, "Solan": { body: "Solan Municipal Council", date: "2026-06-15", type: "Municipal Council" }, "Kullu": { body: "Kullu Municipal Council", date: "2026-06-15", type: "Municipal Council" } } },
  "Andhra Pradesh":    { type: "State Assembly Elections", isoDate: "2029-01-01", districts: { "Visakhapatnam": { body: "AP Assembly", date: "2029-01-01", type: "State Assembly" }, "Vijayawada": { body: "AP Assembly", date: "2029-01-01", type: "State Assembly" }, "Guntur": { body: "AP Assembly", date: "2029-01-01", type: "State Assembly" }, "Tirupati": { body: "AP Assembly", date: "2029-01-01", type: "State Assembly" }, "Kurnool": { body: "AP Assembly", date: "2029-01-01", type: "State Assembly" } } },
  "Arunachal Pradesh": { type: "State Assembly Elections", isoDate: "2029-01-01", districts: { "Itanagar": { body: "AR Assembly", date: "2029-01-01", type: "State Assembly" }, "Naharlagun": { body: "AR Assembly", date: "2029-01-01", type: "State Assembly" }, "Pasighat": { body: "AR Assembly", date: "2029-01-01", type: "State Assembly" }, "Tawang": { body: "AR Assembly", date: "2029-01-01", type: "State Assembly" } } },
  "Assam":             { type: "State Assembly Elections", isoDate: "2026-04-01", districts: { "Guwahati": { body: "Assam Assembly", date: "2026-04-01", type: "State Assembly" }, "Dibrugarh": { body: "Assam Assembly", date: "2026-04-01", type: "State Assembly" }, "Jorhat": { body: "Assam Assembly", date: "2026-04-01", type: "State Assembly" }, "Silchar": { body: "Assam Assembly", date: "2026-04-01", type: "State Assembly" }, "Tezpur": { body: "Assam Assembly", date: "2026-04-01", type: "State Assembly" } } },
  "Bihar":             { type: "State Assembly Elections", isoDate: "2025-11-01", districts: { "Patna": { body: "Bihar Assembly", date: "2025-11-01", type: "State Assembly" }, "Gaya": { body: "Bihar Assembly", date: "2025-11-01", type: "State Assembly" }, "Muzaffarpur": { body: "Bihar Assembly", date: "2025-11-01", type: "State Assembly" }, "Bhagalpur": { body: "Bihar Assembly", date: "2025-11-01", type: "State Assembly" }, "Darbhanga": { body: "Bihar Assembly", date: "2025-11-01", type: "State Assembly" } } },
  "Chhattisgarh":      { type: "State Assembly Elections", isoDate: "2028-12-01", districts: { "Raipur": { body: "CG Assembly", date: "2028-12-01", type: "State Assembly" }, "Bhilai": { body: "CG Assembly", date: "2028-12-01", type: "State Assembly" }, "Bilaspur": { body: "CG Assembly", date: "2028-12-01", type: "State Assembly" }, "Korba": { body: "CG Assembly", date: "2028-12-01", type: "State Assembly" } } },
  "Goa":               { type: "State Assembly Elections", isoDate: "2027-02-01", districts: { "Panaji": { body: "Goa Assembly", date: "2027-02-01", type: "State Assembly" }, "Margao": { body: "Goa Assembly", date: "2027-02-01", type: "State Assembly" }, "Vasco da Gama": { body: "Goa Assembly", date: "2027-02-01", type: "State Assembly" } } },
  "Gujarat":           { type: "State Assembly Elections", isoDate: "2027-12-01", districts: { "Ahmedabad": { body: "Gujarat Assembly", date: "2027-12-01", type: "State Assembly" }, "Surat": { body: "Gujarat Assembly", date: "2027-12-01", type: "State Assembly" }, "Vadodara": { body: "Gujarat Assembly", date: "2027-12-01", type: "State Assembly" }, "Rajkot": { body: "Gujarat Assembly", date: "2027-12-01", type: "State Assembly" }, "Gandhinagar": { body: "Gujarat Assembly", date: "2027-12-01", type: "State Assembly" } } },
  "Jharkhand":         { type: "State Assembly Elections", isoDate: "2029-11-01", districts: { "Ranchi": { body: "JH Assembly", date: "2029-11-01", type: "State Assembly" }, "Jamshedpur": { body: "JH Assembly", date: "2029-11-01", type: "State Assembly" }, "Dhanbad": { body: "JH Assembly", date: "2029-11-01", type: "State Assembly" } } },
  "Karnataka":         { type: "State Assembly Elections", isoDate: "2028-05-01", districts: { "Bengaluru": { body: "KA Assembly", date: "2028-05-01", type: "State Assembly" }, "Mysuru": { body: "KA Assembly", date: "2028-05-01", type: "State Assembly" }, "Hubli": { body: "KA Assembly", date: "2028-05-01", type: "State Assembly" }, "Mangaluru": { body: "KA Assembly", date: "2028-05-01", type: "State Assembly" } } },
  "Kerala":            { type: "State Assembly Elections", isoDate: "2026-04-01", districts: { "Thiruvananthapuram": { body: "Kerala Assembly", date: "2026-04-01", type: "State Assembly" }, "Kochi": { body: "Kerala Assembly", date: "2026-04-01", type: "State Assembly" }, "Kozhikode": { body: "Kerala Assembly", date: "2026-04-01", type: "State Assembly" }, "Thrissur": { body: "Kerala Assembly", date: "2026-04-01", type: "State Assembly" } } },
  "Madhya Pradesh":    { type: "State Assembly Elections", isoDate: "2028-11-01", districts: { "Bhopal": { body: "MP Assembly", date: "2028-11-01", type: "State Assembly" }, "Indore": { body: "MP Assembly", date: "2028-11-01", type: "State Assembly" }, "Jabalpur": { body: "MP Assembly", date: "2028-11-01", type: "State Assembly" }, "Gwalior": { body: "MP Assembly", date: "2028-11-01", type: "State Assembly" } } },
  "Maharashtra":       { type: "State Assembly Elections", isoDate: "2029-10-01", districts: { "Mumbai": { body: "MH Assembly", date: "2029-10-01", type: "State Assembly" }, "Pune": { body: "MH Assembly", date: "2029-10-01", type: "State Assembly" }, "Nagpur": { body: "MH Assembly", date: "2029-10-01", type: "State Assembly" }, "Nashik": { body: "MH Assembly", date: "2029-10-01", type: "State Assembly" }, "Thane": { body: "MH Assembly", date: "2029-10-01", type: "State Assembly" } } },
  "Manipur":           { type: "State Assembly Elections", isoDate: "2027-03-01", districts: { "Imphal": { body: "MN Assembly", date: "2027-03-01", type: "State Assembly" }, "Thoubal": { body: "MN Assembly", date: "2027-03-01", type: "State Assembly" }, "Bishnupur": { body: "MN Assembly", date: "2027-03-01", type: "State Assembly" } } },
  "Meghalaya":         { type: "State Assembly Elections", isoDate: "2028-03-01", districts: { "Shillong": { body: "ML Assembly", date: "2028-03-01", type: "State Assembly" }, "Tura": { body: "ML Assembly", date: "2028-03-01", type: "State Assembly" } } },
  "Mizoram":           { type: "State Assembly Elections", isoDate: "2028-11-01", districts: { "Aizawl": { body: "MZ Assembly", date: "2028-11-01", type: "State Assembly" }, "Lunglei": { body: "MZ Assembly", date: "2028-11-01", type: "State Assembly" } } },
  "Nagaland":          { type: "State Assembly Elections", isoDate: "2028-02-01", districts: { "Kohima": { body: "NL Assembly", date: "2028-02-01", type: "State Assembly" }, "Dimapur": { body: "NL Assembly", date: "2028-02-01", type: "State Assembly" } } },
  "Odisha":            { type: "State Assembly Elections", isoDate: "2029-05-01", districts: { "Bhubaneswar": { body: "OD Assembly", date: "2029-05-01", type: "State Assembly" }, "Cuttack": { body: "OD Assembly", date: "2029-05-01", type: "State Assembly" }, "Rourkela": { body: "OD Assembly", date: "2029-05-01", type: "State Assembly" } } },
  "Punjab":            { type: "State Assembly Elections", isoDate: "2027-03-01", districts: { "Chandigarh": { body: "PB Assembly", date: "2027-03-01", type: "State Assembly" }, "Ludhiana": { body: "PB Assembly", date: "2027-03-01", type: "State Assembly" }, "Amritsar": { body: "PB Assembly", date: "2027-03-01", type: "State Assembly" }, "Jalandhar": { body: "PB Assembly", date: "2027-03-01", type: "State Assembly" }, "Patiala": { body: "PB Assembly", date: "2027-03-01", type: "State Assembly" } } },
  "Rajasthan":         { type: "State Assembly Elections", isoDate: "2028-12-01", districts: { "Jaipur": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" }, "Jodhpur": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" }, "Udaipur": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" }, "Kota": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" }, "Bikaner": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" }, "Ajmer": { body: "RJ Assembly", date: "2028-12-01", type: "State Assembly" } } },
  "Sikkim":            { type: "State Assembly Elections", isoDate: "2029-05-01", districts: { "Gangtok": { body: "SK Assembly", date: "2029-05-01", type: "State Assembly" }, "Namchi": { body: "SK Assembly", date: "2029-05-01", type: "State Assembly" } } },
  "Tamil Nadu":        { type: "State Assembly Elections", isoDate: "2026-04-01", districts: { "Chennai": { body: "TN Assembly", date: "2026-04-01", type: "State Assembly" }, "Coimbatore": { body: "TN Assembly", date: "2026-04-01", type: "State Assembly" }, "Madurai": { body: "TN Assembly", date: "2026-04-01", type: "State Assembly" }, "Tiruchirappalli": { body: "TN Assembly", date: "2026-04-01", type: "State Assembly" }, "Salem": { body: "TN Assembly", date: "2026-04-01", type: "State Assembly" } } },
  "Telangana":         { type: "State Assembly Elections", isoDate: "2028-12-01", districts: { "Hyderabad": { body: "TS Assembly", date: "2028-12-01", type: "State Assembly" }, "Warangal": { body: "TS Assembly", date: "2028-12-01", type: "State Assembly" }, "Nizamabad": { body: "TS Assembly", date: "2028-12-01", type: "State Assembly" }, "Karimnagar": { body: "TS Assembly", date: "2028-12-01", type: "State Assembly" } } },
  "Tripura":           { type: "State Assembly Elections", isoDate: "2028-03-01", districts: { "Agartala": { body: "TR Assembly", date: "2028-03-01", type: "State Assembly" }, "Udaipur": { body: "TR Assembly", date: "2028-03-01", type: "State Assembly" } } },
  "Uttar Pradesh":     { type: "State Assembly Elections", isoDate: "2027-02-01", districts: { "Lucknow": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Kanpur": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Agra": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Varanasi": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Allahabad": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Meerut": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" }, "Noida": { body: "UP Assembly", date: "2027-02-01", type: "State Assembly" } } },
  "Uttarakhand":       { type: "State Assembly Elections", isoDate: "2027-02-01", districts: { "Dehradun": { body: "UK Assembly", date: "2027-02-01", type: "State Assembly" }, "Haridwar": { body: "UK Assembly", date: "2027-02-01", type: "State Assembly" }, "Nainital": { body: "UK Assembly", date: "2027-02-01", type: "State Assembly" }, "Haldwani": { body: "UK Assembly", date: "2027-02-01", type: "State Assembly" } } },
  "West Bengal":       { type: "State Assembly Elections", isoDate: "2026-04-01", districts: { "Kolkata": { body: "WB Assembly", date: "2026-04-01", type: "State Assembly" }, "Howrah": { body: "WB Assembly", date: "2026-04-01", type: "State Assembly" }, "Asansol": { body: "WB Assembly", date: "2026-04-01", type: "State Assembly" }, "Siliguri": { body: "WB Assembly", date: "2026-04-01", type: "State Assembly" }, "Darjeeling": { body: "WB Assembly", date: "2026-04-01", type: "State Assembly" } } },
  "Delhi":             { type: "State Assembly Elections", isoDate: "2030-02-01", districts: { "Central Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" }, "East Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" }, "New Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" }, "North Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" }, "South Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" }, "West Delhi": { body: "Delhi Assembly", date: "2030-02-01", type: "State Assembly" } } },
  "Jammu & Kashmir":  { type: "UT Assembly Elections", isoDate: "2029-09-01", districts: { "Srinagar": { body: "J&K Assembly", date: "2029-09-01", type: "UT Assembly" }, "Jammu": { body: "J&K Assembly", date: "2029-09-01", type: "UT Assembly" }, "Anantnag": { body: "J&K Assembly", date: "2029-09-01", type: "UT Assembly" }, "Baramulla": { body: "J&K Assembly", date: "2029-09-01", type: "UT Assembly" } } },
  "Ladakh":            { type: "UT Council Elections", isoDate: "2028-01-01", districts: { "Leh": { body: "Leh Hill Council", date: "2028-01-01", type: "Hill Council" }, "Kargil": { body: "Kargil Hill Council", date: "2028-01-01", type: "Hill Council" } } },
  "Puducherry":        { type: "UT Assembly Elections", isoDate: "2026-05-01", districts: { "Puducherry": { body: "PY Assembly", date: "2026-05-01", type: "UT Assembly" }, "Karaikal": { body: "PY Assembly", date: "2026-05-01", type: "UT Assembly" } } },
  "United States":     { type: "US Midterm Elections", isoDate: "2026-11-03", districts: { "California": { body: "CA General Election", date: "2026-11-03", type: "State General" }, "Texas": { body: "TX General Election", date: "2026-11-03", type: "State General" }, "New York": { body: "NY General Election", date: "2026-11-03", type: "State General" }, "Florida": { body: "FL General Election", date: "2026-11-03", type: "State General" }, "Illinois": { body: "IL General Election", date: "2026-11-03", type: "State General" }, "Pennsylvania": { body: "PA General Election", date: "2026-11-03", type: "State General" }, "Ohio": { body: "OH General Election", date: "2026-11-03", type: "State General" }, "Georgia": { body: "GA General Election", date: "2026-11-03", type: "State General" } } },
};

const selectStyle = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 10,
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  marginBottom: '0.5rem',
};

/**
 * CountdownTimer — Interactive State → District selector with live countdown.
 * Election dates sourced from Wikipedia 2026 India elections page.
 */
const CountdownTimer = () => {
  const states = Object.keys(ELECTION_DATA);
  const [selectedState, setSelectedState] = useState(states[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(Object.keys(ELECTION_DATA[states[0]].districts)[0]);
  const [timeLeft, setTimeLeft] = useState({});

  const stateData = ELECTION_DATA[selectedState];
  const districtData = stateData?.districts[selectedDistrict];
  const targetDate = new Date(districtData?.date || stateData?.isoDate);

  // Reset district when state changes
  const handleStateChange = (e) => {
    const s = e.target.value;
    setSelectedState(s);
    setSelectedDistrict(Object.keys(ELECTION_DATA[s].districts)[0]);
  };

  useEffect(() => {
    const calc = () => {
      const diff = targetDate - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [selectedState, selectedDistrict]);

  const searchQuery = districtData
    ? `${districtData.body} election ${districtData.date}`
    : `${selectedState} election 2026`;

  return (
    <div>
      {/* State Selector */}
      <label htmlFor="state-select" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Select State / Country</label>
      <select id="state-select" value={selectedState} onChange={handleStateChange} style={selectStyle} aria-label="Select state">
        {states.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* District Selector */}
      <label htmlFor="district-select" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Select District / Region</label>
      <select
        id="district-select"
        value={selectedDistrict}
        onChange={e => setSelectedDistrict(e.target.value)}
        style={selectStyle}
        aria-label="Select district"
      >
        {Object.keys(stateData.districts).map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* Election Info — no emojis, clean display */}
      {districtData && (
        <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 10, padding: '8px 10px', marginBottom: '0.5rem', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.2)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: 20, fontWeight: 600, display: 'inline-block', marginBottom: 4 }}>{stateData.type}</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, margin: '2px 0' }}>{selectedDistrict}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0' }}>{districtData.body}</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0' }}>{districtData.type} &middot; {districtData.date}</p>
        </div>
      )}

      {/* Countdown */}
      {timeLeft.expired
        ? <p style={{ color: 'var(--primary-color)', fontWeight: 600, textAlign: 'center' }}>Election Day is here! 🗳️</p>
        : (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '0.5rem' }}>
            {[['days', 'Days'], ['hours', 'Hrs'], ['minutes', 'Min']].map(([key, label]) => (
              <div key={key} style={{ textAlign: 'center', background: 'rgba(59,130,246,0.15)', borderRadius: 10, padding: '7px 10px', minWidth: 48 }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>{timeLeft[key] ?? '--'}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )
      }

      {/* Google Search Link */}
      <a
        href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
        target="_blank" rel="noreferrer noopener"
        style={{ fontSize: '0.72rem', color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}
        aria-label={`Search for more info about ${selectedDistrict} election`}
      >
        🔍 Search for more info
      </a>
    </div>
  );
};

/**
 * CopyButton — Copies bot message text to clipboard.
 */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      aria-label="Copy message to clipboard"
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', marginTop: 4 }}
    >
      {copied ? <><Check size={12} color="#10b981" /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );
};

// Component: ElectionInfoCard
const ElectionInfoCard = ({ data }) => {
  if (data.error) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', color: '#ff4b2b', border: '1px solid #ff4b2b' }}>
        <p>{data.error}</p>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.address)}`;
  const calendarUrl = getCalendarEventUrl(
    data.registration?.url ? `Register to Vote Deadline` : `Vote at ${data.name}`,
    data.registration?.deadline || data.election.electionDay,
    data.address,
    data.registration?.url ? `Don't miss the registration deadline: ${data.registration.url}` : `Your polling location is ${data.name}.`
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel info-card"
    >
      <div className="card-header">
        {data.registration?.url ? <Vote size={20} color="var(--primary-color)" /> : <MapPin size={20} color="var(--primary-color)" />}
        <h3>{data.registration?.url ? 'Registration Info' : data.name}</h3>
      </div>
      <div className="card-body">
        {data.registration?.url ? (
          <>
            <p><strong>Deadline:</strong> {data.registration.deadline}</p>
            <p>Registration takes under 5 minutes online!</p>
          </>
        ) : (
          <>
            <p className="address">{data.address}</p>
            <div className="info-row">
              <Calendar size={14} />
              <span>Hours: {data.hours}</span>
            </div>
          </>
        )}
        <div className="info-row accessibility">
          <Info size={14} />
          <span>
            {data.registration?.url ? 'Official Government Portal' : `Accessibility: ${data.accessibility.wheelchair ? '♿ Wheelchair Accessible' : 'Limited Access'}`}
          </span>
        </div>
      </div>
      <div className="card-footer">
        {data.registration?.url ? (
          <a href={data.registration.url} target="_blank" rel="noreferrer" className="btn-primary">
            Register Online <Languages size={14} />
          </a>
        ) : (
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-primary">
            Get Directions <Send size={14} />
          </a>
        )}
        <a href={calendarUrl} target="_blank" rel="noreferrer" className="btn-secondary">
          Set Deadline Reminder
        </a>
      </div>
    </motion.div>
  );
};

// Component: TimelineRenderer
const TimelineRenderer = ({ stages }) => {
  return (
    <div className="timeline-container">
      {stages.map((stage, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="timeline-item"
        >
          <div className="timeline-marker">
            <div className="marker-circle">{stage.stage_number}</div>
            {index !== stages.length - 1 && <div className="marker-line" />}
          </div>
          <div className="timeline-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h4>{stage.stage_name}</h4>
              <span className="timing-badge">{stage.timing}</span>
            </div>
            <p className="description">{stage.what_happens}</p>
            <div className="google-tool-tag">
              <img 
                src={`https://www.google.com/s2/favicons?domain=${(stage.google_tool || "").toLowerCase().includes('maps') ? 'maps.google.com' : 'google.com'}`} 
                alt="icon" 
                style={{ width: 14, height: 14 }} 
              />
              <span>Powered by {stage.google_tool || "Google Tools"}</span>
            </div>
            <div className="educational-note">
              <strong>Pro Tip:</strong> {stage.educational_note}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Component: BallotRenderer
const BallotRenderer = ({ contests }) => {
  return (
    <div className="ballot-container">
      {contests.map((contest, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="contest-card glass-panel"
        >
          <div className="contest-header">
            <h4>{contest.office || contest.referendumTitle}</h4>
            <span className="contest-type">{contest.type}</span>
          </div>
          <div className="contest-body">
            {contest.candidates ? (
              <div className="candidates-list">
                {contest.candidates.map((candidate, cIdx) => (
                  <div key={cIdx} className="candidate-item">
                    <div className="candidate-info">
                      {candidate.photoUrl && <img src={candidate.photoUrl} alt={candidate.name} className="candidate-photo" />}
                      <div>
                        <h5>{candidate.name}</h5>
                        <p className="party">{candidate.party}</p>
                      </div>
                    </div>
                    <div className="candidate-links">
                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(candidate.name + " debate 2024")}`} target="_blank" rel="noreferrer" className="youtube-link">
                        Watch Debates
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="referendum-info">
                <p className="referendum-text">{contest.referendumText?.substring(0, 150)}...</p>
                <div className="pro-con">
                  {contest.referendumProStatements && <div className="pro">✅ Pro: {contest.referendumProStatements[0]}</div>}
                  {contest.referendumConStatements && <div className="con">❌ Con: {contest.referendumConStatements[0]}</div>}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Component: Message
const Message = ({ text, sender, timestamp, cardData, mapsUrl, calendarUrl }) => {
  const isBot = sender === 'bot';
  const plainText = text?.replace(/\[.*?\]/gs, '').trim() || '';
  
  // Try to parse JSON from text for timeline
  let timelineData = null;
  let cleanText = text;
  if (isBot && text && text.includes('[')) {
    try {
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        timelineData = JSON.parse(jsonMatch[0]);
        cleanText = text.replace(jsonMatch[0], '');
      }
    } catch (e) {
      // Might be normal text with brackets
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`message-bubble ${isBot ? 'bot' : 'user'}`}
    >
      <div className="message-content">
        {cleanText && <ReactMarkdown>{cleanText}</ReactMarkdown>}
        {timelineData && <TimelineRenderer stages={timelineData} />}
        {cardData?.contests?.length > 0 && <BallotRenderer contests={cardData.contests} />}
        {cardData && !cardData.contests && <ElectionInfoCard data={cardData} />}
        {/* Auto-injected Google Maps + Calendar buttons when address detected */}
        {(mapsUrl || calendarUrl) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer noopener" className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}
                aria-label="Find polling places on Google Maps">
                🗺️ Open in Google Maps
              </a>
            )}
            {calendarUrl && (
              <a href={calendarUrl} target="_blank" rel="noreferrer noopener" className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}
                aria-label="Add election reminder to Google Calendar">
                📅 Add to Calendar
              </a>
            )}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="timestamp">{timestamp}</span>
          {isBot && <CopyButton text={plainText} />}
        </div>
      </div>
    </motion.div>
  );
};

// Main App
function App() {
  const INITIAL_MESSAGE = {
    id: 1,
    text: "Hello! I'm ElectionBot, your expert civic education assistant. I can help with voter registration, polling locations, election deadlines, and more. What would you like to know?",
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Load messages from localStorage for persistence
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('electionbot_messages');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch { return [INITIAL_MESSAGE]; }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('electionbot_theme') !== 'light');
  const chatEndRef = useRef(null);

  // Persist messages to localStorage
  useEffect(() => {
    try { localStorage.setItem('electionbot_messages', JSON.stringify(messages.slice(-50))); }
    catch { /* ignore storage errors */ }
  }, [messages]);

  // Apply dark/light theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('electionbot_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const clearHistory = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('electionbot_messages');
  }, []);

  const toggleTheme = useCallback(() => setIsDarkMode(prev => !prev), []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Enhanced address/location detection
      let mapsUrl = null;
      let calendarUrl = null;
      
      const lowerText = textToSend.toLowerCase();
      const hasAddress = lowerText.includes('address is') || 
                         lowerText.includes('i live in') ||
                         lowerText.includes('i am in') ||
                         lowerText.includes("i'm in") ||
                         lowerText.includes('in faridabad') ||
                         lowerText.includes('near ') ||
                         /\b[a-z]+,\s*[a-z]+\b/i.test(textToSend); // "City, State" pattern

      if (hasAddress) {
        // Extract location from common patterns
        const patterns = [
          /address is (.+)/i,
          /i live in (.+)/i,
          /i am in (.+)/i,
          /i'm in (.+)/i,
          /near (.+)/i,
          /in ([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/,
          /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)+)/,
        ];
        let address = null;
        for (const p of patterns) {
          const m = textToSend.match(p);
          if (m?.[1]) { address = m[1].trim(); break; }
        }
        if (address) {
          const encoded = encodeURIComponent(address);
          mapsUrl = `https://www.google.com/maps/search/polling+place+near+${encoded}`;
          calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Election+Day+Voting&dates=20261103T090000Z/20261103T200000Z&details=Don't+forget+to+vote!+Find+your+polling+place+near+${encoded}&location=${encoded}`;
        }
      }

      const responseText = await chatWithGemini([...messages, userMsg]);
      const botMsg = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mapsUrl,
        calendarUrl,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to my brain right now. Please check your API key or try again later.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header role="banner" className="glass-panel" style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-color)', padding: '8px', borderRadius: '12px', boxShadow: '0 0 15px var(--primary-glow)' }} aria-hidden="true">
              <Vote size={24} color="white" />
            </div>
            <h1 className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 600 }}>ElectionBot</h1>
          </div>
          <nav aria-label="App controls" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              id="btn-theme"
              className="btn-secondary"
              style={{ padding: '8px' }}
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>
            <button 
              id="btn-translate"
              className="btn-secondary" 
              style={{ padding: '8px' }}
              onClick={() => handleSend("I want to change the language of our conversation.")}
              aria-label="Translate conversation"
              title="Translate"
            >
              <Languages size={20} aria-hidden="true" />
            </button>
            <button id="btn-clear" className="btn-secondary" style={{ padding: '8px', fontSize: '0.75rem' }} onClick={clearHistory} aria-label="Clear chat history" title="Clear history">Clear</button>
          </nav>
        </header>

        {/* Chat Area */}
        <div 
          className="chat-area scrollbar-hide"
          role="log"
          aria-live="polite"
          aria-label="Conversation with ElectionBot"
        >
          <AnimatePresence>
            {messages.map(msg => (
              <Message key={msg.id} {...msg} />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="message-bubble bot typing"
              >
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Question Chips */}
        <div style={{ padding: '0 1.5rem 0.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }} role="group" aria-label="Suggested questions">
          {SUGGESTED_CHIPS.map((chip, i) => (
            <button
              key={i}
              id={`chip-${i}`}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              aria-label={`Ask: ${chip}`}
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="input-container" role="form" aria-label="Send a message">
          <div className="input-wrapper glass-panel">
            <label htmlFor="chat-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Ask ElectionBot a question</label>
            <input 
              id="chat-input"
              type="text" 
              placeholder="Ask about registration, deadlines, or polling places..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              aria-label="Type your question here"
              disabled={isLoading}
            />
            <button 
              id="btn-send"
              className="btn-primary" 
              onClick={handleSend} 
              style={{ padding: '8px 12px' }}
              aria-label="Send message"
              disabled={isLoading}
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <aside className="sidebar glass-panel" aria-label="Quick actions and resources">

        {/* Election Countdown Timer */}
        <section aria-labelledby="countdown-heading" style={{ marginBottom: '1.5rem' }}>
          <h2 id="countdown-heading" className="font-outfit" style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} aria-hidden="true" /> Next Election
          </h2>
          <CountdownTimer />
        </section>

        <section aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="font-outfit" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Actions</h2>
          <div role="group" aria-label="Common voter questions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button 
              id="btn-check-registration"
              className="btn-secondary" 
              style={{ justifyContent: 'flex-start', display: 'flex', gap: '12px', width: '100%' }}
              onClick={() => handleSend("How do I check my voter registration status?")}
              aria-label="Ask about voter registration"
            >
              <Search size={18} aria-hidden="true" /> Check Registration
            </button>
            <button 
              id="btn-find-polling"
              className="btn-secondary" 
              style={{ justifyContent: 'flex-start', display: 'flex', gap: '12px', width: '100%' }}
              onClick={() => handleSend("Where is my nearest polling place? My address is [Enter Address]")}
              aria-label="Find nearest polling place"
            >
              <MapPin size={18} aria-hidden="true" /> Find Polling Place
            </button>
            <button 
              id="btn-deadlines"
              className="btn-secondary" 
              style={{ justifyContent: 'flex-start', display: 'flex', gap: '12px', width: '100%' }}
              onClick={() => handleSend("What are the upcoming election deadlines?")}
              aria-label="View election deadlines"
            >
              <Calendar size={18} aria-hidden="true" /> Election Deadlines
            </button>
          </div>
        </section>

        <section aria-labelledby="official-sources-heading">
          <h2 id="official-sources-heading" className="font-outfit" style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Official Sources</h2>
          <div className="glass-panel" role="complementary" style={{ padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '0.5rem' }}><Info size={14} aria-hidden="true" style={{ marginRight: '4px' }} /> Always verify with your local election authority.</p>
            <a href="https://vote.gov" target="_blank" rel="noreferrer noopener" style={{ color: 'var(--primary-color)', textDecoration: 'none' }} aria-label="Vote.gov - Official US Voting Information (opens in new tab)">Vote.gov</a>
          </div>
        </section>
      </aside>

      {/* Global CSS for Bubbles (Injecting for now) */}
      <style>{`
        .message-bubble {
          max-width: 80%;
          padding: 1rem 1.25rem;
          border-radius: 18px;
          position: relative;
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .message-bubble.bot {
          align-self: flex-start;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-bottom-left-radius: 4px;
        }
        .message-bubble.user {
          align-self: flex-end;
          background: var(--primary-color);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px var(--primary-glow);
        }
        .message-content ul, .message-content ol {
          margin-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .message-content p {
          margin-bottom: 0.5rem;
        }
        .message-content p:last-child {
          margin-bottom: 0;
        }
        .info-card {
          margin-top: 1rem;
          padding: 1.5rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .card-header h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          margin: 0;
        }
        .card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-footer {
          display: flex;
          gap: 10px;
          margin-top: 0.5rem;
        }
        .card-footer .btn-primary, .card-footer .btn-secondary {
          flex: 1;
          justify-content: center;
          font-size: 0.85rem;
          padding: 8px;
        }
        .timeline-container {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .timeline-item {
          display: flex;
          gap: 1.5rem;
        }
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .marker-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.8rem;
          flex-shrink: 0;
          box-shadow: 0 0 10px var(--primary-glow);
        }
        .marker-line {
          width: 2px;
          flex: 1;
          background: var(--glass-border);
          margin: 4px 0;
        }
        .timeline-content {
          flex: 1;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .timeline-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text-primary);
        }
        .timing-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: var(--text-secondary);
        }
        .description {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        .google-tool-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--primary-color);
          background: rgba(59, 130, 246, 0.1);
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 0.75rem;
        }
        .educational-note {
          font-size: 0.8rem;
          padding: 8px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 8px;
          border-left: 3px solid var(--accent-color);
        }
        .ballot-container {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .contest-card {
          padding: 1.5rem;
          border-radius: 16px;
        }
        .contest-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.75rem;
        }
        .contest-type {
          font-size: 0.7rem;
          text-transform: uppercase;
          background: var(--glass-bg);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .candidate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .candidate-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .candidate-photo {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--glass-bg);
        }
        .candidate-info h5 {
          margin: 0;
          font-size: 0.95rem;
        }
        .party {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .youtube-link {
          font-size: 0.75rem;
          color: #ff0000;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .referendum-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .pro-con {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
        }
        .pro { color: #10b981; }
        .con { color: #ef4444; }
        .timestamp {
          display: block;
          font-size: 0.7rem;
          margin-top: 0.5rem;
          opacity: 0.6;
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}

export default App;
