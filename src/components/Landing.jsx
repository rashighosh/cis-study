import { useEffect, useRef, useState } from "react";
import logo from '../assets/logo-transparent.png'
import "../css/Landing.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { initCompanionCharacter, playGesture, speakWithLipsync, speakWithLipsyncStatic, setSubtitleCallback } from '../character.js';
import { landingExample } from '../api/llm.js';

const steps = [
  {
    id: 0,
    label: "CLINICAL TRIALS EDUCATION",
    title: "Chat With Virtual Characters",
    body: "Welcome! This tool helps you explore what it means to participate in a clinical trial — not for any specific trial, but so you're informed if you're ever faced with that decision.",
    cta: "How it works",
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
    type: "llm",
    title: "Your Question Assistant",
    body: "It's not always easy to know what to ask— or even what's possible to ask. I'm here to bridge that gap. As you type, I'll give you live feedback and suggestions so you never feel lost or stuck. Just pause for a moment and I can help you shape your question into something clear and answerable.",
    cta: "Nice to meet you!",
  },
  {
    id: 3,
    label: "DR ALEX",
    title: "Your Information Assistant",
    body: "There's a lot of information out there about clinical trials — and it can be hard to know what's reliable or where to look. That's where I come in. Ask me anything about clinical trials and I'll search through trusted sources like the National Cancer Institute to find the clearest, most relevant answer for you.",
    cta: "Let's start!",
  },
];

export default function Landing() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const isTypingRef = useRef(false);
  // const [llmResponse, setLlmResponse] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmDone, setLlmDone] = useState(false);
  const [jordanSpeaking, setJordanSpeaking] = useState(true);
  const [subtitle, setSubtitle] = useState('');

  const companionRef = useRef(null);
  const headRef = useRef(null);
  const initializedRef = useRef(false);

  const showCompanion = current === 2;
  const isLast = current === steps.length - 1;
  const step = steps[current];
  const ctaDisabled = step.type === "llm" && !llmDone && !userInput.trim();

  // init on slide 2
  useEffect(() => {
    if (!showCompanion || initializedRef.current || !companionRef.current) return;
    initializedRef.current = true;
    (async () => {
      headRef.current = await initCompanionCharacter(companionRef.current);
      setSubtitleCallback((chunk) => setSubtitle(chunk));
      try {
        setJordanSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(
          '/intro-voices/jordan-intro.mp3',
          '/intro-voices/jordan-intro-timestamps.json',
          'companion'
        );
      } finally {
        setJordanSpeaking(false);
        setSubtitle('');
      }
    })();
  }, [showCompanion]);

  const transition = (dir) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => c + dir);
      setAnimating(false);
    }, 300);
  };

  useEffect(() => {
    if (!userInput) {
      isTypingRef.current = false;
      return;
    }
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      playGesture('lookdown');
    }
  }, [userInput])

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
      setJordanSpeaking(true);
      setLlmDone(true);
      await speakWithLipsync(text, 'companion', () => setLlmLoading(false));
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
    if (step.type === "llm") {
      if (!llmDone) {
        fetchLlmResponse();
      } else {
        transition(1);
      }
      return;
    }
    transition(1);
  };

  const ctaLabel = () => {
    if (step.type === "llm") {
      if (llmLoading) return "Jordan is thinking...";
      if (llmDone) return <>Who will answer my questions?<FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
      return <>Send <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    }
    if (isLast) return <>Let's start! <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    return <>{step.cta} <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
  };

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
          <p
            className="landing-body"
            dangerouslySetInnerHTML={{ __html: step.body }}
          />
        )}

      <div className="landing-buttons">
        {step.type === "llm" ? (
          <>
            {!jordanSpeaking && !llmDone && (
              <button
                className="landing-button"
                onClick={handleCta}
                disabled={ctaDisabled || llmLoading}
              >
                Send <FontAwesomeIcon size="xs" icon={faArrowRight} />
              </button>
            )}
            {!jordanSpeaking && llmDone && (
              <button className="landing-button" onClick={handleCta}>
                Who will answer my questions? <FontAwesomeIcon size="xs" icon={faArrowRight} />
              </button>
            )}
          </>
        ) : (
          <button
            className="landing-button"
            onClick={handleCta}
            disabled={ctaDisabled || llmLoading}
          >
            {ctaLabel()}
          </button>
        )}
        {current > 0 && !llmLoading && (
          <p className="landing-back" onClick={() => transition(-1)}>
            <FontAwesomeIcon size="xs" icon={faArrowLeft} /> Back
          </p>
        )}
      </div>
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