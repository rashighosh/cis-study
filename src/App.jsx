import { useState, useEffect, useRef } from "react";
import { submitQuestion, precheckQuestion } from './api/llm.js';
import { initCompanionCharacter, initDoctorCharacter, speakText, stopCharacter } from './character.js';
import './css/App.css';

const DOCTOR_RESPONSES = {
  default: "I'm Dr. Alex, your clinical trials guide. Ask me anything about how clinical trials work, eligibility, phases, or what to expect as a participant.",
  eligibility: "Eligibility for clinical trials depends on inclusion and exclusion criteria — things like age, diagnosis, medical history, and sometimes prior treatments. The trial's team will screen you through interviews and medical records.",
  phases: "Clinical trials run in 4 phases. Phase I tests safety in a small group. Phase II expands to test effectiveness. Phase III compares against standard treatments. Phase IV happens after approval to monitor long-term effects.",
  risks: "Every trial carries some risk — side effects from experimental treatments, time commitment, and uncertainty about outcomes. However, trials also offer access to cutting-edge treatments and close medical monitoring.",
  consent: "Informed consent means you fully understand the trial before agreeing to join. You'll receive detailed documents, have time to ask questions, and can withdraw at any time without affecting your regular care.",
  compensation: "Compensation varies widely. Some trials pay for time and travel. Others only cover medical costs. It's always appropriate to ask the research team upfront what's covered.",
};

const EMOJI_MAP = { smile: "😊", think: "🤔", frown: "😟" };


function getResponse(text) {
  const t = text.toLowerCase();
  if (t.includes("eligib") || t.includes("qualify") || t.includes("who can")) return DOCTOR_RESPONSES.eligibility;
  if (t.includes("phase") || t.includes("stage")) return DOCTOR_RESPONSES.phases;
  if (t.includes("risk") || t.includes("safe") || t.includes("danger") || t.includes("side effect")) return DOCTOR_RESPONSES.risks;
  if (t.includes("consent") || t.includes("sign") || t.includes("agree") || t.includes("rights")) return DOCTOR_RESPONSES.consent;
  if (t.includes("pay") || t.includes("money") || t.includes("compens") || t.includes("cost")) return DOCTOR_RESPONSES.compensation;
  return DOCTOR_RESPONSES.default;
}

const SUGGESTED = [
  "What are the phases of a clinical trial?",
  "Who is eligible to join a trial?",
  "What risks should I know about?",
  "Do participants get compensated?",
  "What does informed consent mean?",
];

export default function App() {
  const [messages, setMessages] = useState([
    { from: "doctor", text: DOCTOR_RESPONSES.default }
  ]);
  const [input, setInput] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [companionAnim, setCompanionAnim] = useState(false);
  const chatRef = useRef(null);
  const tipTimeout = useRef(null);
  const [reaction, setReaction] = useState({
    label: "ready",
    color: "#94a3b8",
    emoji: "smile",
    tip: null,
    suggestions: null,
  });
  const companionRef = useRef(null);
  const doctorRef = useRef(null);

  useEffect(() => {
    if (!companionRef.current) return;
    initCompanionCharacter(companionRef.current);
  }, []);

  useEffect(() => {
    if (!doctorRef.current) return;
    initDoctorCharacter(doctorRef.current);
  }, []);

  useEffect(() => {
    if (!input.trim() || input.length <= 5) {
      setReaction({
        label: "ready",
        color: "#94a3b8",
        emoji: "smile",
        tip: null,
        suggestions: null,
      });
      setShowTip(false);
      return;
    }

    clearTimeout(tipTimeout.current);
    tipTimeout.current = setTimeout(async () => {
      try {
        const data = await precheckQuestion(input);
        console.log("DATA FROM PRECHECK IS", data)
        setReaction(data); // data is already { label, tip, color, emoji }
        setShowTip(true);
      } catch {
        // silently fail — don't disrupt the user
      }
    }, 800);
  }, [input]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    setShowTip(false);
    setIsTyping(true);
    setCompanionAnim(true);
    setTimeout(() => setCompanionAnim(false), 600);

    try {
      const data = await submitQuestion(userMsg);
      setMessages(m => [...m, { from: "doctor", text: data.reply }]);
    } catch (error) {
      setMessages(m => [...m, { from: "doctor", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const r = reaction;

  return (
    <div className="page">

      {/* Header */}
      <div className="header">
        <div className="header__eyebrow">Clinical Trials Education</div>
        <h1 className="header__title">Ask Dr. Alex</h1>
      </div>

      {/* Main Panel */}
      <div className="panel">

        {/* Doctor Header */}
        <div className="doctor-header">
          <div>
            <div className="doctor-name">Dr. Alex</div>
            <div className="doctor-status">
              <span className="doctor-status__dot"></span>
              Clinical Research Specialist · Online
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat" ref={chatRef}>            
          <div className="messages">
           {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-row message-row--${msg.from}`}
            >
              {msg.from === "doctor" && (
                <div className="message-avatar">🩺</div>
              )}
              <div className={`message-bubble message-bubble--${msg.from}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row message-row--doctor">
              <div className="message-avatar">🩺</div>
              <div className="typing-bubble">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="typing-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          </div>
          <div className="doctor-character-area">
            <div className="virtual-doctor" ref={doctorRef} />
          </div>
        </div>

        {/* Suggestions */}
        {r.suggestions && r.suggestions.length > 0 && (
          <div className="suggestions">
            {r.suggestions.map((s, i) => (
              <button key={i} className="suggestion-btn" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Zone */}
        <div className="input-zone">

          {/* Companion row — CSS vars carry the dynamic color */}
          <div className="companion-row">
            <div
              className={`companion-avatar${companionAnim ? " companion-avatar--anim" : ""}`}
              style={{ '--reaction-color': r.color }}
            >
              {EMOJI_MAP[r.emoji]}
            </div>
            <div className="virtual-character" ref={companionRef} />

            <div className="companion-info">
              <div className="companion-meta">
                <span className="companion-name">Jordan · Companion</span>
                <span
                  className="companion-label"
                  style={{ '--reaction-color': r.color }}
                >
                  {r.label}
                </span>
              </div>

              <div className={`companion-tip-wrapper companion-tip-wrapper--${showTip && r.tip ? "visible" : "hidden"}`}>
                <div
                  className="companion-tip"
                  style={{ '--reaction-color': r.color }}
                >
                  {r.tip}
                </div>
              </div>

              {!input && (
                <div className="companion-placeholder">
                  I'll review your question as you type...
                </div>
              )}
            </div>
          </div>

          {/* Input row */}
          <div className="input-row">
            <textarea
              className="input-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask Dr. Alex about clinical trials..."
              rows={2}
              style={{
                '--textarea-border': input
                  ? `${r.color}60`
                  : 'rgba(148,163,184,0.15)'
              }}
            />
            <button
              className={`send-btn send-btn--${input.trim() ? "active" : "disabled"}`}
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              →
            </button>
          </div>

          <div className="input-hint">
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}