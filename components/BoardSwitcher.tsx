import React, { useState, useRef, useEffect } from 'react';
import { useBoard } from '../context/BoardContext';

export const BoardSwitcher: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
    const { boards, activeBoard, setActiveBoard } = useBoard();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    if (!activeBoard) {
        return (
            <div className="text-sm text-gray-500">
                {isCollapsed ? '...' : 'No Board Selected'}
            </div>
        );
    }
    
    const handleSelectBoard = (boardId: string) => {
        setActiveBoard(boardId);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-200/80"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                 <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded bg-[#486966] text-white flex items-center justify-center text-xs font-bold">
                        {activeBoard.name.charAt(0)}
                    </span>
                    {!isCollapsed && (
                        <span className="font-semibold text-sm text-[#3B3936] truncate">{activeBoard.name}</span>
                    )}
                </div>
                 {!isCollapsed && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                 )}
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg border z-10">
                    <ul className="py-1">
                        {boards.map(board => (
                             <li key={board.id}>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSelectBoard(board.id);
                                    }}
                                    className={`block px-4 py-2 text-sm ${activeBoard.id === board.id ? 'font-bold text-[#486966]' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {board.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
