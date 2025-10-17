import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hour, setHour] = React.useState("12");
  const [minute, setMinute] = React.useState("00");
  const [period, setPeriod] = React.useState("PM");

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [timeStr] = value.split(" ");
      const [h, m] = timeStr.split(":");
      const hour24 = parseInt(h);
      
      if (hour24 === 0) {
        setHour("12");
        setPeriod("AM");
      } else if (hour24 < 12) {
        setHour(hour24.toString());
        setPeriod("AM");
      } else if (hour24 === 12) {
        setHour("12");
        setPeriod("PM");
      } else {
        setHour((hour24 - 12).toString());
        setPeriod("PM");
      }
      
      setMinute(m || "00");
    }
  }, [value]);

  // Convert to 24-hour format for form submission
  const updateTimeValue = React.useCallback((newHour: string, newMinute: string, newPeriod: string) => {
    let hour24 = parseInt(newHour);
    
    if (newPeriod === "AM" && hour24 === 12) {
      hour24 = 0;
    } else if (newPeriod === "PM" && hour24 !== 12) {
      hour24 += 12;
    }
    
    const timeString = `${hour24.toString().padStart(2, "0")}:${newMinute}`;
    onChange?.(timeString);
  }, [onChange]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    updateTimeValue(newHour, minute, period);
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    updateTimeValue(hour, newMinute, period);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    updateTimeValue(hour, minute, newPeriod);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className={cn("flex space-x-2", className)}>
      <Select value={hour} onValueChange={handleHourChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutes.filter((_, i) => i % 5 === 0).map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}