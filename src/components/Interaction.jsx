import { useState, useEffect, useRef } from "react";
import { submitQuestion, precheckQuestion } from '../api/llm.js';
import { initCompanionCharacter, initDoctorCharacter, playGesture, speakWithLipsync, stopCompanionGesture, focusCharacter } from '../character.js';
import '../css/Interaction.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import SwipingCards from "./SwipingCards";

const GESTURE_COLORS = {
  ready:    "#868686",
  thinking: "#b67300",
  thumbsup: "#008357",
  shrug:    "#6366f1",
};

const GOOD_TIPS = [
  "This question looks good!",
  "I like this -- good question!",
  "That's a great question!",
  "I think this is a solid question!",
];

export default function Interaction() {
  const [messages, setMessages] = useState([
    { from: "doctor", text: "I'm Dr. Alex, your clinical trials guide. Ask me anything about how clinical trials work, eligibility, phases, or what to expect as a participant." }
  ]);
  const [input, setInput] = useState("");
  const [buttonFlag, setButtonFlag] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const chatRef = useRef(null);
  const tipTimeout = useRef(null);
  const messagesRef = useRef(null);
  const currentGesture = useRef("thumbsup");
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [companionDismissed, setCompanionDismissed] = useState(false);
  const [reaction, setReaction] = useState({
    gesture: "thumbsup",
    label: "ready",
    color: GESTURE_COLORS["ready"],
    tip: "Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.",
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

  // Listening when user starts typing
  useEffect(() => {
    if (buttonFlag) {
      console.log("BUTTON FLAG!", buttonFlag)
      // manually set whatever reaction state you want for button-populated input
      console.log("GOING TO SET REACTION")
      var newReaction = {
        gesture: "thumbsup",
        label: "good",
        color: GESTURE_COLORS["thumbsup"],
        tip: GOOD_TIPS[Math.floor(Math.random() * GOOD_TIPS.length)],
        suggestions: null,
      }
      console.log("NEW REACTION STATE IS", newReaction)
      setReaction(newReaction);
      playGesture("thumbsup");
      currentGesture.current = "thumbsup";

      setShowTip(true);
      setButtonFlag(false); // reset the flag after handling
      return;
    }
    if (!input.trim()) {
      setReaction({
        gesture: "thumbsup",
        label: "ready",
        color: GESTURE_COLORS["ready"],
        tip: "Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.",
        suggestions: null,
      });
      currentGesture.current = "thumbsup";
      stopCompanionGesture();
      setShowTip(false);
      return;
    }
    console.log("USER IS TYPING")
    setCompanionDismissed(false);
    focusCharacter(2)
    if (currentGesture.current !== "lookdown") {
      currentGesture.current = "lookdown";
      playGesture('lookdown');
    }
    clearTimeout(tipTimeout.current);
    tipTimeout.current = setTimeout(async () => {
      try {
        playGesture("thinking")
        currentGesture.current = "thinking"
        const data = await precheckQuestion(input);
        console.log("DATA FROM PRECHECK IS", data)
        var newReactionState = data
        newReactionState["color"] = GESTURE_COLORS[data.gesture]
        console.log("NEW REACTION STATE IS", newReactionState)
        setReaction(newReactionState); // data is already { label, tip, color, emoji }
        currentGesture.current = data.gesture;
        if (data.gesture !== "thumbsup") {
          setHasSuggestion(true)
          playGesture("indexFingerRaise")
        } else {
          playGesture(data.gesture);
        }
        setShowTip(true);
      } catch {
        // silently fail — don't disrupt the user
      }
    }, 800);
  }, [input]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    console.log("USER HAS SUBMITTED QUERY")
    focusCharacter(1)
    setCompanionDismissed(true);
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
      // Do this:
      await speakWithLipsync(data.answer, 'doctor', () => {
        playGesture('stopSwiping')
        playGesture('headNod')
        setShowCards(false);
        setMessages(m => [...m, { from: "doctor", text: data.answer }]);
        setIsTyping(false);
      });
    } catch (error) {
      console.error("Error details:", error);
      setMessages(m => [...m, { from: "doctor", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      console.log("DONE")
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
            <div className="virtual-doctor" id="virtualdoctor" ref={doctorRef} />
          </div>
        </div>

        {/* Input Zone */}
        <div className="input-zone">

          {/* Companion row — CSS vars carry the dynamic color */}
          <div className={`companion-row ${companionDismissed ? "companion-row--dismissed" : ""}`}>
            <div className="virtual-companion-wrapper">
              <div className="virtual-companion" id="virtualcompanion" ref={companionRef} style={{ '--reaction-color': r.color }} onMouseEnter={() => { playGesture(currentGesture.current); setHasSuggestion(false)}} />
            </div>
            {hasSuggestion && (
              <div className="companion-thinking-bubble">
                Hmmm...
              </div>
            )}
            <div className="companion-popout" style={{ '--reaction-color': r.color }}>
                <div className="companion-popout-arrow" />
                <div className="companion-info">
                  <div className="companion-meta">
                    <span className="companion-name">Jordan · Companion</span>
                    <span className="companion-label" style={{ '--reaction-color': r.color }}>
                      {r.label}
                    </span>
                  </div>
                  <div className={`companion-tip-wrapper companion-tip-wrapper--${showTip && r.tip ? "visible" : "hidden"}`}>
                    <div className="companion-tip" style={{ '--reaction-color': r.color }}>
                      {r.tip}
                    </div>
                  </div>
                  {!input && (
                    <div className="companion-placeholder">
                      Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.
                    </div>
                  )}
                  {r.suggestions && r.suggestions.length > 0 && (
                    <div className="suggestions">
                      {r.suggestions.map((s, i) => (
                        <button key={i} className="suggestion-btn" onClick={() => {setInput(s); setButtonFlag(true)}}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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