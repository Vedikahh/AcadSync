import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./LegalPages.css";

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="legal-content">
          <p>
            Your privacy is critically important to us at AcadSync. This Privacy Policy outlines how we collect, use, and protect your data.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            When you register, we collect your name, email address, and role information. For authentication via Google, we collect the basic profile information permitted by your OAuth consent.
          </p>

          <h2>2. How We Use Your Data</h2>
          <p>
            We use your information exclusively to provide the AcadSync scheduling service, send relevant campus notifications, and verify access levels based on your assigned role.
          </p>

          <h2>3. Data Protection</h2>
          <p>
            AcadSync employs industry-standard security measures, including HTTPS, secure password hashing (Argon2/Bcrypt), and JWT-based session handling, to protect your personal data from unauthorized access.
          </p>

          <h2>4. Third-Party Sharing</h2>
          <p>
            We do not sell your personal data. We may share necessary information with our backend infrastructure providers (e.g., MongoDB Atlas, Google Cloud) solely for operational purposes.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            For any privacy-related concerns or data deletion requests, please contact our data protection officer at <a href="mailto:acadsyncai@gmail.com">acadsyncai@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
