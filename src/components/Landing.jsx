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
    body: "Welcome! This tool helps you explore what it means to participate in a clinical trial -- not for any specific trial, but so you're informed if you're ever faced with that decision. <br/> <br/> You will interact with two virtual characters, Jordan and Dr. Alex, in a conversation designed around <em>your values</em>.",
    cta: "Meet the virtual characters",
  },
  {
    id: 1,
    label: "MEET THE VIRTUAL CHARACTERS",
    title: "Jordan: What Are Your Values?",
    body: "Jordan will work with you to figure out good questions to ask about clinical trials, centered around <em>your values</em>. You'll bring these questions to Dr. Alex.",
    cta: "What will Dr. Alex do?",
  },
  {
    id: 2,
    label: "MEET THE VIRTUAL CHARACTERS",
    title: "Dr. Alex: Clear Answers from Trusted Sources",
    body: "Dr. Alex will answer your questions about clinical trial concepts clearly and honestly, using trusted sources like the National Cancer Institute.",
    cta: "How does it work?",
  },
  {
    id: 3,
    label: "HOW IT WORKS",
    title: "Understand your values. Get the answers you need.",
    body: "Share what matters to you, and we'll build the questions that get you the answers you actually need. You're not signing up for anything — just building understanding.",
    cta: "Meet Jordan",
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