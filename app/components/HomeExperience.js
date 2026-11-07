"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import Lenis from "lenis";
import { SolanaMark } from "./Icons";

gsap.registerPlugin(ScrollTrigger);

const protocolSteps = [
  ["01", "Commit", "The game commits to an invisible server seed."],
  ["02", "Lock", "The player commits their own entropy."],
  ["03", "Reveal", "Both seeds are revealed and checked on-chain."],
  ["04", "Prove", "Anyone can independently reproduce the outcome."],
];

const sampleRounds = [
  ["#004821", "3.2s", "Heads", "Verified"],
  ["#004820", "2.9s", "Tails", "Verified"],
  ["#004819", "4.1s", "Heads", "Verified"],
  ["#004818", "3.0s", "Heads", "Verified"],
];

function hashSeed(seed) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, "0");
}

export default function HomeExperience() {
  const page = useRef(null);
  const entropyCanvas = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [roundState, setRoundState] = useState("ready");
  const [result, setResult] = useState(null);
  const [counter, setCounter] = useState(4821);
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);
  const [packageCopied, setPackageCopied] = useState(false);
  const [verificationQuery, setVerificationQuery] = useState("");

  const sdkCode = `import { FairRound } from "@verafi/sdk";

const round = await FairRound.create({
  playerSeed, game: "coin-flip", range: 2,
});

const result = await round.reveal();
if (!result.verified) throw new Error("Invalid proof");`;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("verafi-theme");
    const nextTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let frame;
    const animate = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    const context = gsap.context(() => {
      gsap.from(".nav-shell", { y: -24, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".hero-kicker, .hero-title .line, .hero-copy, .hero-actions", {
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.12,
      });
      gsap.from(".orbital-card", { scale: 0.92, opacity: 0, duration: 1, ease: "expo.out", delay: 0.35 });
      gsap.utils.toArray(".reveal-section").forEach((section) => {
        gsap.from(section, {
          y: 50,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 86%" },
        });
      });
      gsap.utils.toArray(".section-heading > *, .demo-heading > *, .audit-heading > *, .sdk > *").forEach((element) => {
        gsap.from(element, {
          y: 30,
          opacity: 0,
          duration: 0.65,
          scrollTrigger: { trigger: element, start: "top 92%", once: true },
        });
      });
      gsap.utils.toArray(".protocol-layout, .game-panel, .verify-copy, .verification-card, .audit-grid, footer").forEach((element) => {
        gsap.from(element, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray(".protocol-step, .console-statuses div, .proof-item, .feed-row").forEach((element) => {
        gsap.from(element, {
          y: 18,
          opacity: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: element, start: "top 94%", once: true },
        });
      });
      gsap.to(".orbital-card", {
        y: 55,
        rotation: -2,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 },
      });
    }, page);

    let renderer;
    let animationFrame;
    if (entropyCanvas.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = 5;
      renderer = new THREE.WebGLRenderer({ canvas: entropyCanvas.current, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(310, 220);

      const geometry = new THREE.TorusKnotGeometry(1.15, 0.22, 160, 12, 2, 3);
      const material = new THREE.MeshStandardMaterial({
        color: 0xff775f,
        roughness: 0.22,
        metalness: 0.78,
        emissive: 0x315cff,
        emissiveIntensity: 0.18,
      });
      const knot = new THREE.Mesh(geometry, material);
      scene.add(knot);
      const nodeGeometry = new THREE.SphereGeometry(0.1, 24, 24);
      const commitNode = new THREE.Mesh(nodeGeometry, new THREE.MeshStandardMaterial({ color: 0x9bf0c2, emissive: 0x315cff, emissiveIntensity: 0.35 }));
      const revealNode = new THREE.Mesh(nodeGeometry.clone(), new THREE.MeshStandardMaterial({ color: 0xff775f, emissive: 0xff775f, emissiveIntensity: 0.45 }));
      const proofNode = new THREE.Mesh(nodeGeometry.clone(), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9bf0c2, emissiveIntensity: 0.45 }));
      commitNode.position.set(-1.8, 0.9, 0);
      revealNode.position.set(1.75, 0.6, 0);
      proofNode.position.set(0.25, -1.65, 0.2);
      scene.add(commitNode, revealNode, proofNode);
      scene.add(new THREE.AmbientLight(0xffffff, 1.3));
      const light = new THREE.PointLight(0x9bf0c2, 18, 20);
      light.position.set(3, 3, 5);
      scene.add(light);

      const animateThree = () => {
        knot.rotation.x += 0.004;
        knot.rotation.y += 0.006;
        commitNode.position.y = 0.9 + Math.sin(Date.now() * 0.001) * 0.08;
        revealNode.position.y = 0.6 + Math.cos(Date.now() * 0.001) * 0.08;
        proofNode.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.12);
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animateThree);
      };
      animateThree();
    }
    ScrollTrigger.refresh();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(animationFrame);
      lenis.destroy();
      context.revert();
      renderer?.dispose();
    };
  }, []);

  const playRound = () => {
    if (roundState === "playing") return;
    setRoundState("playing");
    setResult(null);
    setActiveStep(0);

    const sequence = [
      () => setActiveStep(1),
      () => setActiveStep(2),
      () => setActiveStep(3),
      () => {
        const outcome = Math.random() >= 0.5 ? "Heads" : "Tails";
        setResult(outcome);
        setCounter((value) => value + 1);
        setRoundState("complete");
      },
    ];
    sequence.forEach((step, index) => window.setTimeout(step, 650 * (index + 1)));
  };

  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("verafi-theme", nextTheme);
  };

  const copySdkCode = async () => {
    try {
      await navigator.clipboard.writeText(sdkCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = sdkCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const copyInstallCommand = async () => {
    const command = "npm install @verafi/sdk";
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setPackageCopied(true);
    window.setTimeout(() => setPackageCopied(false), 1600);
  };

  return (
    <main ref={page}>
      <nav className="nav-shell">
        <button className="brand" onClick={() => scrollTo("#top")} aria-label="Verafi home">
          <span className="brand-icon">V</span>
          <span>verafi</span>
        </button>
        <div className="nav-links">
          <button onClick={() => scrollTo("#protocol")}>Protocol</button>
          <button onClick={() => scrollTo("#demo")}>Demo</button>
          <button onClick={() => scrollTo("#audit")}>Audit</button>
          <button onClick={() => scrollTo("#sdk")}>SDK</button>
        </div>
        <button className="network-pill" onClick={() => scrollTo("#demo")}>
          <span className="network-dot" />
          Solana Devnet
          <span>↗</span>
        </button>
        <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
          <span className={theme === "dark" ? "active" : ""}>☾</span>
          <span className={theme === "light" ? "active" : ""}>☀</span>
        </button>
      </nav>
      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />

        <div className="hero-copy">
          <div className="hero-kicker"><span /> Open-source fairness primitive for Solana</div>
          <h1 className="hero-title">
            <span className="line">Every outcome</span>
            <span className="line">is <em>provable.</em></span>
          </h1>
          <p className="hero-lede">
            Verafi turns commit-reveal into an on-chain fairness layer for games.
            Enforce the protocol, verify every result, and let players audit the odds.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => scrollTo("#demo")}>
              Try live demo <span>↗</span>
            </button>
            <button className="text-button" onClick={() => scrollTo("#protocol")}>
              Read the protocol <span>→</span>
            </button>
          </div>
        </div>

        <div className="orbital-card" aria-label="Live verification visualization">
          <div className="orbital-label"><span className="live-dot" /> Round #{counter} finalized</div>
          <div className="orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-core">
              <SolanaMark />
            </div>
            <span className="orbit-node node-one">H</span>
            <span className="orbit-node node-two">S</span>
            <span className="orbit-node node-three">✓</span>
          </div>
          <div className="verified-row">
            <div>
              <span>Integrity</span>
              <strong>Verified on-chain</strong>
            </div>
            <div className="verified-icon">✓</div>
          </div>
        </div>

        <div className="hero-proof">
          <span>Anchored to Solana slot</span>
          <strong>267,891,042</strong>
          <span className="proof-divider" />
          <span>Finality</span>
          <strong>~0.4 sec</strong>
        </div>
      </section>

      <section className="signal-strip" aria-label="Protocol properties">
        <span>Commitment enforced</span><b>•</b>
        <span>Deadline protected</span><b>•</b>
        <span>Publicly recomputable</span><b>•</b>
        <span>SDK ready</span>
      </section>

      <section className="protocol section reveal-section" id="protocol">
        <div className="section-heading">
          <div>
            <span className="section-number">01 / Protocol</span>
            <h2>Trust the math.<br />Not the house.</h2>
          </div>
          <p>
            Neither side can choose the final outcome alone. Every round follows a
            transparent path recorded on Solana.
          </p>
        </div>
        <div className="protocol-layout">
          <div className="step-list">
            {protocolSteps.map(([number, title, copy], index) => (
              <button
                className={`protocol-step ${activeStep === index ? "active" : ""}`}
                onClick={() => setActiveStep(index)}
                key={number}
              >
                <span>{number}</span>
                <div><strong>{title}</strong><p>{copy}</p></div>
                <b>{activeStep === index ? "—" : "+"}</b>
              </button>
            ))}
          </div>
          <div className="protocol-visual">
            <canvas ref={entropyCanvas} className="entropy-canvas" aria-hidden="true" />
            <div className={`protocol-stage stage-${activeStep}`}>
              <div className="stage-label">Round lifecycle</div>
              <div className="stage-track">
                {protocolSteps.map(([_, title], index) => (
                  <div className={`stage-node ${index <= activeStep ? "reached" : ""}`} key={title}>
                    <span>{index <= activeStep ? "✓" : index + 1}</span>
                    <small>{title}</small>
                  </div>
                ))}
              </div>
              <div className="entropy-panel">
                <span>Outcome entropy</span>
                <code>{activeStep >= 2 ? "sha256(server || player || 8f1a…)" : "awaiting reveal inputs"}</code>
              </div>
              <div className="entropy-result">
                <span>Recomputed result</span>
                <strong>{activeStep >= 3 ? "HEADS" : "LOCKED"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="demo section reveal-section" id="demo">
        <div className="demo-heading">
          <span className="section-number light">02 / Live demo</span>
          <h2>Flip the coin.<br /><em>Verify the proof.</em></h2>
        </div>
        <div className="game-panel">
          <div className="coin-zone">
            <div className={`coin ${roundState === "playing" ? "flipping" : ""} ${result ? "landed" : ""}`}>
              <div className="coin-rim" />
              <div className="coin-face">
                <span className="coin-spark spark-one">✦</span>
                <span className="coin-spark spark-two">✦</span>
                <span className="coin-mark">{result ? result.slice(0, 1) : (roundState === "playing" ? "?" : "V")}</span>
                <small>{result || "Verafi"}</small>
              </div>
            </div>
            <button className="primary-button coin-button" onClick={playRound} disabled={roundState === "playing"}>
              {roundState === "playing" ? "Resolving round…" : result ? "Play another round" : "Start coin flip"}
              <span>↗</span>
            </button>
          </div>
          <div className="round-console">
            <div className="console-head">
              <span>Round #{counter}</span>
              <b>{roundState === "complete" ? "FINALIZED" : roundState === "playing" ? "IN PROGRESS" : "READY"}</b>
            </div>
            <div className="console-row">
              <span>Server commitment</span>
              <code>{hashSeed(`verafi-${counter}-server`)}</code>
            </div>
            <div className="console-row">
              <span>Player commitment</span>
              <code>{hashSeed(`player-${counter}`)}</code>
            </div>
            <div className="console-row">
              <span>Entropy slot</span>
              <code>267891042</code>
            </div>
            <div className="console-divider" />
            <div className="console-statuses">
              {protocolSteps.map(([_, title], index) => (
                <div className={index <= activeStep ? "complete" : ""} key={title}>
                  <i>{index <= activeStep ? "✓" : "○"}</i>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="verify section reveal-section" id="verify">
        <div className="verify-copy">
          <span className="section-number">03 / Universal verifier</span>
          <h2>Paste a signature.<br />Get the proof.</h2>
          <p>
            The verifier reconstructs the round directly from public transaction data.
            No platform API is required for the final answer.
          </p>
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              aria-label="Transaction signature"
              placeholder="Paste transaction signature or round PDA"
              value={verificationQuery}
              onChange={(event) => setVerificationQuery(event.target.value)}
            />
            {verificationQuery && <button className="search-clear" type="button" onClick={() => setVerificationQuery("")} aria-label="Clear signature">×</button>}
            <button className="verify-submit" aria-label="Verify round">Verify <span>→</span></button>
          </div>
          <small>Example: 5K7Q…892m</small>
        </div>
        <div className="verification-card">
          <div className="verification-head">
            <div><span className="live-dot" /> Verification result</div>
            <span>DEVNET</span>
          </div>
          <div className="proof-item">
            <i>✓</i><div><span>Commitment</span><strong>Matches revealed seed</strong></div>
          </div>
          <div className="proof-item">
            <i>✓</i><div><span>Player seed</span><strong>Locked before reveal</strong></div>
          </div>
          <div className="proof-item">
            <i>✓</i><div><span>Slot entropy</span><strong>267891042 confirmed</strong></div>
          </div>
          <div className="proof-item final">
            <i>✓</i><div><span>Independently computed</span><strong>HEADS</strong></div>
          </div>
        </div>
      </section>

      <section className="audit section reveal-section" id="audit">
        <div className="audit-heading">
          <div>
            <span className="section-number light">04 / Audit</span>
            <h2>Not just a promise.<br />A statistical record.</h2>
          </div>
          <p>Run goodness-of-fit checks across every finalized round and publish the result.</p>
        </div>
        <div className="audit-grid">
          <div className="chart-card">
            <div className="chart-head">
              <span>Outcome distribution</span>
              <b>Last 10,000 rounds</b>
            </div>
            <div className="chart-bars">
              {[48, 51, 49, 53, 47, 52, 50, 48, 54, 49].map((height, index) => (
                <i style={{ height: `${height}%` }} key={index} />
              ))}
            </div>
            <div className="chart-axis"><span>Heads</span><span>Tails</span></div>
          </div>
          <div className="stat-card">
            <span>Chi-square</span>
            <strong>0.842</strong>
            <div><small>p-value</small><b>0.3586</b></div>
            <div className="pass-pill">✓ No bias detected</div>
          </div>
          <div className="round-feed">
            <div className="feed-head"><span>Recent finalized rounds</span><button>View all →</button></div>
            {sampleRounds.map((round) => (
              <div className="feed-row" key={round[0]}>
                <strong>{round[0]}</strong><span>{round[1]}</span><b>{round[2]}</b><i>✓ {round[3]}</i>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sdk section reveal-section" id="sdk">
        <div>
          <span className="section-number">05 / SDK</span>
          <h2>Two lines in.<br />One guarantee out.</h2>
        </div>
        <div className="code-card">
          <div className="code-head">
            <div className="code-file"><span className="window-dots"><i /><i /><i /></span><span>game.ts</span></div>
            <button className={`copy-code-button ${copied ? "copied" : ""}`} type="button" onClick={copySdkCode} aria-label="Copy SDK example">
              <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>{copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <pre><code><span>import</span> {"{ FairRound }"} <span>from</span> "@verafi/sdk";{"\n\n"}
{"const round = await FairRound.create({"}{"\n"}
{"  playerSeed, game: \"coin-flip\", range: 2,"}{"\n"}
{"});"}{"\n\n"}
{"const result = await round.reveal();"}{"\n"}
{"if (!result.verified) throw new Error(\"Invalid proof\");"}</code></pre>
          <button className={`install-button ${packageCopied ? "copied" : ""}`} type="button" onClick={copyInstallCommand} aria-label="Copy npm install command">
            <span className="install-prompt">$</span>
            <code>npm install @verafi/sdk</code>
            <span className="install-copy">{packageCopied ? "Copied ✓" : "Copy ⧉"}</span>
          </button>
        </div>
      </section>

      <footer>
        <div className="footer-identity">
          <div className="brand"><span className="brand-icon">V</span><span>Verafi</span></div>
          <p>Made with Love <span className="animated-heart" aria-label="love">♥</span> by Abdullah Asger Ali</p>
          <p className="footer-role">Computer Science and Engineering Freshman at VIT Vellore.</p>
        </div>
        <div className="footer-socials" aria-label="Social profiles">
          <a href="https://www.linkedin.com/in/abdullahasgerali" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.3 7.8H1.8v9.9h3.5V7.8ZM3.55 2A2 2 0 1 0 3.5 6a2 2 0 0 0 .05-4Zm18.65 9.3c0-3.2-1.7-5.3-4.6-5.3a4.4 4.4 0 0 0-3.95 2.17V7.8h-3.5v9.9h3.5v-5.1c0-1.34.25-2.64 1.92-2.64 1.64 0 1.66 1.53 1.66 2.73v5.01h3.5v-5.65c0-.67.05-1.38-.53-1.75Z"/></svg>
          </a>
          <a href="https://github.com/uffabdullah" target="_blank" rel="noreferrer" aria-label="GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.61-3.37-1.18-3.37-1.18-.46-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.57 9.57 0 0 1 12 6.98c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86l-.01 2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
