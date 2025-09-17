'use client';

import React, { useEffect, useState } from 'react';
import { FileUpload } from '@/@/components/ui/file-upload';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TextRevealCard} from '@/@/components/ui/text-reveal-card';
import { motion } from 'framer-motion'
import { generateUniqueId } from '@/@/lib/utils';

const HomePage = () => {
    const [isMounted, setMounted] = useState(false);
    const [uniqueID, setUniqueID] = useState("");

    useEffect(() => {
        setMounted(true);
        setUniqueID(generateUniqueId());
    }, []);

    return (
        <>
            <div className={`w-full bg-black flex flex-col items-center text-white min-h-full overflow-y-hidden ${!isMounted && "justify-center"}`}>
                <div className="w-full flex flex-col items-center">
                    <div className='w-full  min-h-[30vh]'>
                        <FileUpload showReveal={setMounted} />
                    </div>
                    {isMounted && <motion.div className='flex mt-[-6vh] pl-10 w-full text-white'>
                        <div className='flex w-full justify-between p-4  max-sm:hidden'>
                            <TextRevealCard
                                text="End To End Encryption"
                                revealText="All About Privacy"
                            />
                            <TextRevealCard
                                text="Amazingly Fast"
                                revealText="High Speed File Sharing"
                                className='ml-10'
                            />
                        </div>
                    </motion.div>}
                </div>
            </div>
            <ToastContainer />
        </>
    );
};

export default HomePage;