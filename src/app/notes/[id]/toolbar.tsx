"use client";

import React, { ReactElement } from "react";
import { type Editor } from "@tiptap/react";
import { ActivityLogIcon, ArrowLeftIcon, ArrowRightIcon, CodeIcon, FontBoldIcon, FontItalicIcon, LightningBoltIcon, Link1Icon, ListBulletIcon, QuoteIcon, StrikethroughIcon, UnderlineIcon } from "@radix-ui/react-icons";

type Props = {
  editor: Editor | null;
};

const Toolbar = ({ editor }: Props) => {
  if (!editor) {
    return null;
  }
  return (
    <div
      className="px-4 py-3 bg-black rounded-t-xl flex justify-center items-center
    gap-5 w-full h-[10vh] max-sm:hidden border border-gray-600 border-b-0">
      <div className="flex justify-start items-center gap-5 max-sm:flex-wrap">
        <IconButton runState={() => editor.chain().focus().toggleBold()} isActive={editor.isActive("bold")} Icon={FontBoldIcon} />
        <IconButton runState={() => editor.chain().focus().toggleItalic()} isActive={editor.isActive("italic")} Icon={FontItalicIcon} />
        <IconButton runState={() => editor.chain().focus().toggleUnderline()} isActive={editor.isActive("underline")} Icon={UnderlineIcon} />
        <IconButton runState={() => editor.chain().focus().toggleStrike()} isActive={editor.isActive("strike")} Icon={StrikethroughIcon} />
        <IconButton runState={() => editor.chain().focus().toggleBulletList()} isActive={editor.isActive("bulletList")} Icon={ListBulletIcon} />
        <IconButton runState={() => editor.chain().focus().toggleOrderedList()} isActive={editor.isActive("orderedList")} Icon={ActivityLogIcon} />
        <IconButton runState={() => editor.chain().focus().toggleCodeBlock()} isActive={editor.isActive("codeBlock")} Icon={CodeIcon} />
        <IconButton runState={() => editor.chain().focus().toggleHighlight()} isActive={editor.isActive("highlight")} Icon={LightningBoltIcon} />
        <IconButton runState={() => editor.chain().focus().extendMarkRange('link').toggleLink({href:editor.state.doc.textBetween(editor.view.state.selection.from,editor.view.state.selection.to)})} isActive={editor.isActive("link")} Icon={Link1Icon} />
        <IconButton runState={() => editor.chain().focus().undo()} isActive={editor.isActive("undo")} Icon={ArrowLeftIcon} />
        <IconButton runState={() => editor.chain().focus().redo()} isActive={editor.isActive("redo")} Icon={ArrowRightIcon} />
      </div>
    </div>
  );
};



const IconButton = ({ runState, isActive, Icon }: { runState: any, isActive: boolean, Icon: React.ElementType }) => {
  return <button
    onClick={(e) => {
      e.preventDefault();
      runState().run();
    }}
    className={`p-2 hover:opacity-80 ${isActive ? "bg-gray-700 text-white rounded-lg" : "text-gray-400"}`}
  >
    <Icon className="w-5 h-5" />
  </button>
}

export default Toolbar;