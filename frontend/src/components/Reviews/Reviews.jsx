import './Reviews.css';

const reviews = [
  {
    name: 'Aisha Rahman',
    role: 'Food Blogger',
    avatar: 'AR',
    rating: 5,
    text: 'EchoOrder completely changed how I order food. I just talk and my entire usual order is placed in under 10 seconds. The AI even remembers my preferences!',
    accent: 'cyan',
  },
  {
    name: 'Marco Silva',
    role: 'Software Engineer',
    avatar: 'MS',
    rating: 5,
    text: 'I was skeptical about voice ordering but this is genuinely impressive. It handled my complex order with multiple modifications perfectly on the first try.',
    accent: 'purple',
  },
  {
    name: 'Priya Nair',
    role: 'Busy Parent',
    avatar: 'PN',
    rating: 5,
    text: 'As a mom of three, I don\'t have time to scroll through menus. EchoOrder lets me order dinner while getting kids ready. It\'s a lifesaver.',
    accent: 'orange',
  },
  {
    name: 'James Okafor',
    role: 'Restaurant Owner',
    avatar: 'JO',
    rating: 5,
    text: 'We integrated EchoOrder on the restaurant side. Orders are more accurate, staff can focus on cooking, and customers love it. Revenue is up 30%.',
    accent: 'green',
  },
];

const Stars = ({ count }) => (
  <div className="reviews__stars">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="reviews__star">★</span>
    ))}
  </div>
);

const Reviews = () => {
  return (
    <section className="reviews" id="reviews">
      <div className="reviews__glow reviews__glow--left"></div>
      <div className="reviews__glow reviews__glow--right"></div>

      <div className="reviews__container">
        <div className="reviews__header">
          <span className="reviews__label">Testimonials</span>
          <h2 className="reviews__title">What Our Users Say</h2>
          <p className="reviews__subtitle">
            Thousands of happy customers order smarter every day with EchoOrder.
          </p>
        </div>

        <div className="reviews__grid">
          {reviews.map((r) => (
            <div key={r.name} className={`reviews__card reviews__card--${r.accent}`}>
              <Stars count={r.rating} />
              <p className="reviews__text">"{r.text}"</p>
              <div className="reviews__author">
                <div className={`reviews__avatar reviews__avatar--${r.accent}`}>
                  {r.avatar}
                </div>
                <div>
                  <span className="reviews__name">{r.name}</span>
                  <span className="reviews__role">{r.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
