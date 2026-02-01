import '../owner/OwnerDashboard.css';

export const DashboardAuctions: React.FC = () => {
  return (
    <section className="dashboard-section">
      <header className="dashboard-section__header">
        <div>
          <p className="dashboard-section__kicker">Auctions</p>
          <h3 className="dashboard-section__title">Auction cars</h3>
          <p className="dashboard-section__subtitle">
            Manage auction listings. Posting flow will be available soon.
          </p>
        </div>
      </header>
      <div className="dashboard-section__empty">
        <p>Owner auction tools are coming soon.</p>
      </div>
    </section>
  );
};
