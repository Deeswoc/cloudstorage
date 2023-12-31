import { useEffect, useState } from "react";
import Folder from "./folder";
import { auth, provider } from '../firebase'


function Root({ currentUser, setCurrentUser }) {
    const [root, setRoot] = useState({ folder: [] });

    function removeFile(fileID) {
        setRoot({
            ...root, folder: root.folder.filter((file) => {
                return fileID.localeCompare(`${file.dev}${file.ino}`);
            })
        })
    }

    useEffect(() => {
        console.log("This is being mounted");
        async function fetchFolder() {
            if (currentUser) {
                console.log("Current User: ", currentUser);
                //  
            }
            else setRoot({ folder: null })
        }

        fetchFolder();
    }, [currentUser])

    return (<Folder folder={root.folder} currentUser={currentUser} removeFile={removeFile} />)
}

export default Root;