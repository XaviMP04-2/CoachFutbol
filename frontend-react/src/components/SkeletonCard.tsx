import React from 'react';
import './SkeletonCard.css';

const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-img shimmer" />
    <div className="skeleton-body">
      <div className="skeleton-line skeleton-title shimmer" />
      <div className="skeleton-line skeleton-sub shimmer" />
      <div className="skeleton-badges">
        <div className="skeleton-badge shimmer" />
        <div className="skeleton-badge shimmer" />
      </div>
    </div>
  </div>
);

export default SkeletonCard;
