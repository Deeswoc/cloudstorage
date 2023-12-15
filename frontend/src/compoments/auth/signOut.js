import {auth} from "../../firebase"

function SignOutBtn(){
    
    return <button className="btn btn-primary" onClick={()=>{auth.signOut()}}>Sign Out</button>
}

export default SignOutBtn;