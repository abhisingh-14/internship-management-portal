import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanyDashboard } from '../../services/companyService';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import ApprovalStatusBadge from '../../components/company/ApprovalStatusBadge';
import ProfileCompletenessBar from '../../components/company/ProfileCompletenessBar';

const APPROVAL_MESSAGES = {
  pending: {
    type: 'warning',
    title: 'Approval pending',
    message: 'Your company account is awaiting admin approval. You will be able to post internships once approved.',
  },
  rejected: {
    type: 'danger',
    title: 'Registration rejected',
    message: 'Your company registration was rejected. Please contact support for more information.',
  },
};

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCompanyDashboard();
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Loader fullPage label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <AlertMessage
          type="danger"
          title="Unable to load dashboard"
          message={error.message || 'Something went wrong. Please try again.'}
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  const { profile, profileCompleteness, internshipStats } = dashboardData;
  const approvalNotice = APPROVAL_MESSAGES[profile.approvalStatus];

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="mb-1">{profile.companyName}</h2>
          <ApprovalStatusBadge status={profile.approvalStatus} />
        </div>
        <Link to="/company/profile" className="btn btn-outline-primary">
          View Profile
        </Link>
      </div>

      {approvalNotice && (
        <AlertMessage type={approvalNotice.type} title={approvalNotice.title} message={approvalNotice.message} />
      )}

      <div className="card mb-4">
        <div className="card-body">
          <ProfileCompletenessBar percentage={profileCompleteness} />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-sm-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Postings</h6>
              <p className="display-6 mb-0">{internshipStats.total}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Published</h6>
              <p className="display-6 mb-0">{internshipStats.published}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Draft</h6>
              <p className="display-6 mb-0">{internshipStats.draft}</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2">Closed</h6>
              <p className="display-6 mb-0">{internshipStats.closed}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
