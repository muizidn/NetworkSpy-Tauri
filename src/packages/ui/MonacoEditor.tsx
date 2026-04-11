import { Editor, EditorProps, OnMount } from "@monaco-editor/react";
import { Menu, PredefinedMenuItem, MenuItemOptions } from "@tauri-apps/api/menu";
import { useState, useCallback } from "react";

export const MonacoEditor = (props: EditorProps) => {
  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditor(editor);
    setMonaco(monaco);
    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  const handleContextMenu = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor || !monaco) return;

    const selection = editor.getSelection();
    const hasSelection = selection && !selection.isEmpty();
    const selectedText = hasSelection ? editor.getModel()?.getValueInRange(selection) : "";

    try {
      const isReadOnly = editor.getOption(monaco.editor.EditorOption.readOnly);

      const items = [
        {
          id: "cut",
          text: "Cut",
          enabled: hasSelection && !isReadOnly,
          action: async () => {
            if (selectedText) {
              await navigator.clipboard.writeText(selectedText);
              editor.executeEdits("clipboard", [
                {
                  range: selection,
                  text: "",
                  forceMoveMarkers: true,
                },
              ]);
            }
          },
        },
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
          id: "paste",
          text: "Paste",
          enabled: !isReadOnly,
          action: async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) {
                const selection = editor.getSelection();
                editor.executeEdits("clipboard", [
                  {
                    range: selection,
                    text: text,
                    forceMoveMarkers: true,
                  },
                ]);
              }
            } catch (err) {
              console.error("Paste failed", err);
            }
          },
        },
        {
          id: "format",
          text: "Format Document",
          enabled: !isReadOnly,
          action: () => {
            editor.getAction("editor.action.formatDocument")?.run();
          },
        },
        {
          item: "Separator",
        } as any,
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
