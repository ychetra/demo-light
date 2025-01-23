import { WorkstationProps } from '../types/lab';
import { useEffect, memo } from 'react';

export const Workstation = memo(({ number, isBottom = false, isActive = false, roomId }: WorkstationProps) => {
  useEffect(() => {
    console.log(`[Workstation ${roomId}] Rendered with active=${isActive}`);
  }, [roomId, isActive]);

  return (
    <div 
      className={`workstation ${isBottom ? 'workstation-bottom' : ''}`}
      title={`Workstation ${number} (${roomId})`}
      data-active={isActive}
      data-testid={`workstation-${roomId}`}
      style={{ position: 'relative' }}
    >
      <div className="monitor">
        <span className="station-number">{number}</span>
      </div>
      <div 
        className={`desk ${isActive ? 'desk-active' : ''}`}
        data-testid={`desk-${roomId}`}
        style={{
          backgroundColor: isActive ? '#dc2626' : '#3f3f3f',
          borderColor: isActive ? '#ef4444' : '#4b5563',
          transition: 'all 0.3s ease'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '10px',
        color: isActive ? '#ef4444' : '#666'
      }}>
        {roomId}
      </div>
    </div>
  );
});

Workstation.displayName = 'Workstation'; 