# Tasks

- [ ] Critical Backend Fixes
    - [ ] Fix compiler syntax error (double comma) in `server/models/internship.model.js`
    - [ ] Fix admin users query crash (removed sp.education / sp.skills) in `server/controllers/admin.controller.js`
    - [ ] Fix company profile mapping & update fallback crash in `server/controllers/company.controller.js`
    - [ ] Fix internship detail mapping & ownership assertion mismatch in `server/models/internship.model.js`
    - [ ] Fix application status validator in `server/validators/admin.validator.js`
- [ ] Student Profile Integration
    - [ ] Add profile management API calls to `client/src/services/studentService.js`
    - [ ] Create `Profile.jsx` page inside `client/src/pages/student/Profile.jsx`
    - [ ] Update route mappings in `client/src/routes/AppRoutes.jsx`
    - [ ] Add profile page to Sidebar items in `client/src/components/common/MainLayout.jsx`
    - [ ] Add profile navigation link to student `Dashboard.jsx`
- [ ] Verification
    - [ ] Check server compile & startup
    - [ ] Verify admin moderation queue & search
    - [ ] Verify company profile page & edits
    - [ ] Verify company internship posting edit/publish
    - [ ] Verify student profile, bio edit, resume upload, education CRUD, and skills CRUD
