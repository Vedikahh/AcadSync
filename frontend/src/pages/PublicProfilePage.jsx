import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicUserProfile } from "../services/api";
import "./PublicProfilePage.css";

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError("");
        const data = await getPublicUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setError(err.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-card">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-page">
        <div className="public-profile-card">
          <h2>Profile unavailable</h2>
          <p>{error || "This user profile could not be found."}</p>
          <Link to="/events" className="public-profile-back-link">Back</Link>
        </div>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "U";

  return (
    <div className="public-profile-page">
      <div className="public-profile-card">
        <div className="public-profile-header">
          <div className="public-profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1>{profile.name}</h1>
            <p>{profile.role} • {profile.department || "Department not set"}</p>
            <p>{profile.year || "Year not set"}</p>
          </div>
        </div>

        <section className="public-profile-section">
          <h3>Bio</h3>
          <p>{profile.bio || "No bio added yet."}</p>
        </section>

        <section className="public-profile-section">
          <h3>Interests</h3>
          {Array.isArray(profile.interests) && profile.interests.length > 0 ? (
            <div className="public-profile-tags">
              {profile.interests.map((interest) => (
                <span key={interest} className="public-profile-tag">{interest}</span>
              ))}
            </div>
          ) : (
            <p>No interests listed yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
