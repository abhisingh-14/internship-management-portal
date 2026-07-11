/**
 * Static application footer.
 *
 * Presentational only. Deliberately contains no links to pages that do not
 * yet exist (e.g. Terms of Service, Privacy Policy) to avoid dead links;
 * such links can be added once the corresponding pages are built.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <div className="container-fluid text-center small">
        <span>&copy; {currentYear} Internship Management Portal. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
