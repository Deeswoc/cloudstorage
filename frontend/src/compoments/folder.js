import File from "./file";

function Folder({ folder, currentUser, removeFile }) {
    if (currentUser === null) {
        return <div className="container">
            <div className="row">
                <div className="col">Not Signed in</div>
            </div>
        </div>
    }
    if (folder === null) {
        return <div className="container">
            <div className="row">
                <div className="col">Empty</div>
            </div>
        </div>
    }

    return (<div className="container">
        <div className="row">
            {folder?.map(file => {
                return <File currentUser={currentUser} file={file} removeFile={removeFile} key={file.name} />
            })}
        </div>
    </div>)
}

export default Folder;