import React from 'react';
import {
  MessageSquare,
  FileText,
  List,
  Captions,
  History,
} from 'lucide-react';

interface MobileNavProps {
  activePanel: string | null;
  setActivePanel: (panel: any) => void;
  isSaved: boolean;
  onToggleLibrary: () => void;
  onNavigate: (path: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({
  activePanel,
  setActivePanel,
  isSaved,
  onToggleLibrary,
  onNavigate
}) => {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'topics', icon: List, label: 'Topics' },
    { id: 'transcript', icon: Captions, label: 'Transcript' },
    { id: 'queue', icon: History, label: 'Queue' },
  ];

  return (
    <div className="flex overflow-x-auto bg-card border-b border-border py-3 px-4 no-scrollbar gap-6 justify-center shrink-0">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePanel(item.id)}
          className={`flex flex-col items-center gap-1 min-w-[60px] transition-all relative ${
            activePanel === item.id ? 'text-primary scale-105' : 'text-muted-foreground'
          }`}
        >
          <div className={`p-2 rounded-xl transition-colors ${activePanel === item.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
            <item.icon size={20} />
          </div>
          <span className={`text-[10px] font-bold transition-opacity ${activePanel === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
          {activePanel === item.id && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default MobileNav;
