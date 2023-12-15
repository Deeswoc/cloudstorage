import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react';

function File({ file }) {
    // const [selected, setSelected] = useState(false);

    // function selectThisFile(){
    //     selected
    // }

    function download(){
        const aTag = document.createElement('a');
        aTag.href = `http://localhost:3000/download/${file.filename}`
        aTag.setAttribute('download', file);
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
    }

    return (<>
        <div className="col-2 p-2">
            <div className='card py-2 px-2 bg-slate-50 hover:bg-slate-300 hover:drop-shadow hover:cursor-pointer transition-all duration-200 ' onDoubleClick={download}>

                <div className='mb-2 py-10 bg-slate-100 rounded-md drop-shadow-md'>
                    <FileTypeIcon file={file.filename} />

                </div>
                <span className='d-block text-truncate' style={{ fontSize: 16 }}>{file.filename}</span>
                <span className='d-block' style={{ fontSize: 16 }}>{formatBytes(file.size)}</span>
            </div>
        </div>
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