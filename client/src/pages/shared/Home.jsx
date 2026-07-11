/**
 * Public landing page.
 *
 * Introduces the platform. No data fetching occurs here — internship
 * browsing, registration, and role-specific dashboards are built by later
 * components (Frontend Role Dashboards, Internship Listing).
 */
const Home = () => (
  <div className="py-5 text-center">
    <h1 className="display-5 fw-bold">Internship Management Portal</h1>
    <p className="col-lg-8 mx-auto lead text-muted">
      Discover internship opportunities, manage applications, and connect
      students with companies — all in one place.
    </p>
  </div>
);

export default Home;
