'use client'

import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Toolbar from './toolbar'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Cross1Icon, UploadIcon } from '@radix-ui/react-icons'
import QRCode from 'qrcode'
import { useSession } from 'next-auth/react'

const page = () => {

    const [editorValue, setEditorValue] = useState("");
    const [isSaved, setSaved] = useState(false);
    const [showToolbar, setShowToolbar] = useState(true);

    const params = useParams();

    const { data: session } = useSession();


    const [qrCode, setQrCode] = useState<any>("");
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const editor = useEditor({
        extensions: [StarterKit, Underline, Highlight, Link.configure({
            openOnClick: true,
            autolink: true,
            defaultProtocol: 'https',
            protocols: ['http', 'https'],
        })],
        content: editorValue,
        editorProps: {
            attributes: {
                class:
                    `${showToolbar ? 'h-[70vh] rounded-b-xl max-sm:rounded-xl border-t-0 max-sm:border-t-2' : 'h-[80vh] rounded-xl'} max-sm:h-[90vh] bg-gray-900 list-item scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-300 overflow-y-auto border border-gray-600 w-full px-10 py-3 text-white text-[16px] outline-none`,
            },
        },
        onUpdate: (({ editor }) => {
            setEditorValue(editor.getHTML())
        })
    });

    const storeToUser = async (name: string, id: any) => {
        const userId = session?.user?.email?.split('@')[0].replace('.', '_').replace('/', '_');
        await fetch(`/api/store/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                name,
                id,
                type: 'notes'
            })
        })
    }


    useEffect(() => {
        const handleKeyDown = async (event: any) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                await fetch("/api/notes/", {
                    method: "POST",
                    headers: {
                        'Content-Type': "application/json"
                    },
                    body: JSON.stringify({
                        id: params?.id,
                        value: editorValue,
                    })
                });
                setSaved(true);
                storeToUser('Note', params?.id || "");
            } else if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
                editor?.commands.selectAll();
            }
        };
        const notesEditorDiv = document.getElementById('notes-editor');
        if (notesEditorDiv) {
            notesEditorDiv.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (notesEditorDiv) {
                notesEditorDiv.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [editorValue]);

    useEffect(() => {
        const getValue = async () => {
            await fetch(`/api/notes?id=${params?.id}`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async (res) => {
                const data = await res.json();
                if (data) {
                    setEditorValue(data.value);
                    editor?.commands.setContent(data.value);
                    if (data?.lock == true) {
                        editor?.setEditable(false);
                        setShowToolbar(false);
                    } else {
                        editor?.setEditable(true);
                        setShowToolbar(true);
                    }
                    setSaved(true);
                }
            })
        }

        const generateQr = async () => {
            const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_SERVER_URL}notes/${params?.id}`);
            setQrCode(qrCodeDataUrl);
        }

        if (editor) {
            getValue();
            generateQr();
        }
    }, [editor]);

    return (
        <div id='notes-editor' className='bg-gray-950 grid-box w-full h-full flex-col px-20 max-sm:px-1 overflow-hidden'>
            <div className='w-full pt-3'>
                <div className='w-full h-16 bg-black flex justify-between p-3 px-5 align-middle rounded-full'>
                    <a href='/' className='overflow-hidden rounded-full h-12 w-12 self-center'>
                        <img className='object-cover' src='/logo.png' />
                    </a>
                    <div className='flex gap-5'>
                        <motion.button
                            whileTap={{ scale: 0.90 }}
                            whileHover={{ scale: 1.1, color: "white", backgroundColor: "black", border: "1px solid white" }}
                            className='bg-white rounded-full text-black py-1 px-4 flex whitespace-nowrap self-center gap-2'
                            onClick={async () => {
                                await fetch("/api/notes/", {
                                    method: "POST",
                                    headers: {
                                        'Content-Type': "application/json"
                                    },
                                    body: JSON.stringify({
                                        id: params?.id,
                                        value: editorValue,
                                    })
                                });
                                setSaved(true);
                                storeToUser('Note', params?.id || "");
                            }}>
                            Save <UploadIcon className='self-center' />
                        </motion.button>
                        <motion.button onClick={() => {
                            if (!isSaved) {
                                alert("Please save the code first !")
                                return;
                            }
                            setModalIsOpen(true);
                        }} whileTap={{ scale: 0.90 }} className='bg-white px-3 rounded-full'>
                            <svg width="20" height="20" fill="black" className="bi bi-qr-code-scan" viewBox="0 0 16 16">
                                <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5M.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5M4 4h1v1H4z" />
                                <path d="M7 2H2v5h5zM3 3h3v3H3zm2 8H4v1h1z" />
                                <path d="M7 9H2v5h5zm-4 1h3v3H3zm8-6h1v1h-1z" />
                                <path d="M9 2h5v5H9zm1 1v3h3V3zM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8zm2 2H9V9h1zm4 2h-1v1h-2v1h3zm-4 2v-1H8v1z" />
                                <path d="M12 9h2V8h-2z" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {modalIsOpen && qrCode && (
                    <motion.div
                        initial={{ x: "100vh" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100vh" }}
                        transition={{ duration: 0.5 }}
                        className="flex absolute right-28 top-28 z-50 max-sm:top-24 max-sm:right-1 flex-col items-center justify-center border border-gray-300 gap-2 bg-gray-800 rounded-xl">
                        <div className='flex relative flex-col items-center justify-center gap-2 bg-gray-800 p-5 rounded-xl'>
                            <img className="rounded-md" src={qrCode} alt="QR Code" />
                            <p className='text-gray-300'>Scan the QR code to access this notepad.</p>
                            <Cross1Icon onClick={() => setModalIsOpen(false)} color='black' className='absolute top-2 right-2 h-6 w-6 p-1 rounded-full bg-neutral-200 cursor-pointer' />
                        </div>
                    </motion.div>

                )}
            </AnimatePresence>
            <div className='w-full h-[100vh] flex flex-col justify-start pt-5 max-sm:pt-1'>
                {showToolbar && <Toolbar editor={editor} />}
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

export default page
