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
    body: "Welcome! This tool helps you learn about clinical trials through friendly, guided conversations with virtual characters.",
    cta: "Let's get started",
  },
  {
    id: 1,
    label: "WHAT YOU'LL LEARN",
    title: "Understand Clinical Trials",
    body: "Have you ever been asked to participate in a clinical trial, or wondered what that would even mean? This tool helps you learn about concepts and terms so you're ready if you're faced with that decision.",
    cta: "Who will I talk to?",
  },
  {
    id: 2,
    label: "MEET YOUR GUIDES",
    title: "Virtual Characters, Real Conversations",
    body: "You'll chat with a virtual doctor who can answer your questions about clinical trials, and a virtual companion by your side who helps you think through and shape your questions as you go.",
    cta: "How does it work?",
  },
  {
    id: 3,
    label: "HOW IT WORKS",
    title: "Simple. Conversational. Yours.",
    body: "Start a conversation and ask anything — there are no wrong questions. You're not signing up for a trial, just building the understanding of what it would mean if you did.",
    cta: "I'm ready",
  },
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
        <p className="landing-body">{step.body}</p>
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