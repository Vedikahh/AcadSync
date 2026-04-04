import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./LegalPages.css";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="legal-title">Terms of Use</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="legal-content">
          <p>
            Welcome to AcadSync. By accessing our platform, you agree to be bound by these Terms of Use and our Privacy Policy.
          </p>

          <h2>1. Use of the Platform</h2>
          <p>
            AcadSync provides an academic scheduling and event management system. You agree to use the platform only for lawful purposes related to academic and organizational planning.
          </p>

          <h2>2. User Accounts</h2>
          <p>
            To use certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h2>3. Data Accuracy</h2>
          <p>
            You agree to provide accurate, current, and complete information when scheduling events or modifying the academic timetable. AcadSync is not liable for clashes resulting from inaccurate data entry.
          </p>

          <h2>4. Role-Based Access</h2>
          <p>
            Your access level (Student, Organizer, Admin) defines your capabilities on the platform. Attempting to bypass these permissions is strictly prohibited.
          </p>

          <h2>5. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:acadsyncai@gmail.com">acadsyncai@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
