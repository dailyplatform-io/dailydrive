import React from 'react';

interface TrialStatusBannerProps {
  daysLeft: number;
  onUpgradeClick: () => void;
  className?: string;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  daysLeft,
  onUpgradeClick,
  className = '',
}) => {
  const isUrgent = daysLeft <= 3;
  
  return (
    <div 
      className={`trial-status-banner ${isUrgent ? 'trial-status-banner--urgent' : ''} ${className}`}
      style={{
        marginBottom: '20px',
        padding: '16px 20px',
        background: isUrgent 
          ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
          : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        border: `1px solid ${isUrgent ? '#f87171' : '#ffc107'}`,
        borderRadius: '8px',
        color: isUrgent ? '#991b1b' : '#856404',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <strong>
          {isUrgent ? '⚠️ Trial Expiring Soon:' : '⏰ Free Trial Active:'}
        </strong>
        <span>
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          {isUrgent && ' - Don\'t lose access!'}
        </span>
      </div>
      
      <button
        onClick={onUpgradeClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: isUrgent ? '#dc2626' : '#ffc107',
          border: 'none',
          borderRadius: '6px',
          color: isUrgent ? '#fff' : '#000',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '14px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        {isUrgent ? 'Upgrade Now!' : 'Upgrade to Pro'}
      </button>
    </div>
  );
};

interface SubscriptionStatusProps {
  subscriptionTier?: string;
  paymentMethod?: string;
  className?: string;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscriptionTier,
  paymentMethod,
  className = '',
}) => {
  if (!subscriptionTier || !paymentMethod) return null;

  return (
    <div 
      className={`subscription-status ${className}`}
      style={{
        marginBottom: '20px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: '1px solid #10b981',
        borderRadius: '8px',
        color: '#065f46',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        backgroundColor: '#10b981' 
      }} />
      <strong>Active Subscription:</strong>
      <span>{subscriptionTier} Plan ({paymentMethod})</span>
    </div>
  );
};