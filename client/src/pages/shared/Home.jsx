import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const HeroIllustration = () => (
  <svg
    viewBox="0 0 500 400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="img-fluid"
    style={{ maxWidth: '100%', height: 'auto' }}
  >
    {/* Decorative background glow */}
    <circle cx="250" cy="200" r="180" fill="url(#paint0_radial)" className="pulse-bg" />
    
    {/* Main dashboard container */}
    <rect x="70" y="80" width="360" height="240" rx="16" fill="white" stroke="#E2E8F0" strokeWidth="2" filter="drop-shadow(0px 10px 30px rgba(0, 0, 0, 0.05))" />
    
    {/* Dashboard header */}
    <rect x="70" y="80" width="360" height="48" rx="16" fill="#F8FAFC" />
    <circle cx="95" cy="104" r="6" fill="#EF4444" />
    <circle cx="115" cy="104" r="6" fill="#F59E0B" />
    <circle cx="135" cy="104" r="6" fill="#10B981" />
    
    {/* Dashboard window body mockup */}
    {/* Sidebar mockup */}
    <rect x="85" y="145" width="80" height="12" rx="4" fill="#E2E8F0" />
    <rect x="85" y="170" width="80" height="12" rx="4" fill="#E2E8F0" />
    <rect x="85" y="195" width="80" height="12" rx="4" fill="#E2E8F0" />
    
    {/* Chart mockup */}
    <rect x="190" y="140" width="220" height="110" rx="12" fill="#F1F5F9" />
    <path d="M210 210 L250 175 L290 195 L330 160 L370 185" stroke="#0D6EFD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="250" cy="175" r="5" fill="#6F42C1" />
    <circle cx="330" cy="160" r="5" fill="#6F42C1" />
    
    {/* Small floating widgets */}
    {/* Widget 1: Checklist */}
    <g className="float-svg-1">
      <rect x="40" y="210" width="120" height="80" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))" />
      <circle cx="60" cy="235" r="8" fill="#D1E7DD" />
      <path d="M57 235 L59 237 L63 233" stroke="#0F5132" strokeWidth="2" strokeLinecap="round" />
      <rect x="76" y="231" width="68" height="8" rx="4" fill="#E2E8F0" />
      
      <circle cx="60" cy="265" r="8" fill="#D1E7DD" />
      <path d="M57 265 L59 267 L63 263" stroke="#0F5132" strokeWidth="2" strokeLinecap="round" />
      <rect x="76" y="261" width="68" height="8" rx="4" fill="#E2E8F0" />
    </g>
 
    {/* Widget 2: Applicant Badge */}
    <g className="float-svg-2">
      <rect x="330" y="50" width="130" height="60" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))" />
      <circle cx="355" cy="80" r="14" fill="#CFE2FF" />
      <path d="M355 75 A 5 5 0 0 0 350 80 L 360 80 A 5 5 0 0 0 355 75 Z" fill="#0D6EFD" />
      <circle cx="355" cy="83" r="2.5" fill="#0D6EFD" />
      <text x="378" y="78" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Applied!</text>
      <text x="378" y="90" fill="#64748B" fontSize="9" fontFamily="sans-serif">Just now</text>
    </g>
 
    {/* Floating Success Star */}
    <g className="float-svg-1">
      <path d="M430 180 L433 188 L441 189 L435 195 L437 203 L430 198 L423 203 L425 195 L419 189 L427 188 Z" fill="#FFC107" />
    </g>
 
    <defs>
      <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(250 200) rotate(90) scale(180)">
        <stop stopColor="#0D6EFD" stopOpacity="0.15" />
        <stop offset="1" stopColor="#6F42C1" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);
 
/**
 * Public landing page.
 *
 * Introduces the platform. No data fetching occurs here — internship
 * browsing, registration, and role-specific dashboards are built by later
 * components.
 */
const Home = () => {
  const { user, isAuthenticated } = useAuth();
 
  let dashboardPath = '/register';
  let ctaText = 'Get Started';
  if (isAuthenticated) {
    ctaText = 'Go to Dashboard';
    if (user?.role === 'admin') dashboardPath = '/admin/dashboard';
    else if (user?.role === 'company') dashboardPath = '/company/dashboard';
    else if (user?.role === 'student') dashboardPath = '/student/dashboard';
  }
 
  const mockFeaturedInternships = [
    {
      id: 1,
      title: 'Frontend Developer Intern',
      company: 'NovaTech Solutions',
      location: 'Remote',
      type: 'Paid',
      duration: '6 Months',
      skills: ['React', 'Bootstrap', 'JavaScript'],
    },
    {
      id: 2,
      title: 'Product Design Intern',
      company: 'Quantum AI',
      location: 'Hybrid (San Francisco)',
      type: 'Paid',
      duration: '3 Months',
      skills: ['Figma', 'UI/UX', 'Prototyping'],
    },
    {
      id: 3,
      title: 'Data Analyst Intern',
      company: 'Apex Labs',
      location: 'Remote (US)',
      type: 'Paid',
      duration: '4 Months',
      skills: ['Python', 'SQL', 'Tableau'],
    },
  ];
 
  return (
    <div className="container py-4">
      {/* Hero Section */}
      <section className="row align-items-center mb-5 py-4 g-5">
        <div className="col-lg-6 text-start">
          <div className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 mb-3 fw-semibold">
            <span className="me-1">✨</span> Connecting Talent with Opportunity
          </div>
          <h1 className="display-5 fw-bold mb-3 text-dark lh-sm" style={{ fontWeight: 800 }}>
            Build Your Career. <br />
            Recruit Top Talent. <br />
            <span className="text-gradient">All in One Place.</span>
          </h1>
          <p className="lead text-muted mb-4">
            A comprehensive portal designed to seamlessly bridge the gap between students seeking real-world experience and forward-thinking companies looking for top-tier talent.
          </p>
          <div className="d-flex flex-wrap gap-3">
            <Link to={dashboardPath} className="btn btn-primary btn-lg px-4 py-2 fw-semibold shadow-sm hover-card">
              {ctaText}
            </Link>
            <Link to="/internships" className="btn btn-outline-secondary btn-lg px-4 py-2 fw-semibold hover-card">
              Browse Internships
            </Link>
          </div>
        </div>
        <div className="col-lg-6 text-center">
          <HeroIllustration />
        </div>
      </section>
 
      {/* Impact/Stats Row */}
      <section className="row text-center mb-5 g-4 py-3 bg-light-gradient rounded-4 border border-light">
        <div className="col-6 col-md-3">
          <div className="p-3">
            <div className="text-primary mb-2">
              <i className="bi bi-people-fill fs-2"></i>
            </div>
            <h3 className="fw-bold mb-0">5,000+</h3>
            <p className="text-muted small mb-0">Students Placed</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3">
            <div className="text-primary mb-2">
              <i className="bi bi-patch-check-fill fs-2"></i>
            </div>
            <h3 className="fw-bold mb-0">300+</h3>
            <p className="text-muted small mb-0">Verified Companies</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3">
            <div className="text-primary mb-2">
              <i className="bi bi-briefcase-fill fs-2"></i>
            </div>
            <h3 className="fw-bold mb-0">1,200+</h3>
            <p className="text-muted small mb-0">Active Internships</p>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3">
            <div className="text-primary mb-2">
              <i className="bi bi-graph-up-arrow fs-2"></i>
            </div>
            <h3 className="fw-bold mb-0">98%</h3>
            <p className="text-muted small mb-0">Selection Success</p>
          </div>
        </div>
      </section>
 
      {/* "Choose Your Journey" (Role Features Grid) */}
      <section className="mb-5 py-3">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-dark mb-2">Choose Your Journey</h2>
          <p className="text-muted col-md-8 mx-auto">
            Discover tailored tools and interactive dashboards designed specifically for each role in our ecosystem.
          </p>
        </div>
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card h-100 p-4 hover-card shadow-sm bg-white">
              <div className="icon-box icon-box-primary">
                <i className="bi bi-mortarboard"></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">For Students</h4>
              <p className="text-muted mb-0">
                Kickstart your career. Browse verified opportunities, apply with an optimized profile, save favorites, and manage your active application phases step-by-step.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card h-100 p-4 hover-card shadow-sm bg-white">
              <div className="icon-box icon-box-purple">
                <i className="bi bi-building"></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">For Companies</h4>
              <p className="text-muted mb-0">
                Hire exceptional talent. Design attractive internship postings, manage candidates through custom recruitment pipelines, verify applicants, and hire candidates.
              </p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card h-100 p-4 hover-card shadow-sm bg-white">
              <div className="icon-box icon-box-success">
                <i className="bi bi-shield-check"></i>
              </div>
              <h4 className="fw-bold mb-3 text-dark">For Administrators</h4>
              <p className="text-muted mb-0">
                Ensure safety and trust. Modulate user registrations, verify credentials for new companies, moderate internship postings, and view secure audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>
 
      {/* Featured Internships */}
      <section className="mb-4 py-3">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Featured Opportunities</h2>
            <p className="text-muted mb-0 d-none d-sm-block">Explore popular internship roles that have just been posted.</p>
          </div>
          <Link to="/internships" className="btn btn-link text-primary fw-semibold p-0 text-decoration-none">
            View All Internships <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
 
        <div className="row g-4">
          {mockFeaturedInternships.map((internship) => (
            <div key={internship.id} className="col-md-4">
              <div className="card h-100 p-4 hover-card shadow-sm bg-white">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark text-truncate" style={{ maxWidth: '200px' }}>
                      {internship.title}
                    </h5>
                    <p className="text-muted small mb-0">{internship.company}</p>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    {internship.type}
                  </span>
                </div>
                
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge bg-light text-dark border"><i className="bi bi-geo-alt me-1"></i>{internship.location}</span>
                  <span className="badge bg-light text-dark border"><i className="bi bi-clock me-1"></i>{internship.duration}</span>
                </div>
 
                <div className="mb-4">
                  {internship.skills.map((skill, index) => (
                    <span key={index} className="badge bg-secondary-subtle text-dark-emphasis me-1" style={{ fontSize: '0.75rem' }}>
                      {skill}
                    </span>
                  ))}
                </div>
 
                <Link to="/internships" className="btn btn-outline-primary btn-sm w-100 mt-auto hover-card fw-semibold">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
