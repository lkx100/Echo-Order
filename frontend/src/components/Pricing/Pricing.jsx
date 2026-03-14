import './Pricing.css';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for trying out EchoOrder at home or a single kiosk.',
    features: [
      '50 voice orders / month',
      'Customer mode only',
      'Basic menu management',
      'Community support',
    ],
    cta: 'Get Started',
    accent: 'default',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/ month',
    description: 'For growing restaurants ready to streamline their ordering flow.',
    features: [
      'Unlimited voice orders',
      'Customer & Admin modes',
      'Full menu management',
      'Order analytics dashboard',
      'Priority support',
      'Custom AI voice personality',
    ],
    cta: 'Start Free Trial',
    accent: 'cyan',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Multi-location chains and franchises with advanced requirements.',
    features: [
      'Everything in Pro',
      'Multi-location support',
      'Custom LLM fine-tuning',
      'White-label branding',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    accent: 'purple',
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section className="pricing" id="pricing">
      <div className="pricing__glow"></div>

      <div className="pricing__container">
        <div className="pricing__header">
          <span className="pricing__label">Pricing</span>
          <h2 className="pricing__title">See Our Pricing</h2>
          <p className="pricing__subtitle">
            Simple, transparent pricing. No hidden fees. Start free and scale as you grow.
          </p>
        </div>

        <div className="pricing__grid">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing__card pricing__card--${plan.accent}${plan.featured ? ' pricing__card--featured' : ''}`}
            >
              {plan.featured && (
                <div className="pricing__badge">Most Popular</div>
              )}

              <div className="pricing__plan-name">{plan.name}</div>
              <div className="pricing__price-row">
                <span className="pricing__price">{plan.price}</span>
                {plan.period && <span className="pricing__period">{plan.period}</span>}
              </div>
              <p className="pricing__desc">{plan.description}</p>

              <ul className="pricing__features">
                {plan.features.map((f) => (
                  <li key={f} className="pricing__feature">
                    <span className="pricing__check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`pricing__btn pricing__btn--${plan.accent}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
