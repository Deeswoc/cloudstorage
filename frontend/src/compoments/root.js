import { useEffect, useState } from "react";
import Folder from "./folder";
import { auth, provider } from '../firebase'


function Root({ currentUser, setCurrentUser }) {
    const [root, setRoot] = useState({ folder: [] });

    useEffect(() => {
        console.log("This is being mounted");
        async function fetchFolder() {
            if (currentUser) {

                const idToken = await auth.currentUser.getIdToken(true);
                const res = await fetch("http://localhost:3000/files-list", {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                const files = await res.json();
                console.log("Folder: ", files)
                setRoot({ ...root, folder: files })
            } 
            else setRoot({folder: null})
        }

        fetchFolder();
    }, [currentUser])

    return (<Folder folder={root.folder} />)
}

export default Root;