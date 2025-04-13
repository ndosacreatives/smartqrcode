// Placeholder for DateRangePicker component
import React from 'react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  initialRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ initialRange, onRangeChange }) => {
  // Basic implementation - you can replace this with a proper date range picker library
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRangeChange({ ...initialRange, startDate: e.target.value ? new Date(e.target.value) : null });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRangeChange({ ...initialRange, endDate: e.target.value ? new Date(e.target.value) : null });
  };

  return (
    <div className="flex space-x-4 items-center">
      <label htmlFor="startDate">Start Date:</label>
      <input 
        type="date" 
        id="startDate"
        value={initialRange.startDate?.toISOString().split('T')[0] || ''}
        onChange={handleStartDateChange} 
        className="p-2 border rounded"
      />
      <label htmlFor="endDate">End Date:</label>
      <input 
        type="date" 
        id="endDate"
        value={initialRange.endDate?.toISOString().split('T')[0] || ''}
        onChange={handleEndDateChange} 
        className="p-2 border rounded"
      />
    </div>
  );
};

export default DateRangePicker; 