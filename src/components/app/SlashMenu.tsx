import React, { useEffect, useState, useRef } from 'react';
import { 
    Type, 
    Heading1, 
    List, 
    ListOrdered, 
    Sigma, 
    Code 
} from 'lucide-react';

export interface SlashMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    template: string;
}

const MENU_ITEMS: SlashMenuItem[] = [
    {
        id: 'equation',
        label: 'Equation',
        icon: <Sigma className="w-4 h-4" />,
        description: 'LaTeX math block',
        template: '$$\n\n$$'
    },
    {
        id: 'h1',
        label: 'Heading 1',
        icon: <Heading1 className="w-4 h-4" />,
        description: 'Large section heading',
        template: '# '
    },
    {
        id: 'bullet',
        label: 'Bullet List',
        icon: <List className="w-4 h-4" />,
        description: 'Simple bulleted list',
        template: '- '
    },
    {
        id: 'number',
        label: 'Numbered List',
        icon: <ListOrdered className="w-4 h-4" />,
        description: 'Sequential list',
        template: '1. '
    },
    {
        id: 'code',
        label: 'Code Block',
        icon: <Code className="w-4 h-4" />,
        description: 'Code snippet with syntax',
        template: '```\n\n```'
    },
    {
        id: 'text',
        label: 'Text',
        icon: <Type className="w-4 h-4" />,
        description: 'Plain text',
        template: ''
    }
];

interface SlashMenuProps {
    onSelect: (item: SlashMenuItem) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLDivElement | null>;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ onSelect, onClose, anchorRef }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % MENU_ITEMS.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(MENU_ITEMS[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, onSelect, onClose]);

    // Handle clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node) && 
                anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, anchorRef]);

    return (
        <div 
            ref={menuRef}
            className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
        >
            <div className="p-2 border-b border-border bg-muted/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Commands</span>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
                {MENU_ITEMS.map((item, index) => (
                    <button
                        key={item.id}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            index === selectedIndex ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                        onClick={() => onSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                            {item.icon}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-semibold truncate">{item.label}</div>
                            <div className={`text-[10px] truncate ${index === selectedIndex ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {item.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
