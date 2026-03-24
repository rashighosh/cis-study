import { useState, useEffect, useRef } from "react";
import { submitQuestion, precheckQuestion } from '../api/llm.js';
import { logMainInteraction, logCompletion } from '../api/logging.js';
import { initCompanionCharacter, initDoctorCharacter, playGesture, speakWithLipsync, speakWithLipsyncStatic, stopCompanionGesture, focusCharacter, setSubtitleCallback } from '../character.js';
import '../css/Interaction.css';
import logo from '../assets/logo-transparent.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import SwipingCards from "./SwipingCards";
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

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
  const [participantId, setParticipantId] = useState('');
  const [condition, setCondition] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [buttonFlag, setButtonFlag] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showTip, setShowTip] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const chatRef = useRef(null);
  const tipTimeout = useRef(null);
  const messagesRef = useRef(null);
  const currentGesture = useRef('');
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [goodQuestion, setGoodQuestion] = useState(false)
  const [companionDismissed, setCompanionDismissed] = useState(false);
  const [jordanSpeaking, setJordanSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [startTalk, setStartTalk] = useState('');
  const [jordanIntro, setJordanIntro] = useState(true);
  const [gestures, setGestures] = useState(true)
  const hasStarted = useRef(false);
  const skipNextInputEffect = useRef(false);
  const skipOnSubmit = useRef(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [companionPresent, setCompanionPresent] = useState(true)
  const [startCtrl, setStartCtrl] = useState(true)
  const [transcript, setTranscript] = useState([]);
  const [events, setEvents] = useState([]);
  const [reaction, setReaction] = useState({
    gesture: '',
    label: "ready",
    color: GESTURE_COLORS["ready"],
    tip: "Here's those suggested questions from the introduction. You can pick one or type your own question below!",
    suggestions: JSON.parse(sessionStorage.getItem("suggestions")),
  });
  const companionRef = useRef(null);
  const doctorRef = useRef(null);

  // for logging
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromURL = params.get('id') || 'rashi-test';
    const conditionFromURL = parseInt(params.get('c')) ?? 1;
    setParticipantId(idFromURL)
    setCondition(conditionFromURL)
    if (conditionFromURL === 2) {
      setGestures(false)
    }
    if (conditionFromURL === 0) {
      setCompanionPresent(false)
    }
    console.log("User id = " + idFromURL + " and c = " + conditionFromURL)
    console.log("gestures is", gestures)
  }, []);

  // This effect handles the INITIAL ASSET LOAD
  useEffect(() => {
    // 1. Guard: If the divs aren't on screen yet, don't start
    if (!companionRef.current || !doctorRef.current || !isReady) return;
    (async () => {
      try {
        // 2. Load characters (using your original sequence)
        if (companionPresent){
          await initCompanionCharacter(companionRef.current);
        }
        
        await initDoctorCharacter(doctorRef.current);
        if (jordanIntro && companionPresent) {
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
    if (!companionPresent) return;
    const playIntro = async () => {
      try {
        const audioFile = '/intro-voices/companion-intro2.mp3';
        const timestampFile = '/intro-voices/companion-intro-timestamps2.json';
        
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

  const updateTranscript = (role, content, meta = {}) => {
    const newEntry = { role, content, timestamp: new Date().toISOString(), ...meta };
    setTranscript(prev => {
      const updated = [...prev, newEntry];
      console.log("about to log main interaction")
      logMainInteraction(participantId, updated);
      return updated;
    });
  };

  // Listening when user starts typing
  useEffect(() => {
    if (!isReady || !startTalk) return;
    setGoodQuestion(false)
    setHasSuggestion(false)
    clearTimeout(tipTimeout.current);
    if (buttonFlag) {
      setStartCtrl(false)
      skipNextInputEffect.current = true;
      // manually set whatever reaction state you want for button-populated input
      var newReaction = {
        gesture: "thumbsup",
        label: "good",
        color: GESTURE_COLORS["thumbsup"],
        tip: GOOD_TIPS[Math.floor(Math.random() * GOOD_TIPS.length)],
        suggestions: null,
      }
      setReaction(newReaction);
      if (gestures) {
        playGesture("thumbsup");
      }
      currentGesture.current = "thumbsup";
      setHasSuggestion(false)
      setShowTip(true);
      updateTranscript("user", selectedSuggestion, { used_suggestion: true });
      setSelectedSuggestion(null); // reset
      setButtonFlag(false); // reset the flag after handling
      return;
    }
    if (skipNextInputEffect.current) {
      skipNextInputEffect.current = false;
      return;
    }
    if (skipOnSubmit.current) {
      skipOnSubmit.current = false;
      return;
    }
    if (!input.trim()) {
      console.log("we are in the empty reaction thingy")
      setReaction({
        gesture: "thumbsup",
        label: "ready",
        color: GESTURE_COLORS["ready"],
        tip: "Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.",
        suggestions: null,
      });
      currentGesture.current = "thumbsup";
      stopCompanionGesture();
      setShowTip(true);
      return;
    }
    setCompanionDismissed(false);
    if (companionPresent) {focusCharacter(2)}
    if (currentGesture.current !== "lookdown") {
      currentGesture.current = "lookdown";
      if (gestures) {
        playGesture('lookdown');
      }
    }
    clearTimeout(tipTimeout.current);
    tipTimeout.current = setTimeout(async () => {
      try {
        if (gestures) {
          playGesture("thinking")
        }
        currentGesture.current = "thinking"
        setReaction({
          gesture: "thinking",
          label: "thinking",
          color: GESTURE_COLORS["thinking"],
          tip: companionPresent ? 'Jordan is thinking...' : 'One moment...',
          suggestions: null,
        })
        const data = await precheckQuestion(input);
        var newReactionState = data
        newReactionState["color"] = GESTURE_COLORS[data.gesture]
        console.log("Response/reaction from precheck is:", newReactionState)
        setReaction(newReactionState); // data is already { label, tip, color, emoji }
        updateTranscript("precheck", "", { precheckItem: data });
        currentGesture.current = data.gesture;
        setStartCtrl(false)
        if (data.gesture !== "thumbsup") {
          setHasSuggestion(true)
          if (gestures) {
            playGesture("indexFingerRaise")
          }
        } else {
          setHasSuggestion(false)
          setGoodQuestion(true)
          console.log("Good question is", goodQuestion)
          if (gestures) {
            playGesture(data.gesture);
          }
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
    console.log("in handle submit")
    if (!input.trim()) return;
    setGoodQuestion(false)
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    if (companionPresent) { focusCharacter(1) };
    setCompanionDismissed(true);
    console.log("SET COMPANION DISMISSED IS", companionDismissed)
    setJordanSpeaking(true)
    const userMsg = input.trim();
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    skipOnSubmit.current = true;
    // add user's message to transcript
    updateTranscript("user", userMsg)
    setInput("");
    if (gestures) {
      playGesture('lookup')
    }
    setShowTip(false);
    setIsTyping(true);
    if (gestures) {
      playGesture('startSwiping')
    }
    
    setShowCards(true);    
    try {
      const data = await submitQuestion(userMsg);
      // Do this:
      await speakWithLipsync(data.answer, 'doctor', () => {
        if (gestures) {
          playGesture('stopSwiping')
          playGesture('headNod')
        }
        
        setShowCards(false);
        setMessages(m => [...m, { from: "doctor", text: data.answer }]);
        // add dr alex's response to transcript
        updateTranscript("alex", data.answer)
        setIsTyping(false);
      });
    } catch (error) {
      console.error("Error details:", error);
      setMessages(m => [...m, { from: "doctor", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setJordanSpeaking(false)
      console.log("Question count is", questionCount)
      if (questionCount >= 5) {
        setShowContinueButton(true)
      }
    }
  };

  const continueToPostSurvey = () => {
    logCompletion(participantId)
    window.location.href = `https://ufl.qualtrics.com/jfe/form/SV_bK3UrvC3OlLjsea?id=${participantId}&c=${condition}`;
  };

  const r = reaction;

  return (
    <div className="page-wrapper">
      {!isReady && (
        <div className="loading">
          <div className="instructions">
            <img src={logo} alt="Study logo" />
            <h2>You are about the begin the <span>main interaction</span></h2>
            <hr/>
                <div className="steps">
                  <div className="step">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      To complete the main interaction, you must ask <b>Dr. Alex</b> at least <strong>five (5) questions</strong> during your conversation. However, you may ask as many questions as you'd like!
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-num">2</div>
                    <div className="step-content">
                      After Dr. Alex answer's your fifth question, a <b>Continue button</b> will appear in the <strong>bottom right corner</strong> of your screen — click it to continue to the post-survey whenever you're ready.
                    </div>
                  </div>
                </div>
            <button onClick={() => setIsReady(true)}>Click to begin <FontAwesomeIcon size="xs" icon={faArrowRight}/></button>
          </div>
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
                {isReady && companionPresent && <div className="virtual-companion" id="virtualcompanion" ref={companionRef} style={{ '--reaction-color': r.color }} onMouseEnter={() => gestures && playGesture(currentGesture.current)} />}
                {isReady && !companionPresent && <div className="ctrl-companion" id="virtualcompanion" ref={companionRef} style={{ '--reaction-color': r.color }}> <img src={logo} alt="Study logo" />Question Assistant</div>}
              </div>
              
              
              {hasSuggestion && (
                <div className="companion-thinking-bubble">
                  Hmmm...
                </div>
              )}
              {!companionPresent && startCtrl && <p className="companion-subtitle">This is where your question assistant will provide you live feedback and suggestions. Type your questions about clinical trials below for Dr. Alex to answer. If you pause for a moment after you start typing, you'll see this area silently provide feedback and suggestions to ask. You can hover over this area to see those suggestions, and click on one to use it. Try hovering over this area to see the suggestions from the introduction, or go ahead and start typing a question below!</p>}
              {jordanIntro && <p className="companion-subtitle">{subtitle}</p>}
              {!jordanSpeaking && (
                  <div className={`companion-popout ${goodQuestion ? 'popout-active' : ''}`}>
                  <div className="companion-popout-arrow" />
                  <div className="companion-info">
                    <div className="companion-meta">
                      <span className="companion-name">{companionPresent ? 'Jordan · Companion' : 'Question Assistant'}</span>
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
                          <button key={i} className="suggestion-btn" onClick={() => {setInput(s); setButtonFlag(true); setSelectedSuggestion(s);}}>
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
        {showContinueButton && <button className="continue-btn" onClick={() => {continueToPostSurvey()}}>Continue To Post Survey  <FontAwesomeIcon size="xs" icon={faArrowRight}/></button>}
      </div>
    </div>

  );
}