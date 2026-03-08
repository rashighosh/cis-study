import { useState, useEffect, useRef } from "react";
import { submitQuestion, precheckQuestion } from '../api/llm.js';
import { initCompanionCharacter, initDoctorCharacter, playGesture, speakWithLipsync, stopCompanionGesture } from '../character.js';
import '../css/Interaction.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'

const GESTURE_COLORS = {
  ready:    "#868686",
  thinking: "#b67300",
  thumbsup: "#008357",
  shrug:    "#6366f1",
};

const CARDS = [
  { id: 1, title: "Searching NCI", subtitle: "National Cancer Institute" },
  { id: 2, title: "Searching NIH", subtitle: "National Institutes of Health resources"  },
  { id: 3, title: "Searching FDA", subtitle: "Federal Drug Administration resources" },
  { id: 4, title: "Searching HHS", subtitle: "Department of Health & Human Services resources" },
];

const CYCLE_MS = 1900;
const CARD_WIDTH = 200;
const FIRST_PAUSE_MS = 900; // how long first card lingers

function SwipingCards() {
  const [offset, setOffset] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevOffset = useRef(0);
  const loopStarted = useRef(false); // track when pause is over

  useEffect(() => {
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;

      // Still in the initial pause — card sits still
      if (elapsed < FIRST_PAUSE_MS) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      // Loop starts only after the pause
      const loopElapsed = elapsed - FIRST_PAUSE_MS;
      const t = (loopElapsed % CYCLE_MS) / CYCLE_MS;
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const newOffset = eased * CARD_WIDTH;

      if (prevOffset.current > CARD_WIDTH * 0.9 && newOffset < CARD_WIDTH * 0.1) {
        setSwipeCount(c => c + 1);
      }
      prevOffset.current = newOffset;
      setOffset(newOffset);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="swipe-cards">
      {[0, 1, 2].map((layer) => {
        const card = CARDS[(swipeCount + layer) % CARDS.length];
        const x = layer === 0 ? offset : offset - CARD_WIDTH * layer;
        return (
          <div
            key={layer}
            className="swipe-card"
            style={{
              transform: `translateX(${x}px) scale(${1 - layer * 0.05})`,
              opacity: layer === 2 ? 0.4 : 1,
              zIndex: 3 - layer,
            }}
          >
            <div className="swipe-card__title">{card.title}</div>
            <div className="swipe-card__subtitle">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Interaction() {
  const [messages, setMessages] = useState([
    { from: "doctor", text: "I'm Dr. Alex, your clinical trials guide. Ask me anything about how clinical trials work, eligibility, phases, or what to expect as a participant." }
  ]);
  const [input, setInput] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const abortController = useRef(null);
  const chatRef = useRef(null);
  const messagesRef = useRef(null);
  const currentGesture = useRef("ready");
  const tipTimeout = useRef(null);
  const [reaction, setReaction] = useState({
    gesture: "ready",
    label: "ready",
    color: GESTURE_COLORS["ready"],
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
    if (!input.trim()) {
      setReaction({
        gesture: "ready",
        label: "ready",
        color: GESTURE_COLORS["ready"],
        tip: null,
        suggestions: null,
      });
      currentGesture.current = "ready";
      stopCompanionGesture();
      setShowTip(false);
      return;
    }
    if (currentGesture.current !== "thinking") {
      currentGesture.current = "thinking";
      playGesture('thinking');
    }
    clearTimeout(tipTimeout.current);
    tipTimeout.current = setTimeout(async () => {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();
      try {
        const data = await precheckQuestion(input, abortController.current.signal);
        console.log("DATA FROM PRECHECK IS", data)
        var newReactionState = data
        newReactionState["color"] = GESTURE_COLORS[data.gesture]
        console.log("NEW REACTION STATE IS", newReactionState)
        setReaction(newReactionState); // data is already { label, tip, color, emoji }
        currentGesture.current = data.gesture;
        playGesture(data.gesture);
        setShowTip(true);
      } catch (e) {
        if (e.name === 'AbortError') return; // ignore cancelled requests
      }
    }, 800);
  }, [input]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    playGesture('lookup')
    setShowTip(false);
    setIsTyping(true);
    playGesture('startSwiping')
    setShowCards(true);    
    try {
      const data = await submitQuestion(userMsg);
      playGesture('stopSwiping')
      playGesture('headNod')
      await speakWithLipsync(data.answer);
      setShowCards(false);
      setMessages(m => [...m, { from: "doctor", text: data.answer }]);
    } catch (error) {
      console.error("Error details:", error);
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

        {/* Chat Area */}
        <div className="chat" ref={chatRef}>            
          <div className="messages" ref={messagesRef}>
           {messages.map((msg, i) => (
              <div key={i} className={`message-wrapper message-wrapper--${msg.from}`}>
                <div className={`message-name`}>{msg.from === 'doctor' ? 'Dr. Alex' : 'You'}</div>
                <div className={`message-row message-row--${msg.from}`}>
                  <div className={`message-bubble message-bubble--${msg.from}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

          {isTyping && (
            <div className="message-row message-row--doctor">
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
            {showCards && <SwipingCards />}
            <div className="virtual-doctor" ref={doctorRef} />
          </div>
        </div>

        {/* Input Zone */}
        <div className="input-zone">

          {/* Companion row — CSS vars carry the dynamic color */}
          <div className="companion-row">
            <div className="virtual-companion" ref={companionRef} style={{ '--reaction-color': r.color }} />

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
                  : 'rgba(255, 255, 255,0.35)'
              }}
            />
            <button
              className={`send-btn send-btn--${input.trim() ? "active" : "disabled"}`}
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
            <FontAwesomeIcon icon={faPaperPlane} />
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