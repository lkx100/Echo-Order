import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="hero">
      {/* Background glow blobs */}
      <div className="hero__glow hero__glow--yellow"></div>
      <div className="hero__glow hero__glow--purple"></div>

      {/* Floating food decorations */}
      <span className="hero__deco hero__deco--fries">🍟</span>
      <span className="hero__deco hero__deco--pizza">🍕</span>
      <span className="hero__deco hero__deco--burger">🍔</span>
      <span className="hero__deco hero__deco--donut">🍩</span>

      {/* Left side content */}
      <div className="hero__content">
        <h1 className="hero__title">
          <span className="hero__highlight">
            <span className="corner corner--tl"></span>
            <span className="corner corner--tr"></span>
            <span className="corner corner--bl"></span>
            <span className="corner corner--br"></span>
            EchoOrder
          </span>
          <br />
          Voice-Powered
          <br />
          Instant Ordering<span className="hero__emojis">🎤⚡</span>
        </h1>

        <div className="hero__cta">
          <input
            type="text"
            className="hero__input"
            placeholder="enter your location"
            id="location-input"
          />
          <button className="hero__btn" id="order-now-btn">
            Order Now
          </button>
        </div>
      </div>

      {/* Right side - 3D Delivery Illustration */}
      <div className="hero__image-wrapper">
        <img
          src="/delivery-boy.png"
          alt="3D delivery person riding a bicycle with food delivery backpack"
          className="hero__image"
        />
      </div>
    </section>
  );
};

export default Hero;
