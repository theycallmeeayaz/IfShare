'use client';

import { cn, generateUniqueId } from "@/@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { gsap } from 'gsap';
import supabase from "@/@/lib/client";
import QRCode from 'qrcode';
import { Flip, toast } from "react-toastify";
import CryptoJS from 'crypto-js';
import { TextGenerateEffect } from "./text-generate-effect";
import JSZip from 'jszip';  // Import JSZip
import { ReloadIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

const words = `
"Upload and share files seamlessly with this application, enabling fast, secure, and user-friendly file management!"
`;

const title = `
"Upload and share files seamlessly!"
`;

export const FileUpload = ({ showReveal }: { showReveal: Function }) => {
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLDivElement>(null);
    const [qrCode, setQrCode] = useState<string>();
    const [fileLink, setFileLink] = useState<string>();

    const { data: session } = useSession();

    const storeToUser = async (name: string, id: string) => {
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
                type: 'files'
            })
        })
    }



    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (newFiles: File[], e: any) => {
        const maxFileSize = 50 * 1024 * 1024;

        const validFiles = newFiles.filter(file => {
            if (file.size > maxFileSize) {
                console.error(`File size exceeds limit: ${file.name} (${file.size / (1024 * 1024)} MB)`);
                toast.error("File limit exceeds !");
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            console.warn("No valid files to upload.");
            return;
        }

        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
        fileInputRef?.current?.setAttribute("disabled", "true");
        let fileToUpload;

        if (validFiles.length > 1) {
            const zip = new JSZip();

            validFiles.forEach(file => {
                zip.file(file.name, file);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });

            fileToUpload = await zipBlob.arrayBuffer().then((buffer) => {
                const encryptedData = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(buffer), process.env.NEXT_PUBLIC_ENCRYPTION_KEY!);
                return new Blob([encryptedData.toString()], { type: 'application/zip' });
            });
        } else {
            const file = validFiles[0];
            fileToUpload = await file.arrayBuffer().then((buffer) => {
                const encryptedData = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(buffer), process.env.NEXT_PUBLIC_ENCRYPTION_KEY!);
                return new Blob([encryptedData.toString()], { type: file.type });
            });
        }

        const timestamp = Date.now();
        const uniqueFileName = validFiles.length > 1 ? `public/${timestamp}_files.zip` : `public/${timestamp}_${validFiles[0].name}`;

        const { data, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(uniqueFileName, fileToUpload);

        if (uploadError) {
            console.error('Error uploading file:', uploadError.message);
            return;
        }

        console.log('File Uploaded Successfully', data);
        const uniqueID = generateUniqueId();

        const fileUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}file/${uniqueID}`;
        setFileLink(fileUrl);

        const { error: dbError } = await supabase
            .from('uploads')
            .insert([{
                id: uniqueID,
                file_name: validFiles.length > 1 ? 'files.zip' : validFiles[0].name,
                file_size: fileToUpload.size,
                file_type: validFiles.length > 1 ? 'application/zip' : validFiles[0].type,
                file_path: `/storage/v1/object/public/uploads/${uniqueFileName}`,
                created_at: new Date().toISOString(),
                lock: false
            }]);

        if (dbError) {
            console.error('Error storing file metadata:', dbError.message);
        } else {
            console.log('File metadata stored successfully:', { name: validFiles.length > 1 ? 'files.zip' : validFiles[0].name, url: fileUrl });
            if (session?.user) {
                storeToUser(validFiles.length > 1 ? 'files.zip' : validFiles[0].name, uniqueID);
            }
        }

        await generateQrCode(fileUrl);
    };

    const generateQrCode = async (url: string) => {
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(url);
            setQrCode(qrCodeDataUrl);
            setFileLink(url);
        } catch (error) {
            console.error("Error generating QR code", error);
        }
        showReveal(false);
    };


    useEffect(() => {
        setTimeout(() => {
            if (fileRef.current) {
                gsap.to(fileRef.current, {
                    rotate: 720,
                    color: "#000000",
                    yoyo: true,
                    duration: 2,
                    scale: 1,
                    stagger: 0.2,
                    rotateY: 180,
                    attr: { d: "M10 10 H 90 V 90 H 10 L 10 10" },
                    ease: "Power1.inOut"
                });
            }
        }, 1000);
    }, []);

    const { getRootProps, isDragActive } = useDropzone({
        multiple: true,
        noClick: true,
        onDrop: handleFileChange,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    return (
        <div className="w-full py-5" {...getRootProps()}>
            <motion.div
                className="p-5 max-sm:p-5 group/file block rounded-lg w-full relative overflow-hidden"
            >
                <input
                    ref={fileInputRef}
                    id="file-upload-handle"
                    type="file"
                    multiple
                    onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        console.log("File selected:", files);
                        handleFileChange(files, e);
                    }}
                    className="hidden"
                />

                <div className="flex flex-col gap-8 sm:flex-row items-center justify-center w-full min-h-[30vh]">
                    <div className="flex flex-col w-[50vw] max-sm:w-full p-1">
                        <div className="flex flex-col text-center items-center">
                            <div className="flex h-10 justify-center w-full animate-pulse">
                                <img className="object-contain" src="/flixker_logo.png" />
                            </div>
                            <span className="relative text-white z-20 font-sans font-normal dark:text-neutral-400 text-base mt-2">
                                <TextGenerateEffect className='text-white sm:flex hidden' words={words} />
                                <TextGenerateEffect className='text-white sm:hidden' words={title} />
                            </span>
                        </div>
                        <motion.div className={`relative w-full content-center mt-10 max-w-xl mx-auto cursor-pointer scrollbar-thin px-5 max-sm:px-1 overflow-x-hidden h-[30vh] max-sm:h-[50vh] ${files.length ? "overflow-y-auto" : "overflow-hidden"}`}
                            whileHover="animate"

                            onClick={handleClick}
                        >

                            {files.length > 0 &&
                                files.map((file, idx) => (
                                    <motion.div
                                        key={"file" + idx}
                                        layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                                        className={cn(
                                            "relative select-none overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md",
                                            "shadow-sm",
                                            `${!qrCode && "animate-pulse"}`
                                        )}
                                    >
                                        <div className="flex justify-between w-full items-center gap-4">
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                                            >
                                                {file.name}
                                            </motion.p>
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="rounded-lg px-2 py-1 w-fit flex-shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                                            >
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </motion.p>
                                        </div>
                                        <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                                className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
                                            >
                                                {file.type}
                                            </motion.p>
                                            {qrCode ? <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                layout
                                            >
                                                modified{" "}
                                                {new Date(file.lastModified).toLocaleDateString()}
                                            </motion.p> : <ReloadIcon color="black" className="animate-spin mr-5" />}
                                        </div>


                                    </motion.div>
                                ))}
                            {!files.length && (
                                <motion.div
                                    layoutId="file-upload"
                                    variants={mainVariant}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                    }}
                                    ref={fileRef}
                                    className={cn(
                                        "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                                        "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                                    )}
                                >
                                    {isDragActive ? (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-neutral-600 flex flex-col items-center"
                                        >
                                            Drop it
                                            <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                                        </motion.p>
                                    ) : (
                                        <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                                    )}
                                </motion.div>
                            )}
                            {!files.length && (
                                <motion.div
                                    variants={secondaryVariant}
                                    className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center self-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                                ></motion.div>
                            )}
                        </motion.div>



                    </div>
                    <div className="flex flex-col gap-2 items-center content-center justify-center">
                        {qrCode && (
                            <motion.div className="flex flex-col items-center justify-center gap-2">
                                <img className="rounded-md" src={qrCode} alt="QR Code" />
                                <p>Scan the QR code to access all files.</p>
                            </motion.div>

                        )}

                        {fileLink && (
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
                        )}

                    </div>

                </div>

            </motion.div>
        </div>
    );
};