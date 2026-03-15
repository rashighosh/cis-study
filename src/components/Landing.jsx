import { useEffect, useRef, useState } from "react";
import logo from '../assets/logo-transparent.png'
import "../css/Landing.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { initCompanionCharacter, speakWithLipsync, speakWithLipsyncStatic } from '../character.js';

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
    body: "You'll interact with two virtual characters: Jordan and Dr. Alex. <b>Jordan</b> will help you find the right questions as you type. Once you're happy with your question, <b>Dr. Alex</b> will answer it using trusted sources.",
    cta: "Meet Jordan!",
  },
  {
    id: 2,
    label: "MEET JORDAN",
    type: "llm",
    title: "Hey! I'm Jordan.",
    body: "It's not always easy to know what to ask— or even what's possible to ask. I'm here to bridge that gap. As you type, I'll give you live feedback and suggestions so you never feel lost or stuck. Just pause for a moment and I can help you shape your question into something clear and answerable.",
    cta: "Nice to meet you!",
  },
  {
    id: 3,
    type: "llm",
    label: "BEFORE WE START",
    title: "Quick question...",
    prompt: "How much do you already know about clinical trials? If someone asked you to explain what one is, where would you even start?",
  },
  {
    id: 4,
    label: "ANSWERS FROM TRUSTED SOURCES",
    title: "Dr. Alex",
    body: "Dr. Alex will <b>answer your questions</b> about clinical trial concepts, using <b>trusted sources</b> like the National Cancer Institute.",
    cta: "Let's start!",
  },
];

const SYSTEM_PROMPT = (userInput) => `
You are Jordan, a warm and approachable virtual companion helping a user 
navigate a clinical trial information tool. Your personality is friendly, 
casual, and non-clinical — like a knowledgeable friend, not a doctor.

The user has just responded to the question: "How much do you already know 
about clinical trials? If someone asked you to explain what one is, where 
would you even start?"

Their response was: "${userInput}"

Your job in this turn:
1. Respond naturally to what they said — acknowledge it warmly and briefly. 
   Mirror their level of confidence back without judgment.
2. Naturally transition toward your role: you're here to help them figure 
   out what questions they have (or want to have) about clinical trials, 
   and to help shape those questions so Dr. Alex can answer them well.
3. End with a soft, open invitation — something like asking if there's 
   anything they've been wondering about, or if they'd like you to suggest 
   some directions to explore.

Keep it conversational and brief — 3 to 5 sentences max. Do not use 
clinical jargon. Do not ask more than one question at a time.
`;

export default function Landing() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmDone, setLlmDone] = useState(false);

  const companionRef = useRef(null);
  const headRef = useRef(null);
  const initializedRef = useRef(false);

  const showCompanion = current === 2 || current === 3;
  const isLast = current === steps.length - 1;
  const step = steps[current];
  const ctaDisabled = step.type === "llm" && !llmDone && !userInput.trim();

  // init on slide 2
  useEffect(() => {
    if (!showCompanion || initializedRef.current || !companionRef.current) return;
    initializedRef.current = true;

    (async () => {
      headRef.current = await initCompanionCharacter(companionRef.current);
      await speakWithLipsyncStatic(
        '/intro-voices/jordan-intro.mp3',
        '/intro-voices/jordan-intro-timestamps.json',
        'companion'
      );
      // await speakWithLipsync(
      //   "Hi! I'm Jordan. Clinical trials can be a lot to take in, and it's not always obvious what to ask, or what kind of information is even out there. That's where I come in. To show you what I mean, let's try something. What's one thing you've wondered about clinical trials? Don't worry about getting it perfect. Just say whatever comes to mind!",
      //   'companion'
      // );
    })();
  }, [showCompanion]);

  // speak slide 3 prompt when we arrive there
  useEffect(() => {
    if (current !== 3 || !headRef.current) return;
    (async () => {
      await speakWithLipsync(
        "Before we get into it — how much do you already know about clinical trials? If someone asked you to explain what one is, where would you even start?",
        'companion'
      );
    })();
  }, [current]);

  const transition = (dir) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => c + dir);
      setAnimating(false);
    }, 300);
  };

  const fetchLlmResponse = async () => {
    if (!userInput.trim() || llmLoading) return;
    setLlmLoading(true);
    setLlmResponse("");
    setLlmDone(false);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT(userInput),
          messages: [{ role: "user", content: userInput }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b) => b.type === "text")?.text ?? "";
      setLlmResponse(text);
      setLlmDone(true);
      await speakWithLipsync(text, 'companion');
    } catch (e) {
      setLlmResponse("Hmm, something went wrong. Want to try again?");
      setLlmDone(true);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCta = () => {
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
      if (llmDone) return <>Let's go! <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
      return <>Send <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    }
    if (isLast) return <>Let's start! <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    return <>{step.cta} <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
  };

  return (
    <div className="landing">
      <img src={logo} alt="Study logo" />

      {showCompanion && (
        <div
          className="virtual-companion landing-companion"
          id="virtualcompanion"
          ref={companionRef}
        />
      )}

      <div className={`landing-card ${animating ? "landing-card--hidden" : ""}`}>
        <h2>{step.label}</h2>
        <h1>{step.title}</h1>

        {step.type === "llm" ? (
          <div className="landing-llm">
            <p className="landing-body landing-prompt">{step.prompt}</p>
            {!llmDone && (
              <textarea
                className="landing-textarea"
                placeholder="Type your answer here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                rows={3}
                disabled={llmLoading}
              />
            )}
            {llmLoading && (
              <p className="landing-llm-loading">Jordan is thinking...</p>
            )}
            {llmResponse && (
              <div className="landing-llm-response">
                <span className="landing-llm-speaker">Jordan</span>
                <p>{llmResponse}</p>
              </div>
            )}
          </div>
        ) : (
          <p
            className="landing-body"
            dangerouslySetInnerHTML={{ __html: step.body }}
          />
        )}

        <div className="landing-buttons">
          <button
            className="landing-button"
            onClick={handleCta}
            disabled={ctaDisabled || llmLoading}
          >
            {ctaLabel()}
          </button>
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