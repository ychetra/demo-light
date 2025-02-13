import { useState, useEffect } from 'react';
import '../styles/report.css';
import { Header } from '../components/Header';

interface DailyReport {
  date: string;
  count: number;
}

export const ReportPage = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching reports...');
      const response = await fetch('/api/reports/daily');
      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);

      // First check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (e) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        throw new Error('Server returned invalid data format');
      }

      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };  

  if (loading) {
    return (
      <div className="page">
        <div className="loading">
          Loading reports... Please wait.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">
          Error: {error}
          <button 
            onClick={fetchReports}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="page">
        <div className="no-data">
          No report data available.
          <button 
            onClick={fetchReports}
            className="retry-button"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Create a map of dates to counts for easy lookup
  const reportMap = new Map(reports.map(r => [r.date.split('T')[0], r.count]));
  
  // Get current date and calculate the start of the current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Create calendar days array
  const calendarDays = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    calendarDays.push({
      date: new Date(d),
      count: reportMap.get(dateStr) || 0
    });
  }

  return (
    <div className="page">
      <Header />
      <div className="report-page">
        <h2 className="report-title">Monthly Activity Report</h2>
        <div className="report-container">
          <div className="calendar">
            <div className="calendar-header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {/* Add empty cells for days before the first of the month */}
              {Array(firstDay.getDay()).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty" />
              ))}
              {/* Add the actual days */}
              {calendarDays.map(({ date, count }) => (
                <div 
                  key={date.toISOString()} 
                  className={`calendar-day ${count > 0 ? 'has-activity' : ''}`}
                >
                  <span className="date">{date.getDate()}</span>
                  {count > 0 && <span className="count">{count}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 