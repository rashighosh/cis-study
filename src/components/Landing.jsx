import { useEffect, useRef, useState } from "react";
import logo from '../assets/logo-transparent.png'
import "../css/Landing.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { initCompanionCharacter, playGesture, speakWithLipsync, speakWithLipsyncStatic, setSubtitleCallback } from '../character.js';
import { landingExample, precheckQuestion } from '../api/llm.js';

const steps = [
  {
    id: 0,
    label: "CLINICAL TRIALS EDUCATION",
    title: "Chat With Virtual Characters",
    body: "Welcome! This tool helps you explore what it means to participate in a clinical trial — not for any specific trial, but so you're informed if you're ever faced with that decision.",
    cta: "What will I do?",
  },
  {
    id: 1,
    label: "HOW IT WORKS",
    title: "Find the right questions. Get the answers you need.",
    body: "You'll interact with two virtual characters: Jordan and Dr. Alex. <b>Jordan</b> will help you shape the right questions as you type. Then, <b>Dr. Alex</b> will help you find the right answer by searching multiple trusted sources.",
    cta: "Meet Jordan!",
  },
  {
    id: 2,
    label: "JORDAN",
    title: "Your Question Assistant",
    body: "It's not always easy to know what to ask— or even what's possible to ask. I'm here to bridge that gap. As you type, I'll give you live feedback and suggestions so you never feel lost or stuck. Just pause for a moment and I can help you shape your question into something clear and answerable.",
    cta: "How does it work?",
  },
  {
    id: 3,
    label: "JORDAN",
    type: "llm",
    title: "Your Question Assistant",
    body: "It's not always easy to know what to ask— or even what's possible to ask. I'm here to bridge that gap. As you type, I'll give you live feedback and suggestions so you never feel lost or stuck. Just pause for a moment and I can help you shape your question into something clear and answerable.",
    cta: "Done",
  },
  {
    id: 4,
    label: "DR ALEX",
    title: "Your Information Assistant",
    body: "There's a lot of information out there about clinical trials — and it can be hard to know what's reliable or where to look. That's where I come in. Ask me anything about clinical trials and I'll search through trusted sources like the National Cancer Institute to find the clearest, most relevant answer for you.",
    cta: "Let's start!",
  },
];

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

export default function Landing() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [buttonFlag, setButtonFlag] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const currentGesture = useRef("thumbsup");
  // const [llmResponse, setLlmResponse] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmDone, setLlmDone] = useState(false);
  const [jordanSpeaking, setJordanSpeaking] = useState(false);
  const [doctorSpeaking, setDoctorSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const companionRef = useRef(null);
  const doctorRef = useRef(null);
  const companionHeadRef = useRef(null);
  const doctorHeadRef = useRef(null);
  const companionInitializedRef = useRef(false);
  const doctorInitializedRef = useRef(false);
  const showCompanion = current === 2 || current === 3;
  const showDoctor = current === 4;

  const isLast = current === steps.length - 1;
  const step = steps[current];
  const ctaDisabled = step.type === "llm" && !llmDone && !userInput.trim();

  const tipTimeout = useRef(null);
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [reaction, setReaction] = useState({
    gesture: "thumbsup",
    label: "ready",
    color: GESTURE_COLORS["ready"],
    tip: "Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.",
    suggestions: null,
  });

  // init on slide 2
  useEffect(() => {
    console.log("HERE")
    if (!showCompanion) return;
    (async () => {
      setJordanSpeaking(true)
      if (!companionInitializedRef.current) {
        companionInitializedRef.current = true;
        companionHeadRef.current = await initCompanionCharacter(companionRef.current);
        setSubtitleCallback((chunk) => setSubtitle(chunk));
      }
      const audioFile = current === 2
        ? '/intro-voices/jordan-intro1.mp3'
        : '/intro-voices/jordan-intro2.mp3';
      const timestampFile = current === 2
        ? '/intro-voices/jordan-intro-timestamps1.json'
        : '/intro-voices/jordan-intro-timestamps2.json';

      try {
        setJordanSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(audioFile, timestampFile, 'companion');
      } finally {
        setJordanSpeaking(false);
        setSubtitle('');
      }
    })();
  }, [current, showCompanion]);

  // init on slide 3
  useEffect(() => {
    if (!showDoctor || doctorInitializedRef.current || !doctorRef.current) return;
    doctorInitializedRef.current = true;
    (async () => {
      doctorHeadRef.current = await initCompanionCharacter(doctorRef.current);
      setSubtitleCallback((chunk) => setSubtitle(chunk));
      try {
        setDoctorSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(
          '/intro-voices/doctor-intro.mp3',
          '/intro-voices/doctor-intro-timestamps.json',
          'doctor'
        );
      } finally {
        setDoctorSpeaking(false);
        setSubtitle('');
      }
    })();
  }, [showDoctor]);

  const transition = (dir) => {
    if (animating) return;
    setAnimating(true);
    setHasSuggestion(false)
    setTimeout(() => {
      setCurrent((c) => c + dir);
      setAnimating(false);
    }, 300);
  };

  // useEffect(() => {
  //   if (!userInput) {
  //     isTypingRef.current = false;
  //     return;
  //   }
  //   if (!isTypingRef.current) {
  //     isTypingRef.current = true;
  //     playGesture('lookdown');
  //   }
  // }, [userInput])

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
    if (!userInput.trim()) {
      setReaction({
        gesture: "thumbsup",
        label: "ready",
        color: GESTURE_COLORS["ready"],
        tip: "Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.",
        suggestions: null,
      });
      currentGesture.current = "thumbsup";
      setShowTip(false);
      return;
    }
    console.log("USER IS TYPING")
    if (currentGesture.current !== "lookdown") {
      currentGesture.current = "lookdown";
      playGesture('lookdown');
    }
    clearTimeout(tipTimeout.current);
    tipTimeout.current = setTimeout(async () => {
      try {
        playGesture("thinking")
        currentGesture.current = "thinking"
        const data = await precheckQuestion(userInput);
        console.log("DATA FROM PRECHECK IS", data)
        var newReactionState = data
        newReactionState["color"] = GESTURE_COLORS[data.gesture]
        console.log("NEW REACTION STATE IS", newReactionState)
        setReaction(newReactionState); // data is already { label, tip, color, emoji }
        currentGesture.current = data.gesture;
        if (data.gesture !== "thumbsup") {
          console.log("HERE HAS A SUGGESTION", hasSuggestion)
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
  }, [userInput]);

  const fetchLlmResponse = async () => {
    console.log("IN FETCH LLM RESPONSE")
    playGesture('thinking')
    if (!userInput.trim() || llmLoading) return;
    setLlmLoading(true);
    setLlmDone(false);
    try {
      const data = await landingExample(userInput);
      console.log("DATA FROM PRECHECK IS", data.reply)
      const text = data.reply;
      await speakWithLipsync(text, 'companion', () => {
        setJordanSpeaking(true);
        setLlmDone(true);
        setLlmLoading(false)}
      );
      setJordanSpeaking(false)
      setSubtitle('');
    } catch (e) {
      setLlmDone(true);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCta = () => {
    console.log("IN HANDLE CTA")
    if (isLast) {
      window.location.href = "/interaction";
      return;
    }
    // if (step.type === "llm") {
    //   if (!llmDone) {
    //     fetchLlmResponse();
    //   } else {
    //     transition(1);
    //   }
    //   return;
    // }
    transition(1);
  };

  const ctaLabel = () => {
    // if (step.type === "llm") {
    //   if (llmLoading) return "Jordan is thinking...";
    //   if (llmDone) return <>Who will answer my questions?<FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    //   return <>Send <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    // }
    if (isLast) return <>Let's start! <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    return <>{step.cta} <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
  };

  const r = reaction;

  return (
    <div className="landing">
      <img src={logo} alt="Study logo" />

      <div className={`landing-card ${animating ? "landing-card--hidden" : ""}`}>
        <h2>{step.label}</h2>
        <h1>{step.title}</h1>

        {showCompanion && (
          <div
            className="virtual-companion landing-companion"
            id="virtualcompanion"
            ref={companionRef}
          />
        )}
        <div className={`companion-popout${hasSuggestion ? ' visible' : ''}`} style={{ '--reaction-color': r.color }}>
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
            {!userInput && (
              <div className="companion-placeholder">
                Start typing a question below! Remember, if you aren't sure what to ask, you can pause for a moment and I'll help.
              </div>
            )}
            {r.suggestions && r.suggestions.length > 0 && (
              <div className="suggestions">
                {r.suggestions.map((s, i) => (
                  <button key={i} className="suggestion-btn" onClick={() => {setUserInput(s); setButtonFlag(true)}}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {showDoctor && (
          <div
            className="virtual-doctor landing-doctor"
            id="virtualdoctor"
            ref={doctorRef}
          />
        )}
        <p className="landing-subtitle">{subtitle}</p>

        {step.type === "llm" ? (
          <div className="landing-llm">
            {!jordanSpeaking && !llmDone && (
              <textarea
                className="landing-textarea"
                placeholder="What question comes to mind when you think of clinical trials?"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={3}
                disabled={llmLoading}
              />
            )}
          </div>
        ) : (
          step.id !== 2 && (
            <p
            className="landing-body"
            dangerouslySetInnerHTML={{ __html: step.body }}
          />
          ) 
        )}

      {!jordanSpeaking && (
      <div className="landing-buttons">
        <button
          className="landing-button"
          onClick={handleCta}
          disabled={ctaDisabled || llmLoading}
        >
          {ctaLabel()}
        </button>
        {current > 0 && (
          <p className="landing-back" onClick={() => transition(-1)}>
            <FontAwesomeIcon size="xs" icon={faArrowLeft} /> Back
          </p>
        )}
        </div>
        )}
      </div>
      

      <div className="landing-dots">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`landing-dot ${s.id === current ? "landing-dot--active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}