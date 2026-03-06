import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="nf-code">404</div>
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="nf-btn">← Back to Home</Link>
    </div>
  );
}
