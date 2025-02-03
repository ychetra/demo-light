import { WorkstationProps } from '../types/lab';
import { useEffect, memo } from 'react';

export const Workstation = memo(({ number, isBottom = false, isActive = false, roomId }: WorkstationProps) => {
  useEffect(() => {
    console.log(`[Workstation ${roomId}] Rendered with active=${isActive}`);
  }, [roomId, isActive]);

  const backgroundColor = isActive ? '#dc2626' : '#3f3f3f';
  const borderColor = isActive ? '#ef4444' : '#4b5563';

  return (
    <div 
      className={`workstation ${isBottom ? 'workstation-bottom' : ''}`}
      title={`Workstation ${number} (${roomId}) - ${isActive ? 'ON' : 'OFF'}`}
      data-active={isActive}
      data-testid={`workstation-${roomId}`}
      style={{ 
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="monitor">
        <span className="station-number">{number}</span>
      </div>
      <div 
        className="desk"
        data-testid={`desk-${roomId}`}
        style={{
          backgroundColor,
          borderColor,
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 0 10px rgba(220, 38, 38, 0.5)' : 'none'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: isActive ? '#ef4444' : '#666',
        transition: 'color 0.3s ease'
      }}>
        {roomId}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.isActive === nextProps.isActive &&
         prevProps.isBottom === nextProps.isBottom &&
         prevProps.number === nextProps.number &&
         prevProps.roomId === nextProps.roomId;
});

Workstation.displayName = 'Workstation'; 