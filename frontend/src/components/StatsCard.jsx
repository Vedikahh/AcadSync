import { useEffect, useState } from "react";
import "./StatsCard.css";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ icon, value, label, color = "blue", trend, onClick }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animate value counting effect
  useEffect(() => {
    // Determine the numeric portion of the value for counting
    const numericValue = typeof value === 'number' 
      ? value 
      : parseInt(value?.toString().replace(/[^0-9.-]+/g,"") || '0', 10);
      
    if (isNaN(numericValue) || numericValue === 0) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1s animation
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quart 
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(easeOutQuart * numericValue);
      
      // Attempt to preserve formatting for numbers temporarily
      // E.g. if original was "1,234", we show "1,234" but growing
      if (typeof value === 'string' && value.includes(',')) {
        setDisplayValue(current.toLocaleString());
      } else {
        setDisplayValue(current);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Set exact final value with its original formatting flawlessly
        setDisplayValue(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div
      className={`stats-card color-${color} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stats-content">
        <div className="stats-info">
          <span className="stats-label">{label}</span>
          <div className="stats-value">{displayValue}</div>
        </div>
        {icon && (
          <div className="stats-icon-wrapper">
            {icon}
          </div>
        )}
      </div>
      
      {trend !== undefined && (
        <div className={`stats-trend ${trend >= 0 ? "trend-up" : "trend-down"}`}>
          <div className="glow-badge">
            {trend >= 0 ? <TrendingUp size={14} strokeWidth={3} /> : <TrendingDown size={14} strokeWidth={3} />}
            <span>{Math.abs(trend)}%</span>
          </div>
          <span className="trend-text">vs last week</span>
        </div>
      )}
      
      {/* Decorative gradient orb for depth */}
      <div className="stats-glow-orb"></div>
    </div>
  );
}
