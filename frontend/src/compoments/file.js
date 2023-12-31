import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import download from 'downloadjs';

function File({ file, currentUser, removeFile }) {
    // const [selected, setSelected] = useState(false);

    // function selectThisFile(){
    //     selected
    // }

    async function download() {
        const aTag = document.createElement('a');
        aTag.href = `http://localhost:3000/download/${currentUser.uid}/${file.filename}`
        aTag.setAttribute('download', file);
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
        // const idToken = await currentUser.getIdToken(true);
        // const response = await fetch(`http://localhost:3000/download/${currentUser.uid}/${file.filename}`, {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `Bearer ${idToken}`
        //     }
        // });


    }

    async function deleteFile() {

        const idToken = await currentUser.getIdToken(true);
        console.log("Deleting a file");
        const response = await fetch(`http://localhost:3000/delete/${file.filename}`, {
            method: 'DELETE', headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        removeFile(`${file.dev}${file.ino}`)
    }


    return (<>
        <div className="col-2 p-2">
            <div className='card pb-2 pt-0 px-2 bg-slate-50 hover:bg-slate-300 hover:drop-shadow hover:cursor-pointer transition-all duration-200 ' contextMenu='' onDoubleClick={download}>
                <div className='text-right p-0 m-0 justify-normal [&_i:hover]:text-blue-400 transition-all duration-200'>
                    <Dropdown>
                        <Dropdown.Toggle className='after:content-[""] bg-blue-300' variant="dark" id="dropdown-basic">
                            {/* <FontAwesomeIcon icon={icon({ name: 'ellipsis' })} /> */}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={download}>Download</Dropdown.Item>
                            <Dropdown.Item onClick={deleteFile}>Delete</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <div className='mb-2 py-10 bg-slate-100 rounded-md drop-shadow-md'>
                    <FileTypeIcon file={file.filename} />

                </div>
                <span className='d-block text-truncate' style={{ fontSize: 16 }}>{file.filename.split('/').at(-1)}</span>
                <span className='d-block' style={{ fontSize: 16 }}>{formatBytes(file.size)}</span>
            </div >
        </div >
    </>)
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