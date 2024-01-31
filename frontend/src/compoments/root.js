import { useEffect, useState } from "react";
import Folder from "./folder";
import './root.css'


function Root({ currentUser, setCurrentUser, setFiles, files, reallocateSpace }) {
    const [root, setRoot] = useState({ folder: [] });

    function removeFile(fileID) {
        setRoot({
            ...root, folder: root.folder.filter((file) => {
                return fileID !== file.id;
            })
        })

        setFiles(files.filter((file) => {
            if(file.id===fileID){
                reallocateSpace(file.size);
            }
            return fileID !== file.id;
        }))

    }

    useEffect(() => {
        async function fetchFolder() {
            if (currentUser) {
                const res = await fetch("/folders");
                const folder = await res.json();
                setRoot({ folder })
                setFiles(folder);
            }
            else setRoot({ folder: null })
        }

        fetchFolder();
    }, [currentUser])

    return (
        <div className="d-block relative">

            <Folder folder={files} currentUser={currentUser} removeFile={removeFile} />
        </div>
    )
}

export default Root;