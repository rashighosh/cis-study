import { useState, useEffect, useRef } from "react";
import { submitQuestion, precheckQuestion } from '../api/llm.js';
import { initCompanionCharacter, initDoctorCharacter, playGesture, speakWithLipsync, speakWithLipsyncStatic, stopCompanionGesture, focusCharacter, setSubtitleCallback } from '../character.js';
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
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [buttonFlag, setButtonFlag] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const chatRef = useRef(null);
  const tipTimeout = useRef(null);
  const messagesRef = useRef(null);
  const currentGesture = useRef('');
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [companionDismissed, setCompanionDismissed] = useState(false);
  const [jordanSpeaking, setJordanSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [startTalk, setStartTalk] = useState('');
  const [jordanIntro, setJordanIntro] = useState(true);
  const hasStarted = useRef(false);
  const [reaction, setReaction] = useState({
    gesture: '',
    label: "ready",
    color: GESTURE_COLORS["ready"],
    tip: "Here's those suggested questions from the introduction. You can pick one or type your own question below!",
    suggestions: JSON.parse(sessionStorage.getItem("suggestions")),
  });
  const companionRef = useRef(null);
  const doctorRef = useRef(null);

  // This effect handles the INITIAL ASSET LOAD
  useEffect(() => {
    // 1. Guard: If the divs aren't on screen yet, don't start
    if (!companionRef.current || !doctorRef.current || !isReady) return;
    (async () => {
      try {
        // 2. Load characters (using your original sequence)
        await initCompanionCharacter(companionRef.current);
        await initDoctorCharacter(doctorRef.current);
        if (jordanIntro) {
          setSubtitleCallback((chunk) => setSubtitle(chunk));
        }
        setStartTalk(true)
      } catch (error) {
        console.error("Init failed:", error);
      }
    })();
  }, [isReady]); // Runs once on mount

  useEffect(() => {
    if (!isReady || !companionRef.current || !startTalk) return;
    const playIntro = async () => {
      try {
        const audioFile = '/intro-voices/companion-intro3.mp3';
        const timestampFile = '/intro-voices/companion-intro-timestamps3.json';
        
        setJordanSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(audioFile, timestampFile, 'companion');
      } catch (error) {
        console.error("Lipsync failed:", error);
      } finally {
        setJordanSpeaking(false);
        setJordanIntro(false);
        setSubtitle('');
      }
    };

    playIntro();
  }, [isReady, startTalk])

  // Listening when user starts typing
  useEffect(() => {
    if (!isReady || !startTalk) return;
    if (buttonFlag) {
      // manually set whatever reaction state you want for button-populated input
      var newReaction = {
        gesture: "thumbsup",
        label: "good",
        color: GESTURE_COLORS["thumbsup"],
        tip: GOOD_TIPS[Math.floor(Math.random() * GOOD_TIPS.length)],
        suggestions: null,
      }
      setReaction(newReaction);
      playGesture("thumbsup");
      currentGesture.current = "thumbsup";

      setShowTip(true);
      setButtonFlag(false); // reset the flag after handling
      return;
    }
    console.log("HAS STARTED IS", hasStarted)
    if (!input.trim() && !hasStarted.current) {
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
        setReaction({
          gesture: "thinking",
          label: "thinking",
          color: GESTURE_COLORS["thinking"],
          tip: "Jordan is thinking ...",
          suggestions: null,
        })
        const data = await precheckQuestion(input);
        var newReactionState = data
        newReactionState["color"] = GESTURE_COLORS[data.gesture]
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
  }, [input, isReady, buttonFlag]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    focusCharacter(1)
    setCompanionDismissed(true);
    setJordanSpeaking(true)
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
      setJordanSpeaking(false)
    }
  };

  const r = reaction;

  return (
    <div className="page-wrapper">
      {!isReady && (
        <div className="loading">
          <div className="instructions">
            <div>You are about the begin the main interaction!</div>
            <ol>
              <li>Please note that in order to complete the main interaction, <b>you must ask Dr. Alex at least five (5) questions.</b></li>
              <li>After having asked 5 questions, <b>a button will appear in the bottom right corner</b> for you to continue.</li>
            </ol>
          </div>
          <button onClick={() => setIsReady(true)}>Click to begin</button>
        </div>
      )}
      <div className="page">
        {/* Header */}
        <div className="header">
          <div className="header__eyebrow">Clinical Trials Education</div>
          <h1 className="header__title">With Jordan & Dr. Alex</h1>
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
              {isReady && <div className="virtual-doctor" id="virtualdoctor" ref={doctorRef} />}
            </div>
          </div>

          {/* Input Zone */}
          <div className="input-zone">

            {/* Companion row — CSS vars carry the dynamic color */}
            <div className={`companion-row ${companionDismissed ? "companion-row--dismissed" : ""}`}>
              <div className="virtual-companion-wrapper">
                {isReady && <div className="virtual-companion" id="virtualcompanion" ref={companionRef} style={{ '--reaction-color': r.color }} onMouseEnter={() => { playGesture(currentGesture.current); setHasSuggestion(false)}} />}
              </div>
              {hasSuggestion && (
                <div className="companion-thinking-bubble">
                  Hmmm...
                </div>
              )}
              <p className="companion-subtitle">{subtitle}</p>
              {!jordanSpeaking && (
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
                    {/* {!input && (
                      <div className="companion-placeholder">
                        Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.
                      </div>
                    )} */}
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
              )}
              
            </div>

            {/* Input row */}
            <div className="input-row">
              <textarea
                className="input-textarea"
                disabled={jordanSpeaking}
                value={input}
                onChange={e => {setInput(e.target.value), hasStarted.current = true}}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Type a question about clinical trials ..."
                rows={2}
                style={{
                  '--textarea-border': input
                    ? `${r.color}60`
                    : 'rgba(255, 255, 255, 0.35)',
                  opacity: jordanSpeaking ? 0.6 : 1, // Visual feedback
                  cursor: jordanSpeaking ? 'not-allowed' : 'text' // Change cursor style
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
    </div>

  );
}