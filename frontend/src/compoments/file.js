import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react';

import { arrow, useClick, useFloating, useInteractions } from '@floating-ui/react'
function File({ file, currentUser, removeFile }) {
    const arrowRef = useRef(null)
    const [shown, setShown] = useState(false);
    const { refs, floatingStyles, context, middlewareData } = useFloating({
        placement: 'bottom-end',
        open: shown,
        onOpenChange: setShown,
        middleware: [
            arrow({
                element: arrowRef,
            })
        ]
    });



    const useCustomLogic = (ctx) => {

        const referenceProps = useMemo(
            () => ({
                onClick: (e) => {
                    console.log("Reference Clicked");
                }
            }),
            [],
        )

        return useMemo(
            () => ({
                reference: referenceProps,
            }),
            [referenceProps]
        )

    }

    const { reference } = useCustomLogic(context);

    const click = useClick(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click]);
    const fileContextMenu = useRef(null);

    // useEffect(() => {
    //     const ctxMenu = fileContextMenu.current;

    //     if (!ctxMenu) return;
    //     console.log("Not null rn");
    //     fileContextMenu.current.addEventListener('focus', (e) => {
    //         console.log("This blurred")
    //         if (!fileContextMenu.contains(e.relatedTarget)) {
    //             setShown(false);
    //         } else {
    //             console.log("idk but it ran");
    //         }
    //     })
    //     fileContextMenu.current.focus();
    // }, [shown]);

    useEffect(()=>{
        if(shown){
            console.log("Floating: ", refs.floating.current.focus());
            refs.floating.current.focus();
        }
    },[shown]);

    async function download() {
        setShown(false);
        const aTag = document.createElement('a');
        aTag.href = `http://localhost:3000/files/${file.id}?download=true`
        aTag.setAttribute('download', file);
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
    }

    async function deleteFile() {
        console.log("Deleting a file");
        const response = await fetch(`/files/${file.id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            const deletedFile = await response.json();
            removeFile(deletedFile.id)
        }
        setShown(false);
    }

    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    function openContextMenu(e) {
        const card = findAncestor(e.target, "card");
        card.focus();
    }

    /**
     * Handles the onblur event for an input element.
     *
     * @param {Event} event - The onblur event object.
     */
    // function closeContextMenu(e) {
    //     setShown(false);
    // }

    const refProps = getReferenceProps();


    return (
        <div className="p-2 hover:z-auto" style={{ width: 230 }} onContextMenu={(e) => { e.preventDefault(); setShown(true); }}>
            <div tabIndex={1} onClick={(e) => { e.target.focus() }} className=' card p-2 bg-slate-50 hover:bg-slate-300 focus-within:bg-slate-300 focus-within:ring  hover:cursor-pointer transition-all duration-200 ' contextMenu='' onDoubleClick={download}>
                <div className='mb-2 py-10 bg-slate-100 rounded-md drop-shadow-md'>
                    <FileTypeIcon file={file.name} />

                </div>
                <div className='flex items-center'>
                    <div className='flex-1 text-truncate'>
                        <span className='d-block text-truncate text-left' style={{ fontSize: 16 }}>{file.name}</span>
                        <span className='d-block text-left' style={{ fontSize: 16 }}>{formatBytes(file.size)}</span>
                    </div>
                    <div >

                        {shown &&
                            <div ref={refs.setFloating} style={floatingStyles} onBlur={()=>{setShown(false)}} {...getFloatingProps()} className='card-popup-menu bg-slate-200 rounded shadow z-50' >
                                <ul ref={fileContextMenu} className='py-0 pl-0 m-0 text-left [&>li]:pl-3 [&>li:hover]:bg-slate-300 [&>li]:pr-6 [&>li>div]:flex [&>li>div]:items-center [&>li_svg]:mr-2 [&>li>i] [&>li]:py-3 [&>hr]:m-0' >
                                    <li onClick={download}>
                                        <div>
                                            <FontAwesomeIcon icon={icon({ name: 'download' })} />Download
                                        </div>
                                    </li>
                                    <hr />
                                    <li onClick={() => { console.log("Details Clicked"); setShown(false) }}>
                                        <div>
                                            <FontAwesomeIcon icon={icon({ name: 'eye' })} />Details
                                        </div>
                                    </li>
                                    <hr />
                                    <li onClick={deleteFile}>
                                        <div>
                                            <FontAwesomeIcon icon={icon({ name: 'x' })} />Delete
                                        </div>
                                    </li>
                                </ul>

                                <div
                                    ref={arrowRef}
                                    style={{
                                        position: 'absolute',
                                        left: middlewareData.arrow?.x,
                                        top: middlewareData.arrow?.y,
                                    }} />
                            </div>
                        }
                        <button ref={refs.setReference}  {...getReferenceProps()} className='bg-transparent py-2 pl-2'>
                            <FontAwesomeIcon icon={icon({ name: 'ellipsis-vertical' })} />
                        </button>
                    </div>
                </div>
            </div >

        </div >
    )
}

function FileTypeIcon({ file }) {
    const extension = file.split('.').pop();
    let name;
    let style = {
        fontSize: 64,
        color: '#0479bd'
    }
    switch (extension) {
        case 'pdf': {
            return <FontAwesomeIcon style={style} icon={icon({ name: 'file-pdf' })} />
        }

        default: {
            return <FontAwesomeIcon style={style} icon={icon({ name: 'file' })} />
        }
    }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


export default File