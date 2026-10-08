import React from "react";

const Privacy = () => {
  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1>Privacy Policy</h1>
          <p className="text-muted">Last updated: September 2026</p>

          <h2>1. Information We Collect</h2>
          <p>
            When you connect your Instagram account through our application, we
            collect the following information:
          </p>
          <ul>
            <li>Your Instagram username and profile information</li>
            <li>
              An access token to interact with Instagram on your behalf
            </li>
            <li>Comments on your Instagram media posts</li>
            <li>Keywords and automated response messages you configure</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information solely to:</p>
          <ul>
            <li>
              Monitor comments on your posts for keyword matches
            </li>
            <li>
              Send automated direct messages or private replies on your behalf
            </li>
            <li>Display analytics about your automation activity</li>
          </ul>

          <h2>3. Data Storage</h2>
          <p>
            Your data is stored securely in our database. Access tokens are
            encrypted and we follow industry best practices for data security.
          </p>

          <h2>4. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal
            information to third parties. We only interact with Meta/Instagram
            APIs on your behalf.
          </p>

          <h2>5. Data Deletion</h2>
          <p>
            You can request deletion of your data at any time by disconnecting
            your Instagram account from our application. Upon disconnection, all
            stored data associated with your account will be deleted.
          </p>

          <h2>6. Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us
            through the application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
