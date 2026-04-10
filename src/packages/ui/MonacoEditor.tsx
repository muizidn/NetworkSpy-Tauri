import { Editor, EditorProps, OnMount } from "@monaco-editor/react";
import { Menu } from "@tauri-apps/api/menu";
import { useState, useCallback } from "react";

export const MonacoEditor = (props: EditorProps) => {
  const [editor, setEditor] = useState<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditor(editor);
    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor) return;

    const selection = editor.getSelection();
    const hasSelection = selection && !selection.isEmpty();
    const selectedText = hasSelection ? editor.getModel()?.getValueInRange(selection) : "";

    try {
      const items = [
        {
          id: "copy",
          text: "Copy",
          enabled: hasSelection,
          action: async () => {
            if (selectedText) {
              await navigator.clipboard.writeText(selectedText);
            }
          },
        },
        {
          id: "select_all",
          text: "Select All",
          action: () => {
             editor.focus();
             editor.setSelection(editor.getModel().getFullModelRange());
          },
        },
        {
          id: "copy_all",
          text: "Copy All",
          action: async () => {
            const allText = editor.getValue();
            await navigator.clipboard.writeText(allText);
          },
        },
      ];

      // Add custom items if provided in the future, but for now just basic actions
      const menu = await Menu.new({ items });
      await menu.popup();
    } catch (err) {
      console.error("Failed to show context menu", err);
    }
  }, [editor]);

  const editorOptions = {
    ...props.options,
    contextmenu: false, // Force disable Monaco context menu to use native instead
  };

  return (
    <div className="h-full w-full relative" onContextMenu={handleContextMenu}>
      <Editor
        {...props}
        onMount={handleEditorDidMount}
        options={editorOptions}
      />
    </div>
  );
};
