import { LabLineProps, SwitchStatus } from '../types/lab';
import { Workstation } from './Workstation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { wsService } from '../services/websocket';

export const LabLine = ({ lineNumber }: LabLineProps) => {
  const [activeStations, setActiveStations] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);

  // Add debug logging for state changes
  useEffect(() => {
    console.log(`[Line${lineNumber}] Active stations updated:`, Array.from(activeStations));
  }, [activeStations, lineNumber]);

  const handleMessage = useCallback((data: SwitchStatus) => {
    try {
      console.group(`[Line${lineNumber}] Processing message`);
      console.log('Received data:', data);

      // Check if we have a valid device_name
      if (!data.device_name) {
        console.log('No device_name in message');
        console.groupEnd();
        return;
      }

      // Parse the device name (e.g., "L15R7_B1")
      const deviceName = data.device_name.toLowerCase(); // Keep lowercase for consistency
      console.log('Device name:', deviceName);
      
      // Extract the line and room numbers, ignoring the _B1 suffix
      const match = deviceName.match(/l(\d+)r(\d+)(?:_b1)?/i);
      if (!match) {
        console.log('Invalid device name format');
        console.groupEnd();
        return;
      }

      const [, msgLineNumber, roomNumber] = match;
      console.log('Parsed line:', msgLineNumber, 'room:', roomNumber);
      
      // Check if this message is for this line
      if (parseInt(msgLineNumber) !== lineNumber) {
        console.log('Message is for different line');
        console.groupEnd();
        return;
      }

      // Get the status using the exact key from the message
      const status = data[deviceName]?.toLowerCase();
      const roomId = `L${msgLineNumber}R${roomNumber}`;
      console.log('Status:', status, 'for room:', roomId);

      if (!status) {
        console.log('No status found');
        console.groupEnd();
        return;
      }

      // Update active stations
      setActiveStations(prev => {
        const next = new Set(prev);
        if (status === 'on') {
          console.log('Adding room to active stations:', roomId);
          next.add(roomId);
        } else if (status === 'off') {
          console.log('Removing room from active stations:', roomId);
          next.delete(roomId);
        }
        console.log('New active stations:', Array.from(next));
        return next;
      });
      console.groupEnd();

    } catch (error) {
      console.error('Error processing message:', error);
      console.groupEnd();
    }
  }, [lineNumber]);

  useEffect(() => {
    console.log(`[Line${lineNumber}] Component mounted`);
    mountedRef.current = true;
    const unsubscribe = wsService.subscribe(handleMessage);

    return () => {
      mountedRef.current = false;
      unsubscribe();
      console.log(`[Line${lineNumber}] Component unmounted`);
    };
  }, [handleMessage]);

  const createWorkstations = useCallback((rowIndex: number) => {
    return Array.from({ length: 17 }, (_, index) => {
      const stationNumber = rowIndex === 0 
        ? index + 1  // First row: 1-17
        : 34 - index; // Second row: 34-18
      
      const roomId = `L${lineNumber}R${stationNumber}`;
      const isActive = activeStations.has(roomId);
      
      console.log(`[Line${lineNumber}] Rendering workstation ${roomId}, active: ${isActive}`);
      
      return (
        <Workstation 
          key={`station-${rowIndex}-${index}`}
          number={stationNumber}
          isBottom={rowIndex === 1}
          isActive={isActive}
          roomId={roomId}
        />
      );
    });
  }, [lineNumber, activeStations]);

  return (
    <div className="lab-container">
      <div className="lab-section">
        <div className="row-wrapper">
          <div className="row-label">{`Line${lineNumber}`}</div>
          <div className="row-container">
            {createWorkstations(0)}
          </div>
        </div>
        <div className="row-container">
          {createWorkstations(1)}
        </div>
      </div>
    </div>
  );
};