import File from "./file";

function Folder({ folder }) {
    if(folder === null){
        return <div className="container">
            <div className="row">
                <div className="col">Not Signed in</div>
            </div> 
        </div>
    } 

    return (<div className="container">
        <div className="row">
            {folder.map(file => {
                return <File file={file} />
            })}
        </div>
    </div>)
}

export default Folder;