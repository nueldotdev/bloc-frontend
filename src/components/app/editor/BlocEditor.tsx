import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import SlashCommandPlugin from "./SlashCommandPlugin";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import { 
  TRANSFORMERS,
  $convertToMarkdownString
} from "@lexical/markdown";

const theme = {
  heading: {
    h1: "text-3xl font-bold mt-4 mb-2",
    h2: "text-2xl font-bold mt-3 mb-1",
    h3: "text-xl font-bold mt-2 mb-1",
  },
  list: {
    ul: "list-disc ml-6 mb-2",
    ol: "list-decimal ml-6 mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-primary/40 pl-4 italic my-2 text-muted-foreground",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    code: "bg-muted px-1 rounded font-mono text-[12px]",
  },
  code: "bg-muted p-4 rounded-lg font-mono text-sm block my-2 overflow-x-auto",
};

function OnChangePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange(markdown);
      });
    });
  }, [editor, onChange]);
  return null;
}

// Plugin to handle clear editor and initial value
function EditorControlPlugin({ clearSignal }: { clearSignal?: boolean }) {
    const [editor] = useLexicalComposerContext();
    
    useEffect(() => {
        if (clearSignal) {
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
        }
    }, [clearSignal, editor]);

    return null;
}

export default function BlocEditor({
  onChange,
  onFocus,
  onBlur,
  placeholder = "Type / for commands...",
  className = "",
  clearSignal = false
}: {
  value?: string;
  onChange: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  clearSignal?: boolean;
}) {
  const initialConfig = {
    namespace: "BlocEditor",
    theme,
    onError: (error: Error) => console.error(error),
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`relative ${className}`}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
                onFocus={onFocus}
                onBlur={onBlur}
                className="min-h-[44px] max-h-[150px] lg:max-h-[300px] outline-none text-sm py-2 px-1 overflow-y-auto" 
            />
          }
          placeholder={
            <div className="absolute top-2 left-1 text-muted-foreground pointer-events-none text-sm opacity-50">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandPlugin />
        <OnChangePlugin onChange={onChange} />
        <EditorControlPlugin clearSignal={clearSignal} />
      </div>
    </LexicalComposer>
  );
}
