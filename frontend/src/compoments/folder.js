import File from "./file";

function Folder({ folder, currentUser, removeFile }) {
    if (folder === null) {
        return <div className="container">
            <div className="row">
                <div className="col">Not Signed in</div>
            </div>
        </div>
    }

    return (<div className="container">
        <div className="row">
            {folder.map(file => {
                return <File currentUser={currentUser} file={file} removeFile={removeFile} key={file.filename} />
            })}
        </div>
    </div>)
}

export default Folder;