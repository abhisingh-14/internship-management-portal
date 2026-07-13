import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanyProfile, uploadCompanyLogo } from '../../services/companyService';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import ApprovalStatusBadge from '../../components/company/ApprovalStatusBadge';
import { resolveFileUrl } from '../../utils/fileUrl';


function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setLogoUploading(true);
    setLogoError(null);

    try {
      const data = await uploadCompanyLogo(formData);
      setProfile((prev) => ({ ...prev, logoUrl: data.logoUrl }));
    } catch (err) {
      console.error(err);
      setLogoError(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };


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
            <dd className="col-sm-9">
              <div className="d-flex flex-column align-items-start gap-2">
                {profile.logoUrl ? (
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={resolveFileUrl(profile.logoUrl)}
                      alt="Company Logo"
                      className="rounded bg-light p-1 border"
                      style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                    <label className="btn btn-sm btn-outline-secondary mb-0" htmlFor="logo-upload-input" style={{ cursor: 'pointer' }}>
                      {logoUploading ? 'Uploading...' : 'Replace Logo'}
                      <input
                        id="logo-upload-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="d-none"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: '80px', height: '80px', fontSize: '2rem' }}
                    >
                      {profile.companyName ? profile.companyName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <label className="btn btn-sm btn-outline-primary mb-0" htmlFor="logo-upload-input" style={{ cursor: 'pointer' }}>
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      <input
                        id="logo-upload-input"
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="d-none"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                  </div>
                )}
                {logoError && <div className="text-danger small mt-1">{logoError}</div>}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
