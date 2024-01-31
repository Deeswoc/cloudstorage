import { auth } from "../../firebase"

function SignOutBtn({ setCurrentUser }) {

    return <button className="btn btn-primary" onClick={() => {
        fetch('/logout', { method: 'POST' }).then((res) => { if (res.ok) { setCurrentUser(null) } });
    }}>Sign Out</button>
}

export default SignOutBtn;