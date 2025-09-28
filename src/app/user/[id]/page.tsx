'use client'

import React, { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { IconDownload, IconEdit, IconLock, IconLockOpen2, IconShare, IconShare2, IconTrash } from '@tabler/icons-react'
import { Cross1Icon } from '@radix-ui/react-icons'
import QRCode from 'qrcode'
import { toast, Flip } from 'react-toastify'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import supabase from '@/@/lib/client'



const page = () => {

  const { data: session, status } = useSession();
  const [userID, setUserID] = useState('');

  const [selectedTab, setSelectedTab] = useState(localStorage.getItem('tab') || 'f');

  const [codes, setCodes] = useState<{ name: string, id: string }[]>([]);
  const [notes, setNotes] = useState<{ name: string, id: string }[]>([]);
  const [files, setFiles] = useState<{ name: string, id: string }[]>([]);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [qrcode, setQrCode] = useState('');
  const [fileLink, setFileLink] = useState('');

  const [lockChanges, setLockChanges] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userID != '') {
      if ('/user/' + userID != window.location.pathname) {
        window.location.href = '/';
      }
    }

    const fetchData = async () => {
      const resp = await fetch(`/api/store?userId=${userID}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      await resp.json().then(({ files, notes, codes }) => {
        setFiles(files);
        setCodes(codes);
        setNotes(notes);

        setLoading(false);
      });
    }
    if (userID != '') {
      fetchData();
    }
  }, [userID, lockChanges])

  useEffect(() => {
    if (status == 'loading') {
      return;
    }
    if (status != 'authenticated') {
      window.location.href = '/'
    }
    if (session?.user) {
      setUserID(session?.user?.email?.split('@')[0].replace('.', '_').replace('/', '_') || '');
    }
  }, [status]);

  useEffect(() => {
    localStorage.setItem('tab', selectedTab || 'f');
    setModalIsOpen(false);
  }, [selectedTab]);

  const handleShare = async (id: string) => {
    const type = selectedTab == 'f' ? 'file' : selectedTab == 'c' ? 'code' : 'notes';
    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_SERVER_URL}${type}/${id}`);
    setQrCode(qrCodeDataUrl);
    setFileLink(`${process.env.NEXT_PUBLIC_SERVER_URL}${type}/${id}`);
    setModalIsOpen(true);
  }

  const handleLock = async (id: string, status: boolean) => {
    setLoading(true);
    if (selectedTab == 'f') {
      const { error: dbError } = await supabase
        .from('uploads')
        .update({ lock: status })
        .eq('id', id);

      if (dbError) {
        console.error('Error storing file metadata:', dbError.message);
      }
    }
    await fetch(`/api/store/user/lock`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userID,
        id,
        status,
        type: selectedTab == 'f' ? 'files' : selectedTab == 'c' ? 'codes' : 'notes'
      })
    }).then(async resp => {
      if (await resp.text() == 'done') {
        toast.success(status ? 'Locked' : 'Unlocked');
        setLockChanges(id + status);
      }
    })
  }


  const handleDelete = async (id: string) => {
    setLoading(true);
    if (selectedTab == 'f') {
      const { error: dbError } = await supabase
        .from('uploads')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Error storing file metadata:', dbError.message);
      }
    }
    await fetch(`/api/store/user/delete`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userID,
        id,
        type: selectedTab == 'f' ? 'files' : selectedTab == 'c' ? 'codes' : 'notes'
      })
    }).then(async (resp) => {
      if (await resp.text() == 'done') {
        toast.error('Deleted');
        setLockChanges(id + status);
      }
    })
  }

  return (
    <>
      <div className='h-full w-full flex flex-col justify-around p-1 grid-box'>
        <div className='w-full h-[10vh] flex justify-between p-5 align-middle'>
          {session?.user && <motion.img
            whileTap={{ scale: 0.90 }} whileHover={{ scale: 1.2 }}
            className='w-12 h-12 self-center rounded-full cursor-pointer left-5'
            src={session?.user?.image || ''} alt='user-image'
            referrerPolicy='no-referrer'
            onClick={() => window.location.href = '/'}
          />}
          <LogoutButton />
        </div>
        <div className={`w-full h-[85vh] p-10 max-sm:p-5 ${loading && "cursor-wait"} outline-dashed overflow-hidden rounded-lg bg-black outline-gray-600 transition-all`}>
          <div className='w-full h-auto flex justify-start gap-5 p-5 max-sm:p-0 select-none'>
            <span onClick={() => setSelectedTab('f')} className={`py-1 px-5 max-sm:h-fit cursor-pointer transition-all border hover:scale-105 rounded-full ${selectedTab == 'f' ? 'bg-neutral-100 text-black border-gray-100 hover:border-gray-500' : 'bg-gray-900 text-white border-gray-800 hover:border-gray-500'}`}>Files</span>
            <span onClick={() => setSelectedTab('c')} className={`py-1 px-5 max-sm:h-fit cursor-pointer transition-all border hover:scale-105 rounded-full ${selectedTab == 'c' ? 'bg-neutral-100 text-black border-gray-100 hover:border-gray-500' : 'bg-gray-900 text-white border-gray-800 hover:border-gray-500'}`}>Code {window.innerWidth > 500 && 'Snippets'}</span>
            <span onClick={() => setSelectedTab('n')} className={`py-1 px-5 max-sm:h-fit cursor-pointer transition-all border hover:scale-105 rounded-full ${selectedTab == 'n' ? 'bg-neutral-100 text-black border-gray-100 hover:border-gray-500' : 'bg-gray-900 text-white border-gray-800 hover:border-gray-500'}`}>Notes</span>
          </div>
          <div className={`w-full grid grid-cols-3 max-sm:grid-cols-1 gap-10 max-sm:gap-5 overflow-y-auto p-5 max-sm:px-0 pt-10 ${loading && "pointer-events-none"}`}>
            {
              selectedTab == 'f' && files.length > 0 && files.map((file) => {
                return <Item key={file.name + file.id} item={file} currentTab={selectedTab} handleShare={handleShare} handleLock={handleLock} handleDelete={handleDelete} />
              })
            }
            {
              selectedTab == 'c' && codes.length > 0 && codes.map((code) => {
                return <Item key={code.name + code.id} item={code} currentTab={selectedTab} handleShare={handleShare} handleLock={handleLock} handleDelete={handleDelete} />
              })
            }
            {
              selectedTab == 'n' && notes.length > 0 && notes.map((note) => {
                return <Item key={note.name + note.id} item={note} currentTab={selectedTab} handleShare={handleShare} handleLock={handleLock} handleDelete={handleDelete} />
              })
            }
          </div>
        </div>
        {modalIsOpen && (
          <motion.div
            initial={{ x: "100vh" }}
            animate={{ x: 0 }}
            exit={{ x: "100vh" }}
            transition={{ duration: 0.5 }}
            className="flex absolute bottom-20 right-20 z-50 p-5 max-sm:right-0 max-sm:bottom-0 max-sm:w-full flex-col items-center justify-center border border-gray-300 gap-2 bg-gray-800 rounded-xl">
            <div className='flex relative flex-col items-center justify-center gap-2 bg-gray-800 p-5 rounded-xl'>
              <img className="rounded-md" src={qrcode} alt="QR Code" />
              <p className='text-gray-300'>Scan the QR code to access this media .</p>
              <IconShare onClick={() => {
                navigator.share({ text: `Check my Media on IfShare\n${fileLink}` })
              }} className='hover:bg-slate-500 absolute top-2 left-2 transition-all rounded-full p-1 size-8 cursor-pointer' color='white' />
              <Cross1Icon onClick={() => setModalIsOpen(false)} color='black' className='absolute top-2 right-2 h-6 w-6 p-1 rounded-full bg-neutral-200 cursor-pointer' />
            </div>
            <div className="download-link flex gap-2 overflow-hidden">
              <span className="cursor-pointer text-xs flex justify-center items-center bg-white px-3 py-1 text-black rounded-md font-bold" onClick={() => {
                navigator.clipboard.writeText(fileLink);
                toast.success('Copied ✔', {
                  position: "bottom-left",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: 0,
                  theme: "light",
                  transition: Flip,
                });
              }}>Copy</span>
              <a href={fileLink} target="_blank" className="download-button">
                <button className="bg-slate-800 no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-md p-px text-xs font-semibold leading-6  text-white inline-block">
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
                  </span>
                  <div className="relative flex space-x-2 items-center z-10 rounded-md bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 ">
                    <span>{fileLink}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M10.75 8.75L14.25 12L10.75 15.25"
                      ></path>
                    </svg>
                  </div>
                  <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40"></span>
                </button>
              </a>
            </div>
          </motion.div>
        )}
      </div>
      <ToastContainer />
    </>
  )
}


const Item = ({ item, currentTab, handleShare, handleLock, handleDelete }: any) => {

  return <div className='w-full group cursor-pointer flex max-sm:flex-col max-sm:gap-5 border transition-all overflow-hidden
  p-5 rounded-tl-xl rounded-br-3xl select-none  px-5 hover:shadow-gray-900 shadow-xl text-white justify-between' >
    <p className=' max-w-[50%] truncate'>{item.name} {(currentTab == 'c' || currentTab == 'n') && '_' + item.id}</p>
    <div className='w-fit hidden gap-5 group-hover:flex max-sm:flex max-sm:justify-end max-sm:w-full transition-all'>
      {currentTab != 'f' ? <motion.span initial={{ y: 10 }} whileInView={{ y: 0 }} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}
        onClick={() => {
          window.open(`/${currentTab == 'c' ? 'code' : 'notes'}/${item.id}`);
        }}>
        <IconEdit color='white' />
      </motion.span> :
        <motion.span initial={{ y: 10 }} whileInView={{ y: 0 }} onClick={() => window.open(`/file/${item.id}`)}
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
          <IconDownload color='white' />
        </motion.span>}

      <motion.span initial={{ y: 20 }} whileInView={{ y: 0 }} onClick={() => handleShare(item.id)}
        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
        <IconShare2 color='white' />
      </motion.span>

      <motion.span onClick={() => handleLock(item.id, !item.lock)} initial={{ y: 30 }} whileInView={{ y: 0 }} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
        {item.lock ? <IconLock color='white' /> : <IconLockOpen2 color='white' />}
      </motion.span>

      <motion.span initial={{ y: 40 }} whileInView={{ y: 0 }} onClick={() => {
        const resp = confirm('Do you want to delete this item ?');
        if (resp) {
          handleDelete(item.id)
        }
      }}
        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
        <IconTrash color='white' />
      </motion.span>
    </div>
  </div >
}



const LogoutButton = () => {
  return <motion.button initial={{
    opacity: 0
  }} whileInView={{
    opacity: 1
  }}
    whileTap={{ scale: 0.90 }}
    className='flex gap-2 align-middle h-fit cursor-pointer max-sm:-mt-2 p-2 px-5 top-5 left-3 rounded-full bg-gray-100 border transition-all hover:border-indigo-500'
    onClick={() => {
      const conf = confirm('Do you want to logout ?');
      if (conf.valueOf()) {
        signOut();
      }
    }}>
    Log out
  </motion.button>
}

export default page
