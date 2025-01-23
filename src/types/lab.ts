export interface WorkstationProps {
  number: number;
  isBottom?: boolean;
  isActive?: boolean;
  roomId: string;
}

export interface LabLineProps {
  lineNumber: number;
}

export interface SwitchStatus {
  device_name: string;
  time: string;
  [key: string]: string;
} 