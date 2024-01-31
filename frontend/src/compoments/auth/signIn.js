import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../../firebase'
import 'firebaseui/dist/firebaseui.css'
import { useEffect, useState } from 'react';
import SignOutBtn from './signOut';

// Initialize the FirebaseUI Widget using Firebase.



function SignIn({ setCurrentUser, currentUser }) {
    // useEffect(() => {
    //     var ui = firebaseui.auth.AuthUI.getInstance();
    //     ui.start('#firebaseui-auth-container', {
    //         signInOptions: [
    //             // List of OAuth providers supported.
    //             firebase.auth.GoogleAuthProvider.PROVIDER_ID
    //         ],
    //         // Other config options...
    //     });
    // })
    // useEffect(() => {
    //     onAuthStateChanged(auth, (user) => {
    //         if (user) {
    //             console.log("Setting current user");
    //             setCurrentUser(user);
    //             // User is signed in, see docs for a list of available properties
    //             // https://firebase.google.com/docs/reference/js/auth.user
    //             const uid = user.uid;
    //             // ...
    //         } else {
    //             // User is signed out
    //             // ...
    //             setCurrentUser(null)
    //         }
    //     });

    // }, [setCurrentUser]);


    function handleClick() {
        signInWithPopup(auth, provider).then(async (data) => {
            const token = await data.user.getIdToken();

            const signin = await fetch('/signin', {
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