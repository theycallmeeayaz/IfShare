'use client';

import React, { useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import { supportedLanguages, supportedThemes } from "./config.js"
import { loader } from '@monaco-editor/react';
import { useParams } from 'next/navigation.js';
import { Cross1Icon, UploadIcon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode';
import { useSession } from 'next-auth/react';

const page = () => {
  const [selectedLanguage, setLanguage] = useState('');
  const [selectedTheme, setTheme] = useState('vs-dark');
  const [searchLanguage, setSearchedLanguage] = useState("");
  const [editorText, setEditorText] = useState("");
  const [readOnly, setReadonly] = useState(false);

  const [isSaved, setSaved] = useState(false);

  const [qrCode, setQrCode] = useState<any>("");
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const ulRef = useRef<HTMLUListElement | null>(null);

  const params = useParams();

  const { data: session } = useSession();

  const handleSearch = (e: any) => {
    setSearchedLanguage(e.target.value);
    supportedLanguages.forEach((ele) => {
      if (ele.name.includes(searchLanguage)) {
        const element = ulRef.current?.querySelector(`#${ele.name}-language`)!;
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    })
  }

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
        type: 'codes'
      })
    })
  }

  useEffect(() => {
    setSearchedLanguage(selectedLanguage)
  }, [selectedLanguage]);

  useEffect(() => {
    const handleKeyDown = async (event: any) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        await fetch("/api/code/", {
          method: "POST",
          headers: {
            'Content-Type': "application/json"
          },
          body: JSON.stringify({
            id: params?.id,
            value: editorText,
            language: selectedLanguage,
            theme: selectedTheme
          })
        });
        setSaved(true);
        storeToUser('Code', params?.id || "");
      }
    };
    const codeEditorDiv = document.getElementById('code-editor');
    if (codeEditorDiv) {
      codeEditorDiv.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (codeEditorDiv) {
        codeEditorDiv.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [editorText, selectedLanguage, selectedTheme]);

  useEffect(() => {
    const getValue = async () => {
      await fetch(`/api/code?id=${params?.id}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(async (res) => {
        const data = await res.json();
        if (data) {
          setEditorText(data.value);
          if (data?.language) {
            setLanguage(data.language);
          }
          if (data?.theme) {
            if (data.theme == 'vs-dark' || data.theme == 'light') {
              setTheme(data.theme);
            } else {
              defineTheme(data.theme).then(_ => setTheme(data.theme))
            }
          }

          if (data?.lock == true) {
            setReadonly(true);
          }
          setSaved(true);
        }
      });
    }

    const generateQr = async () => {
      const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_SERVER_URL}code/${params?.id}`);
      setQrCode(qrCodeDataUrl);
    }
    getValue();
    generateQr();
  }, []);

  return (
    <div id='code-editor' className='px-14 grid-box max-sm:px-2 bg-gray-950 h-full w-full relative overflow-hidden'>
      <div className='w-full pt-3'>
        <div className='w-full h-16 bg-black flex justify-between p-3 px-5 align-middle rounded-full pr-10 max-sm:pr-5'>
          <a href='/' className='overflow-hidden rounded-full h-12 w-12 self-center'>
            <img className='object-cover' src='/logo.png' />
          </a>
          <div className='flex gap-5'>
            <motion.button
              whileTap={{ scale: 0.90 }}
              whileHover={{ scale: 1.1, color: "white", backgroundColor: "black", border: "1px solid white" }}
              className='bg-white rounded-full text-black py-1 px-4 flex whitespace-nowrap self-center gap-2'
              onClick={async () => {
                await fetch("/api/code/", {
                  method: "POST",
                  headers: {
                    'Content-Type': "application/json"
                  },
                  body: JSON.stringify({
                    id: params?.id,
                    value: editorText,
                    language: selectedLanguage,
                    theme: selectedTheme
                  })
                });
                setSaved(true);
                storeToUser('Code', params?.id || "");

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
      <div className='flex justify-between w-full h-full gap-3 pt-3'>
        <Editor
          height="85vh"
          theme={selectedTheme}
          language={selectedLanguage}
          onChange={(value: any, e) => setEditorText(value)}
          value={editorText}
          options={{ readOnly }}
          className='rounded-xl overflow-hidden'
        />
        <AnimatePresence>
          {modalIsOpen && qrCode && (
            <motion.div
              initial={{ x: "100vh" }}
              animate={{ x: 0 }}
              exit={{ x: "100vh" }}
              transition={{ duration: 0.5 }}
              className="flex absolute right-5 flex-col items-center justify-center gap-2 bg-gray-800 rounded-xl">
              <div className='flex relative flex-col items-center justify-center gap-2 bg-gray-800 p-5 rounded-xl'>
                <img className="rounded-md" src={qrCode} alt="QR Code" />
                <p className='text-gray-300'>Scan the QR code to access this code snippet.</p>
                <Cross1Icon onClick={() => setModalIsOpen(false)} color='black' className='absolute top-2 right-2 h-6 w-6 p-1 rounded-full bg-neutral-200 cursor-pointer' />
              </div>
            </motion.div>

          )}
        </AnimatePresence>
        {!readOnly && <div className='bg-black rounded-xl text-white w-1/4 h-[85vh] bottom-5 right-0 max-sm:hidden'>
          <div className='w-full max-h-1/2 p-5'>
            <div className='w-full flex gap-2 justify-around align-middle'>
              <p className='w-full text-[#67e8f9] pb-2 self-center'>Languages</p>
              <input
                type="text"
                placeholder="Search language ..."
                className='text-neutral-300 text-sm rounded-full self-center bg-gray-700 lowercase'
                value={searchLanguage}
                onChange={handleSearch}
                style={{ marginBottom: "10px", padding: "5px", paddingLeft: "15px" }}
              />
            </div>
            <ul ref={ulRef} className='w-full h-60 p-5 list-none overflow-y-scroll scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-stone-500 scrollbar-corner-neutral-500'>
              {supportedLanguages.map((ele) => {
                return <li id={ele.name + "-language"} key={ele.name + "-language"} className={`${selectedLanguage == ele.name ? "bg-gray-700" : ""} w-full p-2 text-white border-b border-gray-600 cursor-pointer hover:bg-gray-900`}
                  onClick={() => setLanguage(ele.name)}>
                  {ele.name}
                </li>
              })}
            </ul>
          </div>
          <div className='w-full max-h-1/2 p-5'>
            <p className='w-full text-[#67e8f9] pb-2'>Themes</p>
            <ul className='w-full h-60 p-5 overflow-y-scroll list-none  scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-stone-500 scrollbar-corner-neutral-500'>
              {supportedThemes.map((ele, index) => {
                return <li key={ele.id + "-theme"} className={`${selectedTheme == ele.id || selectedTheme == ele.name ? "bg-gray-700" : ""} w-full p-2 text-white border-b border-gray-600 cursor-pointer hover:bg-gray-900`}
                  onClick={() => {
                    if (index == 0 || index == 1) {
                      setTheme(ele.id);
                      return;
                    }
                    defineTheme(ele.name).then(_ => setTheme(ele.name))
                  }
                  }>
                  {ele.name}
                </li>
              })}
            </ul>
          </div>
        </div>}
      </div>
    </div>
  )
}


const defineTheme = (theme: any) => {
  return new Promise(res => {
    Promise.all(
      [
        loader.init(),
        import(`monaco-themes/themes/${theme}.json`),
      ]
    ).then(
      ([monaco, themeData]) => {
        monaco.editor.defineTheme(theme, themeData);
        res(this);
      }
    );
  });
};

export default page
