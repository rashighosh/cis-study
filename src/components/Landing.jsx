import { useEffect, useRef, useState } from "react";
import logo from '../assets/logo-transparent.png'
import "../css/Landing.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { initCompanionCharacter, playGesture, speakWithLipsync, speakWithLipsyncStatic, setSubtitleCallback, initDoctorCharacter } from '../character.js';
import { landingExample, precheckQuestion } from '../api/llm.js';
import { logSession, logLandingQuestion, logLandingPrecheck } from '../api/logging.js';

const steps = [
  {
    id: 0,
    label: "CLINICAL TRIALS EDUCATION",
    labelCtrl: "CLINICAL TRIALS EDUCATION",
    title: "Chat With Virtual Characters",
    titleCtrl: "Chat With A Virtual Character",
    body: "Welcome! This tool helps you explore what it means to participate in a clinical trial — not for any specific trial, but so you're informed if you're ever faced with that decision.",
    bodyCtrl: "Welcome! This tool helps you explore what it means to participate in a clinical trial — not for any specific trial, but so you're informed if you're ever faced with that decision.",
    cta: "What will I do?",
    ctaCtrl: "What will I do?",
    character: false,
  },
  {
    id: 1,
    label: "HOW IT WORKS",
    labelCtrl: "HOW IT WORKS",
    title: "Find the right questions. Get the answers you need.",
    titleCtrl: "Find the right questions. Get the answers you need.",
    body: "You'll interact with two virtual characters: Jordan and Dr. Alex. <b>Jordan</b> will help you shape the right questions as you type. Then, <b>Dr. Alex</b> will help you find the right answer by searching multiple trusted sources.",
    bodyCtrl: "This interaction is designed to help shape your questions as you type. Then, a virtual character, <b>Dr. Alex</b>, will help you find the right answer by searching multiple trusted sources.",
    cta: "Get ready to meet the virtual characters",
    ctaCtrl: "Get ready to meet the virtual character",
    character: false,
  },
  {
    id: 2,
    label: "HOW IT WORKS",
    labelCtrl: "HOW IT WORKS",
    title: "Let's get set up",
    titleCtrl: "Let's get set up",
    body: "The <b>virtual characters</b> will interact using both <b>audio and text</b>, so please make sure your volume is turned up! For your convenience and privacy, you will interact with the virtual characters using <b>text only, by typing your questions</b>. Finally, for the best experience, please also make sure your <b>browser window is maximized</b>.",
    bodyCtrl: "The <b>virtual character</b> will interact using both <b>audio and text</b>, so please make sure your volume is turned up! For your convenience and privacy, you will interact with the virtual character using <b>text only, by typing your questions</b>. Finally, for the best experience, please also make sure your <b>browser window is maximized</b>.",
    cta: "My volume is turned up and my window is maximized",
    ctaCtrl: "My volume is turned up and my window is maximized",
    character: false,
  },
  {
    id: 3,
    label: "GET READY",
    labelCtrl: "GET READY",
    title: "Get ready to meet Jordan and Dr. Alex",
    titleCtrl: "Get ready to see how it works",
    body: "For the rest of this introduction, you will briefly meet Jordan and Dr. Alex one by one to get to know their roles. Then, you will be redirected to the actual interaction!",
    bodyCtrl: "For the rest of this introduction, you'll first walk through how this tool helps you shape your questions. Then, you'll briefly meet Dr. Alex to to get to know their role. Finally, you will be redirected to the actual interaction!",
    cta: "Meet Jordan!",
    ctaCtrl: "Show me how it works!",
    character: false,
  },
  {
    id: 4,
    label: "JORDAN",
    labelCtrl: "Asking Questions",
    type: "llm",
    title: "Your Question Assistant",
    titleCtrl: "Question Assistant",
    body: "It's not always easy to know what to ask— or even what's possible to ask. I'm here to bridge that gap. As you type, I'll give you live feedback and suggestions so you never feel lost or stuck. Just pause for a moment and I can help you shape your question into something clear and answerable.",
    bodyCtrl: "Clinical trials can be a lot to take in — and it's not always obvious what to ask. This tool will offer tips and suggestions to help you shape your questions. So you know what to expect, let's do a quick demonstration. In the text box below, please share: what's one thing you've wondered about clinical trials? Type whatever comes to mind — it doesn't have to be perfect.",
    cta: "Done",
    character: true,
  },
  {
    id: 5,
    label: "DR ALEX",
    labelCtrl: "DR ALEX",
    title: "Your Information Assistant",
    titleCtrl: "Your Information Assistant",
    body: "Hi, I'm Doctor Alex! There's a lot of information out there about clinical trials — and it can be hard to know what's reliable or where to look. That's where I come in. When you ask me a question about clinical trials, I'll search through trusted sources like the National Cancer Institute to find the clearest, most relevant answer for you.",
    cta: "Let's start!",
    character: true,
    ctrlDoctor: true,
  },
];

export default function Landing() {
  const [participantId, setParticipantId] = useState('');
  const [condition, setCondition] = useState(1);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const isTypingRef = useRef(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmDone, setLlmDone] = useState(false);
  const [jordanSpeaking, setJordanSpeaking] = useState(true);
  const [subtitle, setSubtitle] = useState('');
  const [gestures, setGestures] = useState(true)
  const [companionPresent, setCompanionPresent] = useState(true)
  const [ctrlLLM, setCtrlLLM] = useState(false)
  const [ctrlLLMResponse, setCtrlLLMResponse] = useState('')
  const companionRef = useRef(null);
  const doctorRef = useRef(null);
  const companionHeadRef = useRef(null);
  const doctorHeadRef = useRef(null);
  const companionInitializedRef = useRef(false);
  const doctorInitializedRef = useRef(false);
  const showCompanion = current === 4;
  const showDoctor = current === 5;

  const isLast = current === steps.length - 1;
  const step = steps[current];
  const ctaDisabled = step.type === "llm" && !llmDone && !userInput.trim();

  // for logging
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromURL = params.get('id') || 'rashi-test';
    const conditionFromURL = parseInt(params.get('c')) ?? 1;
    console.log("parseInt(params.get('c'))", parseInt(params.get('c')))
    console.log(conditionFromURL)
    setParticipantId(idFromURL)
    setCondition(conditionFromURL)
    console.log("Extracting stuff from url...")
    if (conditionFromURL === 2) {
      setGestures(false)
      console.log("gestures?", gestures)
    }
    if (conditionFromURL === 0) {
      setCompanionPresent(false)
      console.log("is companion present?", companionPresent)
    }
    
    if (idFromURL) {
      logSession(idFromURL, conditionFromURL);
    }
    console.log("Logged Session for id = " + idFromURL + " and c = " + conditionFromURL)
  }, []);

  // init companion
  useEffect(() => {
    if (!showCompanion) return;
    if (!companionPresent) return;
    (async () => {
      setJordanSpeaking(true)
      if (!companionInitializedRef.current) {
        companionInitializedRef.current = true;
        companionHeadRef.current = await initCompanionCharacter(companionRef.current);
        setSubtitleCallback((chunk) => setSubtitle(chunk));
      }
      const audioFile = '/intro-voices/companion-intro1.mp3'
      const timestampFile = '/intro-voices/companion-intro-timestamps1.json';

      try {
        setJordanSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(audioFile, timestampFile, 'companion', gestures);
      } finally {
        setJordanSpeaking(false);
        setSubtitle('');
      }
    })();
  }, [current, showCompanion]);

  // init on slide 4
  useEffect(() => {
    console.log("IN SLIDE 4")
    if (!showDoctor || doctorInitializedRef.current || !doctorRef.current) return;
    console.log("HERE")
    doctorInitializedRef.current = true;
    (async () => {
      doctorHeadRef.current = await initDoctorCharacter(doctorRef.current, 'upper');
      setSubtitleCallback((chunk) => setSubtitle(chunk));
      try {
        setJordanSpeaking(true);
        setSubtitle('');
        await speakWithLipsyncStatic(
          '/intro-voices/doctor-intro1.mp3',
          '/intro-voices/doctor-intro-timestamps1.json',
          'doctor',
          gestures
        );
      } finally {
        setJordanSpeaking(false);
        setSubtitle('');
      }
    })();
  }, [showDoctor]);

  const transition = (dir) => {
    if (animating) return;
    setJordanSpeaking(true)
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
      if (gestures) {
        playGesture('lookdown');
      }
    }
  }, [userInput])

  const fetchLlmResponse = async () => {
    console.log("IN FETCH LLM RESPONSE")
    if (gestures) {
      playGesture('thinking')
    }
    if (!userInput.trim() || llmLoading) return;
    setLlmLoading(true);
    setLlmDone(false);
    logLandingQuestion(participantId, userInput)
    console.log("Logged landing question in database.")
    try {
      const data = await landingExample(userInput);
      console.log("DATA FROM PRECHECK IS", data.reply)
      logLandingPrecheck(participantId, data.reply)
      const text = data.reply.response;
      sessionStorage.setItem("suggestions", JSON.stringify(data.reply.suggestions))
      console.log("STORED SUGGESTIONS IN SESSION STORAGE", sessionStorage.getItem("suggestions"))
      if (companionPresent) {
        await speakWithLipsync(text, 'companion', () => {
          setJordanSpeaking(true);
          setLlmDone(true);
          setLlmLoading(false)}
        );
        setJordanSpeaking(false)
        setSubtitle('');
      } else {
        setLlmDone(true);
        setLlmLoading(false)
        setCtrlLLM(true)
        const ctrlText = text.replace("I'll", "This tool will");
        setCtrlLLMResponse(ctrlText)
      }
    } catch (e) {
      setLlmDone(true);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCta = () => {
    console.log("IN HANDLE CTA")
    if (isLast) {
      window.location.href = `/interaction?id=${participantId}&c=${condition}`;
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
      if (llmLoading && companionPresent) return "Jordan is thinking...";
      if (llmLoading && !companionPresent) return "One moment..."
      if (llmDone) return <>Meet Dr. Alex!<FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
      return <>Send <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    }
    if (isLast) return <>Let's start! <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
    return <>{companionPresent ? step.cta : step.ctaCtrl} <FontAwesomeIcon size="xs" icon={faArrowRight} /></>;
  };

  return (
    <div className="landing">
      <img src={logo} alt="Study logo" />

      <div className={`landing-card ${animating ? "landing-card--hidden" : ""}`}>
        <h2>{companionPresent ? step.label : step.labelCtrl}</h2>
        <h1>{companionPresent ? step.title : step.titleCtrl}</h1>

        {showCompanion && companionPresent && (
          <div
            className="virtual-companion landing-companion"
            id="virtualcompanion"
            ref={companionRef}
          />
        )}
        {showDoctor && (
          <div
            className="virtual-doctor landing-doctor"
            id="virtualdoctor"
            ref={doctorRef}
          />
        )}
        {step.character === true && companionPresent && (
          <p className="landing-subtitle">{subtitle}</p>
        )}
        {!companionPresent && step.ctrlDoctor === true && (
          <p className="landing-subtitle">{subtitle}</p>
        )}

        {step.type === "llm" && companionPresent ? (
          <div className={`landing-llm ${!jordanSpeaking && !llmDone ? 'visible' : 'hidden'}`}>
            <textarea
              className="landing-textarea"
              placeholder="What question comes to mind when you think of clinical trials?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              disabled={llmLoading}
            />
          </div>
        ) : (
          step.id !== 4 && step.id !== 5 && step.id !== 6 && (
            <p
            className="landing-body"
            dangerouslySetInnerHTML={{ __html: companionPresent ? step.body : step.bodyCtrl }}
          />
          ) 
        )}

        {step.type === "llm" && !companionPresent && (
          <p
            className="landing-body"
            dangerouslySetInnerHTML={{ __html: ctrlLLM ? ctrlLLMResponse : step.bodyCtrl }}
          />
        )}

        {step.type === "llm" && !companionPresent &&
          <div className={`landing-llm ${ctrlLLM ? 'hidden' : 'visible'}`}>
            <textarea
              className='landing-textarea'
              placeholder="What question comes to mind when you think of clinical trials?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={3}
              disabled={llmLoading}
            />
          </div>
        }

        {step.character && companionPresent ? (
          <div>
            <div className={`landing-buttons ${jordanSpeaking ? 'hidden' : 'visible'}`}>
              <button
                className="landing-button"
                onClick={handleCta}
                disabled={ctaDisabled || llmLoading}
              >
                {ctaLabel()}
              </button>
            </div>
          </div>
        ) : (
            <div className="landing-buttons">
              <button
                className="landing-button"
                onClick={handleCta}
                disabled={ctaDisabled || llmLoading}
              >
                {ctaLabel()}
              </button>
            </div> 
        )}

        {step.character && !companionPresent && step.id !== 4 && (
          <div>
            <div className={`landing-buttons ${jordanSpeaking ? 'hidden' : 'visible'}`}>
              <button
                className="landing-button"
                onClick={handleCta}
                disabled={ctaDisabled || llmLoading}
              >
                {ctaLabel()}
              </button>
            </div>
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