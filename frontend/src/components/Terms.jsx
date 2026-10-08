import React from "react";

const Terms = () => {
  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1>Terms of Service</h1>
          <p className="text-muted">Last updated: September 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By using Instagram DM Automation, you agree to these terms of
            service. If you do not agree, please do not use the application.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Instagram DM Automation allows you to set up keyword-based automated
            responses to comments on your Instagram posts. The service monitors
            your posts and sends direct messages or private replies when
            configured keywords are detected.
          </p>

          <h2>3. Your Responsibilities</h2>
          <ul>
            <li>
              You are responsible for the content of your automated messages
            </li>
            <li>
              You must comply with Instagram/Meta's Terms of Service and
              Community Guidelines
            </li>
            <li>
              You must not use the service for spam or unsolicited messaging
            </li>
            <li>
              You are responsible for maintaining the security of your account
            </li>
          </ul>

          <h2>4. Limitations</h2>
          <p>
            The service is provided "as is" without warranties of any kind. We
            are not responsible for any disruptions caused by changes to
            Instagram/Meta APIs or policies.
          </p>

          <h2>5. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your access to the
            service at any time, with or without cause.
          </p>

          <h2>6. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
