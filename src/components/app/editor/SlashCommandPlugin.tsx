import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $createParagraphNode, 
  $getSelection, 
  $isRangeSelection,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { 
  $createHeadingNode, 
  $createQuoteNode,
  $isHeadingNode
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Type,
  Quote
} from "lucide-react";

interface CommandItem {
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const closeMenu = useCallback(() => {
    setQueryString(null);
    setSelectedIndex(0);
  }, []);

  const commands: CommandItem[] = [
    {
      label: "Text",
      icon: <Type className="w-4 h-4" />,
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        });
      },
    },
    {
      label: "Heading 1",
      icon: <Heading1 className="w-4 h-4" />,
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode("h1"));
          }
        });
      },
    },
    {
      label: "Heading 2",
      icon: <Heading2 className="w-4 h-4" />,
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode("h2"));
          }
        });
      },
    },
    {
      label: "Bullet List",
      icon: <List className="w-4 h-4" />,
      onSelect: () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      label: "Numbered List",
      icon: <ListOrdered className="w-4 h-4" />,
      onSelect: () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      },
    },
    {
        label: "Quote",
        icon: <Quote className="w-4 h-4" />,
        onSelect: () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          });
        },
    },
  ];

  const executeCommand = useCallback((cmd: CommandItem) => {
      cmd.onSelect();
      
      // After selection, we need to remove the "/" trigger.
      // We do this by modifying the selection to include the character before the current cursor.
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.modify("extend", true, "character");
          selection.removeText();
        }
      });
      
      closeMenu();
  }, [editor, closeMenu]);

  useEffect(() => {
    if (queryString === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(commands[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [queryString, selectedIndex, executeCommand, closeMenu, commands]);

  useEffect(() => {
    // Handle Enter key in headings to return to paragraph
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchor = selection.anchor;
          const node = anchor.getNode();
          const parent = node.getParentOrThrow();

          if ($isHeadingNode(parent)) {
            // If at the end of heading, insert paragraph below
            if (anchor.offset === node.getTextContentSize()) {
              event.preventDefault();
              editor.update(() => {
                const newParagraph = $createParagraphNode();
                parent.insertAfter(newParagraph);
                newParagraph.select();
              });
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchor = selection.anchor;
          const node = anchor.getNode();
          const textContent = node.getTextContent();
          const offset = anchor.offset;
          
          const lastChar = textContent[offset - 1];
          if (lastChar === '/' || lastChar === '\\') {
            setQueryString("");
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0).cloneRange();
              const rect = range.getBoundingClientRect();
              setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
              });
            }
          } else {
            setQueryString(null);
          }
        }
      });
    });
  }, [editor]);

  if (queryString === null) return null;

  return createPortal(
    <div
      className="fixed z-[100] w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        bottom: `calc(100vh - ${coords.top}px + 8px)`,
        left: coords.left,
      }}
    >
      <div className="p-2 border-b border-border bg-muted/30">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
          Basic Blocks
        </span>
      </div>
      <div className="p-1 max-h-64 overflow-y-auto">
        {commands.map((cmd, index) => (
          <button
            key={cmd.label}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
              index === selectedIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            onClick={() => executeCommand(cmd)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={`p-1.5 rounded-md transition-colors ${
              index === selectedIndex ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
            }`}>
              {cmd.icon}
            </div>
            <span className="text-sm font-medium">{cmd.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
