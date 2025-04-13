"use client";

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
    onRangeChange({ 
      ...initialRange, 
      startDate: e.target.value ? new Date(e.target.value) : null 
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onRangeChange({ 
      ...initialRange, 
      endDate: e.target.value ? new Date(e.target.value) : null 
    });
  };

  // Format date for the input field
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="flex space-x-4 items-center">
      <label htmlFor="startDate" className="text-gray-700">Start Date:</label>
      <input 
        type="date" 
        id="startDate"
        value={formatDateForInput(initialRange.startDate)}
        onChange={handleStartDateChange} 
        className="p-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
      <label htmlFor="endDate" className="text-gray-700">End Date:</label>
      <input 
        type="date" 
        id="endDate"
        value={formatDateForInput(initialRange.endDate)}
        onChange={handleEndDateChange} 
        className="p-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

export default DateRangePicker; 