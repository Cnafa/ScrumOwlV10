// components/CalendarGrid.tsx
import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useLocale } from '../context/LocaleContext';

// --- Jalali-Gregorian conversion functions ---
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
    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return [gy, gm, gd];
}

const isLeapJalali = (jy: number) => (((((jy + 1595) % 33) * 8 + 5) % 33) < 8);
const JALALI_MONTH_LENGTHS = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

interface CalendarGridProps {
    events: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onSelectEvent }) => {
    const { locale, t } = useLocale();
    const [currentDate, setCurrentDate] = useState(new Date());

    const { year, month, daysInGrid, header, weekDays } = useMemo(() => {
        const [gYear, gMonth, gDay] = [currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()];
        const isJalali = locale === 'fa-IR';

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
                 const d = new Date(2023, 0, 7 + i); // 7th is a Saturday
                 return weekDayFormat.format(d);
            });
            
            return { year: jYear, month: jMonth, daysInGrid: days, header: formatter.format(currentDate), weekDays: shamsiWeekDays };
        } else { // Gregorian logic
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
                 const d = new Date(2023, 0, 1 + i); // 1st is a Sunday
                 return weekDayFormat.format(d);
            });

            return { year: gYear, month: gMonth, daysInGrid: days, header: formatter.format(currentDate), weekDays: gregorianWeekDays };
        }
    }, [currentDate, locale]);
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const dateKey = new Date(event.start).toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(event);
        });
        return map;
    }, [events]);

    const changeMonth = (delta: number) => {
        const isJalali = locale === 'fa-IR';
        if (isJalali) {
            const [jYear, jMonth] = toJalali(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
            let newJMonth = jMonth + delta;
            let newJYear = jYear;

            if (newJMonth > 12) {
                newJMonth = 1;
                newJYear += 1;
            } else if (newJMonth < 1) {
                newJMonth = 12;
                newJYear -= 1;
            }

            const [gy, gm, gd] = toGregorian(newJYear, newJMonth, 15);
            setCurrentDate(new Date(gy, gm - 1, gd));
        } else {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 15));
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <header className="flex items-center justify-between p-2 border-b">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeftIcon className="w-5 h-5 rtl:scale-x-[-1]"/></button>
                <h2 className="font-semibold">{header}</h2>
                <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-5 h-5 rtl:scale-x-[-1]"/></button>
            </header>

            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-600 border-b bg-gray-50">
                {weekDays.map(day => <div key={day} className="py-2 border-r last:border-r-0 rtl:border-r-0 rtl:last:border-r rtl:border-l">{day}</div>)}
            </div>
            
            <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l rtl:border-l-0 rtl:border-r">
                {daysInGrid.map((day, index) => {
                    if (!day) return <div key={`pad-${index}`} className="border-r border-b rtl:border-r-0 rtl:border-l bg-gray-50/70" />;

                    const isCurrentMonth = (locale === 'fa-IR' && toJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())[1] === month) || (locale !== 'fa-IR' && day.getMonth() === month);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const dayEvents = eventsByDate.get(day.toDateString()) || [];
                    const dayNumber = locale === 'fa-IR' ? toJalali(day.getFullYear(), day.getMonth() + 1, day.getDate())[2] : day.getDate();
                    
                    return (
                        <div key={index} className={`relative p-1 border-r border-b rtl:border-r-0 rtl:border-l ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/70'}`}>
                            <time
                                dateTime={day.toISOString()}
                                className={`text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full absolute top-1 right-1 rtl:right-auto rtl:left-1 ${isToday ? 'bg-primary text-white' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}
                            >
                                {dayNumber}
                            </time>
                            <div className="mt-8 space-y-1 overflow-y-auto h-full">
                                {dayEvents.slice(0, 3).map(event => (
                                    <button key={event.id} onClick={() => onSelectEvent(event)} className="w-full text-left text-xs p-1 bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200">
                                        {event.title}
                                        {event.hasConflict && <span className="text-red-500 font-bold ml-1">!</span>}
                                    </button>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-center text-gray-500 pt-1">{t('calendar_moreEvents').replace('{count}', (dayEvents.length - 3).toString())}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
