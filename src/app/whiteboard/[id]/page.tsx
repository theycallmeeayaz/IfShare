'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { GrRedo, GrUndo } from 'react-icons/gr';
import { IconRotateRectangle } from '@tabler/icons-react';
import { CircleBackslashIcon, SquareIcon } from '@radix-ui/react-icons';
import { FaCircle, FaGripLinesVertical, FaLine, FaLinesLeaning, FaSquare, FaSquareBehance, FaSquareFull } from 'react-icons/fa6';
import { BsGrid3X3GapFill } from "react-icons/bs";
import { MdStickyNote2 } from 'react-icons/md';
import { useRouter } from 'next/router';
import { useParams, useSearchParams } from 'next/navigation';

const Whiteboard = () => {
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<'draw' | 'erase' | 'none'>('draw');
    const [history, setHistory] = useState<fabric.Object[]>([]);
    const [redoStack, setRedoStack] = useState<fabric.Object[]>([]);
    const [arrowType, setArrowType] = useState<'straight' | 'curved' | 'angled'>('straight');
    const [brushW, setBrushW] = useState<number>(5);
    const [colorW, setColorW] = useState<string>("#000000");
    const [isGridVisible, setIsGridVisible] = useState(false);

    const params = useParams();

    useEffect(() => {
        const canvasElement = document.getElementById('whiteboard');
        if (!canvasElement) return;

        const canvas = new fabric.Canvas('whiteboard', {
            width: 1550,
            height: 700,
            backgroundColor: '#ffffff',
        });

        canvasRef.current = canvas;

        canvas.renderAll();
        return () => {
            canvas.dispose();
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.off('mouse:down');
        canvas.off('mouse:move');

        if (activeTool === 'draw') {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
            if (brush) {
                brush.color = 'black';
                brush.width = 5;
            }

            canvas.on('object:added', (e) => {
                setHistory((prevHistory) => {
                    return [...prevHistory, e.target];
                });
            });
        } else if (activeTool === 'erase') {
            canvas.isDrawingMode = false;

            canvas.on('mouse:down', function (event) {
                const pointer = canvas.getPointer(event.e);
                const objects = canvas.getObjects();

                for (const obj of objects) {
                    if (obj.containsPoint(pointer)) {
                        canvas.remove(obj);

                        setRedoStack((prevRedoStack) => {
                            return [...prevRedoStack, obj];
                        });
                        break;
                    }
                }
            });
        } else {
            canvas.isDrawingMode = false;
            canvas.off('mouse:down');
        }
    }, [activeTool]);

    const enableDrawingMode = () => {
        setActiveTool('draw');
    };

    const enableEraserMode = () => {
        setActiveTool('erase');
    };

    const disableAllModes = () => {
        setActiveTool('none');
    };

    const exportAsImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 1,
        });

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'whiteboard.png';
        link.click();
    };

    const addText = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const text = new fabric.Textbox('Type here', {
            left: 100,
            top: 100,
            width: 200,
            fontSize: 30,
            fontFamily: 'Arial',
            fill: 'black',
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: 1.2,
        });

        setActiveTool('none');
        canvas.add(text);

        setHistory((prevHistory) => {
            return [...prevHistory, text];
        });
    };

    const undo = () => {
        const canvas = canvasRef.current;
        if (!canvas || history.length === 0) {
            return;
        }

        const lastObject = history[history.length - 1];

        canvas.remove(lastObject);

        setRedoStack((prevRedoStack) => {
            return [...prevRedoStack, lastObject];
        });

        setHistory((prevHistory) => {
            return prevHistory.slice(0, -1);
        });
    };

    const redo = () => {
        const canvas = canvasRef.current;
        if (!canvas || redoStack.length === 0) {
            return;
        }

        const lastRedoObject = redoStack[redoStack.length - 1];

        canvas.add(lastRedoObject);

        setHistory((prevHistory) => {
            return [...prevHistory, lastRedoObject];
        });

        setRedoStack((prevRedoStack) => {
            return prevRedoStack.slice(0, -1);
        });


    };

    const updateBrush = (size: number, color: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = color;
            canvas.freeDrawingBrush.width = size;
        }
    };

    const addShape = (shape: 'rect' | 'circle') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let shapeObject: any;

        if (shape === 'rect') {
            shapeObject = new fabric.Rect({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: 'white',
                stroke: "black",

            });
        } else if (shape === 'circle') {
            shapeObject = new fabric.Circle({
                left: 150,
                top: 150,
                radius: 50,
                fill: "white",
                stroke: "black",
                borderColor: "black",
                borderScaleFactor: 2
            });
        }

        canvas.add(shapeObject);
        setHistory((prevHistory) => [...prevHistory, shapeObject]);
    };



    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.clear();

        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
    };


    const drawArrow = (type: 'straight' | 'curved' | 'angled') => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let arrowPath: string;

        switch (type) {
            case 'straight':
                arrowPath = 'M 0 0 L 200 0 L 190 -10 M 200 0 L 190 10';
                break;
            case 'curved':
                arrowPath = 'M 0 0 C 50 100, 150 100, 200 0 L 190 -10 M 200 0 L 190 10';
                break;
            case 'angled':
                arrowPath = 'M 0 0 L 150 0 L 150 -30 L 200 0 L 150 30 Z';
                break;
            default:
                arrowPath = 'M 0 0 L 200 0 L 190 -10 M 200 0 L 190 10';
                break;
        }

        const arrow = new fabric.Path(arrowPath, {
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 2,
            left: 100,
            top: 100,
        });

        canvas.add(arrow);
        setHistory((prevHistory) => [...prevHistory, arrow]);
    };


    const drawLine = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // if(confirm("disable drawing mode ?")){
        //   setActiveTool('none');
        // } 


        let line: fabric.Line | null = null;

        canvas.on('mouse:down', (opt) => {
            const pointer = canvas.getPointer(opt.e);
            line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: colorW,
                strokeWidth: brushW,
            });
            canvas.add(line);
        });

        canvas.on('mouse:move', (opt) => {
            if (!line) return;
            const pointer = canvas.getPointer(opt.e);
            line.set({ x2: pointer.x, y2: pointer.y });
            canvas.renderAll();
        });

        canvas.on('mouse:up', () => {
            setHistory((prevHistory: any) => [...prevHistory, line]);
            line = null;
        });

    };

    const addStickyNote = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const stickyNote = new fabric.Rect({
            left: 100,
            top: 100,
            width: 150,
            height: 100,
            fill: '#f3f438',
            stroke: 'black',
            strokeWidth: 1,
        });

        const text = new fabric.Textbox('Note', {
            left: 110,
            top: 110,
            width: 130,
            fontSize: 14,
            fontFamily: 'Arial',
            textAlign: 'center',

        });

        const group = new fabric.Group([stickyNote, text]);
        canvas.add(group);

        setHistory((prevHistory) => [...prevHistory, group]);
    };


    const toggleGrid = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gridSize = 25;

        if (isGridVisible) {
            console.log("hahah");

            const objectsToRemove = canvas.getObjects().filter(obj => obj.type === 'line' && obj.stroke === '#ccc');
            objectsToRemove.forEach(obj => canvas.remove(obj));
            setIsGridVisible(false);
            canvas.renderAll();
        } else {
            console.log("hahahahahhahaha");
            setIsGridVisible(true);
            console.log(isGridVisible);


            for (let i = 0; i < canvas.width!; i += gridSize) {
                canvas.add(
                    new fabric.Line([i, 0, i, canvas.height!], {
                        stroke: '#ccc',
                        selectable: false,
                        evented: false,
                    })
                );
            }
            for (let j = 0; j < canvas.height!; j += gridSize) {
                canvas.add(
                    new fabric.Line([0, j, canvas.width!, j], {
                        stroke: '#ccc',
                        selectable: false,
                        evented: false,
                    })
                );
            }
            canvas.renderAll();
        }
    };




    const saveCanvas = async () => {
        const canvasJSON = canvasRef.current?.toJSON();
        console.log(params?.id);

        await fetch('/api/whiteboard', {
            method: 'POST',
            body: JSON.stringify({ id: params?.id, img: canvasJSON }),
            headers: { 'Content-Type': 'application/json' }
        });

        alert("Board Saved!!");
    };

    return (
        <div className="w-full h-screen relative">
            <canvas
                id="whiteboard"
                width="1550"
                height="700"
                style={{
                    border: '1px solid black',
                }}
            />
            <button
                onClick={enableDrawingMode}
                className={`absolute font-anton top-6 left-6 px-3 py-1 rounded-md ${activeTool === 'draw' ? 'bg-gradient-to-r from-cyan-400 to-green-400' : 'bg-gradient-to-r from-cyan-100 to-green-200'}`}
            >
                Drawing Mode
            </button>
            <button
                onClick={enableEraserMode}
                className={`absolute font-anton top-6 left-40 px-3 py-1 rounded-md ${activeTool === 'erase' ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-red-200 to-red-400'}`}
            >
                Eraser
            </button>
            <button
                onClick={disableAllModes}
                className={`absolute font-anton top-6 left-60 px-3 py-1 rounded-md ${activeTool === 'none' ? 'bg-gradient-to-r from-gray-500 to-gray-700' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`}
            >
                Disable All
            </button>
            <button onClick={undo} className="absolute top-7 left-[22rem] font-anton bg-gray-800 text-white px-3 py-1 rounded-md">
                <GrUndo />
            </button>
            <button onClick={redo} className="absolute top-7 left-[25rem] font-anton bg-gray-800 text-white px-3 py-1 rounded-md">
                <GrRedo />
            </button>
            <button onClick={exportAsImage} className="absolute top-6 right-10 font-anton bg-zinc-900 text-white px-3 py-1 rounded-md">Export</button>
            <button onClick={addText} className="absolute top-6 right-[12rem] font-anton bg-gradient-to-r from-cyan-500 to-blue-400 text-white px-3 py-1 rounded-md">Add Text</button>

            <div className="absolute top-2 translate-x-[-50%] font-bubble text-3xl translate-y-1/2 left-1/2 text-black">
                Whiteboard
            </div>

            <div className="absolute top-16 left-6 flex space-x-4">
                <label>
                    Brush Size:
                    <input
                        type="number"
                        value={brushW}
                        onChange={(e: any) => {
                            const value = Number(e.target.value);
                            setBrushW(value);
                            updateBrush(value, colorW);
                        }}
                        className="ml-2 px-2 py-1 border rounded"
                    />
                </label>

                <label>
                    Brush Color:
                    <input
                        type="color"
                        value={colorW}
                        onChange={(e) => {
                            const value = e.target.value;
                            setColorW(value);
                            updateBrush(brushW, value)
                        }}
                        className="ml-2"
                    />
                </label>
            </div>

            <button onClick={() => addShape('rect')} className="absolute top-7 left-[30rem] font-anton text-black px-3 py-1 rounded-md">
                <SquareIcon />
            </button>
            <button onClick={() => addShape('circle')} className="absolute top-7 left-[33rem] font-anton  text-black px-3 py-1 rounded-md">
                <FaCircle />
            </button>

            <button
                onClick={clearCanvas}
                className="px-3 py-1 bg-red-500 text-white rounded absolute bottom-4 right-10"
            >
                Clear Canvas
            </button>

            <select
                value={arrowType}
                onChange={(e) => setArrowType(e.target.value as 'straight' | 'curved' | 'angled')}
                className="px-6 py-1 font-bubble rounded-md absolute bottom-4 text-white bg-zinc-900 left-10"
            >
                <option value="straight">Straight Arrow</option>
                <option value="curved">Curved Arrow</option>
                <option value="angled">Angled Arrow</option>
            </select>

            <button
                onClick={() => drawArrow(arrowType)}
                className="px-3 py-1 mt-2 rounded-md bg-zinc-200 absolute bottom-4 left-80 font-bubble to-green-400"
            >
                Draw Arrow
            </button>

            <button onClick={drawLine} className="absolute top-[4.3rem] left-[32.3rem]"> <FaGripLinesVertical /> </button>

            <button onClick={addStickyNote} className="absolute top-7 text-xl left-[37rem]"><MdStickyNote2 /></button>

            <button onClick={toggleGrid} className="absolute top-[4.25rem] left-[35.5rem]"> <BsGrid3X3GapFill /> </button>

            <button
                onClick={saveCanvas}
                className="absolute top-6 right-[7.5rem] px-3 py-1 rounded-md bg-gradient-to-r from-zinc-500 to-gray-900 text-white font-anton"
            >
                Save
            </button>


        </div>
    );
};

export default Whiteboard;