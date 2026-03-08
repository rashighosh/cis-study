import { useState } from "react";
import logo from '../assets/logo-transparent.png'
import "../css/Landing.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

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
    cta: "Meet the virtual characters",
  },
  {
    id: 2,
    label: "Your Thinking Assistant",
    title: "Jordan",
    body: "It's not always easy to know <b>what to ask</b> — or even <b>what's possible to ask</b>. Jordan is here to bridge that gap. As you type, Jordan gives you <b>live feedback</b> and suggestions so you never feel lost or stuck. Just pause for a moment and Jordan will help you shape your question into something <b>clear and answerable</b>.",
    cta: "What will Dr. Alex do?",
  },
  {
    id: 3,
    label: "Answers from Trusted Sources",
    title: "Dr. Alex",
    body: "Dr. Alex will <b>answer your questions</b> about clinical trial concepts, using <b>trusted sources</b> like the National Cancer Institute.",
    cta: "Let's start!",
  }
];

export default function Landing() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const step = steps[current];
  const isLast = current === steps.length - 1;

  const advance = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (animating || current === 0) return;
    setAnimating(true);
    setTimeout(() => {
        setCurrent((c) => c - 1);
        setAnimating(false);
    }, 300);
    };

  const handleStart = () => {
    window.location.href = "/interaction";
  };

  return (
    <div className="landing">
      <img src={logo} alt="Study logo" />

      <div className={`landing-card ${animating ? "landing-card--hidden" : ""}`}>
        <h2>{step.label}</h2>
        <h1>{step.title}</h1>
        <p className="landing-body"   dangerouslySetInnerHTML={{ __html: step.body }}></p>
        <div className="landing-buttons">
            <button className="landing-button" onClick={isLast ? handleStart : advance}>
                {step.cta} <FontAwesomeIcon size="xs" icon={faArrowRight} />
            </button>
            {current > 0 && (
                <p className="landing-back" onClick={goBack}>
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