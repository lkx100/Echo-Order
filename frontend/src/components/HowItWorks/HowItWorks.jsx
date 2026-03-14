import { useState } from 'react';
import './HowItWorks.css';
import CardSwap, { Card } from '../CardSwap/CardSwap';

const steps = [
  {
    number: '01',
    icon: '🎤',
    title: 'Speak Your Order',
    description: 'Tap the mic and speak naturally. Just say what you want — EchoOrder understands plain language, no menus to scroll.',
    accent: 'cyan',
    tag: 'Voice Input',
  },
  {
    number: '02',
    icon: '🧠',
    title: 'AI Understands',
    description: 'Our voice AI processes your request in real time, confirms items, asks follow-up questions, and handles the details.',
    accent: 'purple',
    tag: 'AI Processing',
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Order Confirmed',
    description: "Your order is placed instantly. Track status by voice, make changes on the fly, and get notified when it's ready.",
    accent: 'orange',
    tag: 'Instant Delivery',
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <section className="hiw" id="how-it-works">
      {/* Hero-style background glows */}
      <div className="hiw__glow hiw__glow--yellow"></div>
      <div className="hiw__glow hiw__glow--purple"></div>

      {/* Floating decorations */}
      <span className="hiw__deco hiw__deco--1">🎙️</span>
      <span className="hiw__deco hiw__deco--2">💬</span>
      <span className="hiw__deco hiw__deco--3">🤖</span>

      {/* Left — text content */}
      <div className="hiw__content">
        <span className="hiw__label">Simple &amp; Fast</span>
        <h2 className="hiw__title">How It Works</h2>
        <p className="hiw__subtitle">
          From voice to delivery in three steps — powered by real-time AI.
        </p>

        <div className="hiw__steps">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`hiw__pill hiw__pill--${step.accent}${activeStep === i ? ' hiw__pill--active' : ''}`}
              onClick={() => setActiveStep(i)}
            >
              <span className="hiw__pill-icon">{step.icon}</span>
              <div>
                <span className="hiw__pill-num">{step.number}</span>
                <span className="hiw__pill-title">{step.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — CardSwap */}
      <div className="hiw__swap-wrapper">
        <CardSwap
          width={440}
          height={360}
          cardDistance={60}
          verticalDistance={70}
          delay={4000}
          pauseOnHover={true}
          skewAmount={6}
          easing="elastic"
          activeIndex={activeStep}
        >
          {steps.map((step) => (
            <Card key={step.number} customClass={`hiw-card--${step.accent}`}>
              <div className="hiw-card-inner">
                <div className="hiw-card-top">
                  <span className="hiw-card-icon">{step.icon}</span>
                  <span className="hiw-card-number">{step.number}</span>
                </div>
                <h3 className={`hiw-card-title hiw-card-title--${step.accent}`}>
                  {step.title}
                </h3>
                <p className="hiw-card-desc">{step.description}</p>
                <span className={`hiw-card-tag hiw-card-tag--${step.accent}`}>
                  {step.tag}
                </span>
              </div>
            </Card>
          ))}
        </CardSwap>
      </div>
    </section>
  );
};

export default HowItWorks;
