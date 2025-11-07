// components/DateField.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';

// --- Helper Functions & Hooks ---

// Jalali-Gregorian conversion functions (based on a standard algorithm)
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy, jm, jd];
}

function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy += 1595;
    let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
        gy += 100 * Math.floor(--days / 36524);
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    // FIX: Changed `gd` to `let` as it is reassigned in the following loop.
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return [gy, gm, gd];
}

const isLeapJalali = (jy: number) => (((((jy + 1595) % 33) * 8 + 5) % 33) < 8);
const JALALI_MONTH_LENGTHS = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />
    </svg>
);

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// --- Sub-components ---

const TimeInput: React.FC<{ value: Date; onChange: (newDate: Date) => void }> = ({ value, onChange }) => {
    const handleTimeChange = (part: 'hours' | 'minutes', val: number) => {
        const newDate = new Date(value);
        if (part === 'hours') newDate.setHours(val);
        else newDate.setMinutes(val);
        onChange(newDate);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, part: 'hours' | 'minutes') => {
        let step = e.shiftKey ? 10 : 1;
        if (part === 'minutes') step = e.shiftKey ? 15 : 5;
        
        const current = part === 'hours' ? value.getHours() : value.getMinutes();
        let newValue = current;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            newValue = current + step;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            newValue = current - step;
        }

        if (part === 'hours') {
            newValue = (newValue + 24) % 24;
        } else {
            newValue = (newValue + 60) % 60;
        }

        handleTimeChange(part, newValue);
    };

    return (
        <div className="flex items-center gap-1 p-2 border-t">
            <input
                type="number"
                value={String(value.getHours()).padStart(2, '0')}
                onChange={(e) => handleTimeChange('hours', parseInt(e.target.value, 10) || 0)}
                onKeyDown={(e) => handleKeyDown(e, 'hours')}
                className="w-14 p-1 text-center bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-[#486966]"
            />
            <span>:</span>
            <input
                type="number"
                value={String(value.getMinutes()).padStart(2, '0')}
                onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value, 10) || 0)}
                onKeyDown={(e) => handleKeyDown(e, 'minutes')}
                step={5}
                className="w-14 p-1 text-center bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-[#486966]"
            />
        </div>
    );
};

const CalendarPopover: React.FC<{
    displayDate: Date;
    setDisplayDate: (date: Date) => void;
    onSelect: (date: Date) => void;
    selectedDate: Date | null;
    minDate?: Date;
    maxDate?: Date;
    showTime?: boolean;
}> = ({ displayDate, setDisplayDate, onSelect, selectedDate, minDate, maxDate, showTime }) => {
    const { locale } = useLocale();
    const isJalali = locale === 'fa-IR';

    const { year, month, daysInGrid, header, weekDays } = useMemo(() => {
        const [gYear, gMonth, gDay] = [displayDate.getFullYear(), displayDate.getMonth(), displayDate.getDate()];
        if (isJalali) {
            const [jYear, jMonth] = toJalali(gYear, gMonth + 1, gDay);
            const firstDayGregorian = new Date(...toGregorian(jYear, jMonth, 1));
            const firstDayOfWeek = firstDayGregorian.getDay(); // 0 (Sun) to 6 (Sat)
            const shamsiOffset = (firstDayOfWeek + 1) % 7;
            
            let monthLength = JALALI_MONTH_LENGTHS[jMonth];
            if (jMonth === 12 && isLeapJalali(jYear)) monthLength = 30;

            const days = Array(shamsiOffset).fill(null);
            for (let i = 1; i <= monthLength; i++) {
                const [gy, gm, gd] = toGregorian(jYear, jMonth, i);
                days.push(new Date(gy, gm - 1, gd));
            }
            
            const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' });
            
            const weekDayFormat = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' });
            const shamsiWeekDays = Array.from({ length: 7 }, (_, i) => {
                 // Saturday in Jalali is start of week
                 const d = new Date(2023, 0, 7 + i);
                 return weekDayFormat.format(d);
            });
            
            return { year: jYear, month: jMonth, daysInGrid: days, header: formatter.format(displayDate), weekDays: shamsiWeekDays };
        } else {
            const date = new Date(gYear, gMonth, 1);
            const days = [];
            const firstDayIndex = date.getDay();
            for (let i = 0; i < firstDayIndex; i++) days.push(null);
            while (date.getMonth() === gMonth) {
                days.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }
            const formatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
            const weekDayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short' });
            const gregorianWeekDays = Array.from({length: 7}, (_, i) => {
                 const d = new Date(2023, 0, 1 + i); // Starts Sunday
                 return weekDayFormat.format(d);
            });

            return { year: gYear, month: gMonth, daysInGrid: days, header: formatter.format(displayDate), weekDays: gregorianWeekDays };
        }
    }, [displayDate, isJalali, locale]);

    const changeMonth = (delta: number) => {
        if (isJalali) {
            const [jYear, jMonth] = toJalali(displayDate.getFullYear(), displayDate.getMonth() + 1, 1);
            const newJMonth = jMonth + delta;
            const [gy, gm, gd] = toGregorian(jYear, newJMonth, 1);
            setDisplayDate(new Date(gy, gm - 1, gd));
        } else {
            setDisplayDate(new Date(year, displayDate.getMonth() + delta, 1));
        }
    };
    
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    const handleSelectDate = (day: Date) => {
        const newDate = new Date(day);
        if (selectedDate) {
            newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        }
        onSelect(newDate);
    };

    return (
        <div className="absolute top-full mt-2 w-72 bg-white rounded-lg z-[90] shadow-[4px_4px_0px_#889C9B] border-2 border-[#3B3936]">
            <div className="flex justify-between items-center p-2">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
                <span className="font-semibold">{header}</span>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-500 pb-1">
                {weekDays.map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 p-1">
                {daysInGrid.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`}></div>;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);
                    const dayNumber = isJalali ? toJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())[2] : day.getDate();
                    return (
                        <button
                            key={day.toISOString()}
                            disabled={isDisabled}
                            onClick={() => handleSelectDate(day)}
                            className={`p-1 text-center rounded aspect-square hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed ${isSelected ? 'bg-[#486966] text-white' : 'text-gray-800'}`}
                        >
                            {dayNumber}
                        </button>
                    );
                })}
            </div>
            {showTime && selectedDate && <TimeInput value={selectedDate} onChange={onSelect} />}
        </div>
    );
};

// --- Main Components ---

interface DateFieldProps {
    value: string | Date | null;
    onChange: (date: string | null) => void;
    minDate?: Date;
    maxDate?: Date;
    showTime?: boolean;
    className?: string;
    disabled?: boolean;
}

export const DateField: React.FC<Omit<DateFieldProps, 'showTime'>> = (props) => (
    <BaseDatePicker {...props} showTime={false} />
);

export const DateTimeField: React.FC<Omit<DateFieldProps, 'showTime'>> = (props) => (
    <BaseDatePicker {...props} showTime={true} />
);

const BaseDatePicker: React.FC<DateFieldProps> = ({ value, onChange, minDate, maxDate, showTime = false, className, disabled = false }) => {
    const { locale } = useLocale();
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const [displayDate, setDisplayDate] = useState<Date>(value ? new Date(value) : new Date());
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClickOutside(wrapperRef, () => setIsOpen(false));

    useEffect(() => {
        setSelectedDate(value ? new Date(value) : null);
        setDisplayDate(value ? new Date(value) : new Date());
    }, [value]);

    const handleSelect = (date: Date) => {
        setSelectedDate(date);
        onChange(date.toISOString());
        if (!showTime) {
            setIsOpen(false);
        }
    };
    
    const displayFormat = useMemo(() => {
        const baseLocale = locale === 'fa-IR' ? 'fa-IR-u-ca-persian' : 'en-CA';
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const finalOptions = showTime ? { ...dateOptions, ...timeOptions } : dateOptions;
        return new Intl.DateTimeFormat(baseLocale, finalOptions);
    }, [locale, showTime]);

    const displayValue = selectedDate ? displayFormat.format(selectedDate) : '';
    
    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                 <input
                    type="text"
                    value={displayValue}
                    readOnly
                    onClick={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    placeholder={`Select a ${showTime ? 'date and time' : 'date'}`}
                    className="w-full px-3 py-2 h-10 bg-white border border-[#B2BEBF] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#486966] cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                 <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
            </div>

            {isOpen && !disabled && (
                <CalendarPopover
                    displayDate={displayDate}
                    setDisplayDate={setDisplayDate}
                    onSelect={handleSelect}
                    selectedDate={selectedDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    showTime={showTime}
                />
            )}
        </div>
    );
};