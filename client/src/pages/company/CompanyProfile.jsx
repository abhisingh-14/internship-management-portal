import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanyProfile } from '../../services/companyService';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import ApprovalStatusBadge from '../../components/company/ApprovalStatusBadge';

function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCompanyProfile();
        if (isMounted) {
          setProfile(data);
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Loader fullPage label="Loading profile..." />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <AlertMessage
          type="danger"
          title="Unable to load profile"
          message={error.message || 'Something went wrong. Please try again.'}
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h2 className="mb-1">{profile.companyName}</h2>
          <ApprovalStatusBadge status={profile.approvalStatus} />
        </div>
        <Link to="/company/profile/edit" className="btn btn-primary">
          Edit Profile
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Description</dt>
            <dd className="col-sm-9">
              {profile.description || <span className="text-muted">Not provided</span>}
            </dd>

            <dt className="col-sm-3">Website</dt>
            <dd className="col-sm-9">
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                  {profile.website}
                </a>
              ) : (
                <span className="text-muted">Not provided</span>
              )}
            </dd>

            <dt className="col-sm-3">Industry</dt>
            <dd className="col-sm-9">
              {profile.industry || <span className="text-muted">Not provided</span>}
            </dd>

            <dt className="col-sm-3">Logo</dt>
            <dd className="col-sm-9 text-muted">Logo upload is coming soon.</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
