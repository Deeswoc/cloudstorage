import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../../firebase'
import 'firebaseui/dist/firebaseui.css'
import { useEffect, useState } from 'react';
import SignOutBtn from './signOut';

// Initialize the FirebaseUI Widget using Firebase.



function SignIn({ setCurrentUser, currentUser }) {
    function handleClick() {
        signInWithPopup(auth, provider).then(async (data) => {
            const token = await data.user.getIdToken();

            const signin = await fetch('api/signin', {
                method: 'POST',
                body: JSON.stringify({ token, username: "username" }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (signin.status === 200) {
                console.log("Signed in successfully");
                const user_res = await fetch('/profile/info');
                const user = await user_res.json();
                console.log(user);
                setCurrentUser(user);
                auth.signOut();
            } else {
                console.log("Signin unsuccessful");
                console.log(signin);
            }
            console.log(data.user)
            auth.signOut();
        }).catch((err) => {
            console.log(err);
        })
    }

    return (<div>
        {currentUser ? <SignOutBtn setCurrentUser={setCurrentUser} /> : <button onClick={handleClick} className='btn btn-primary'>Sign In with Google</button>}
    </div>)
}

export default SignIn