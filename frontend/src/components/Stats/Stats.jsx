import './Stats.css';

const Stats = () => {
  return (
    <div className="stats" id="stats">
      <div className="stats__card stats__card--orange">
        <span className="stats__value">5.4</span>
        <span className="stats__label">Years<br />Experience</span>
      </div>

      <div className="stats__card stats__card--green">
        <span className="stats__value">3.5k</span>
        <span className="stats__label">All Time<br />User</span>
      </div>

      <div className="stats__more" id="see-more-service">
        <span className="stats__more-icon">↓</span>
        <span>See More Service</span>
      </div>
    </div>
  );
};

export default Stats;
