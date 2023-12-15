import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, provider } from '../../firebase'
import 'firebaseui/dist/firebaseui.css'
import { useEffect, useState } from 'react';
import SignOutBtn from './signOut';

// Initialize the FirebaseUI Widget using Firebase.



function SignIn({setCurrentUser, currentUser}) {
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
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/auth.user
                const uid = user.uid;
                // ...
            } else {
                // User is signed out
                // ...
                setCurrentUser(null)
            }
        });

    }, [setCurrentUser]);


    function handleClick() {
        signInWithPopup(auth, provider).then((data) => {
            setCurrentUser(data.user)
        })
    }

    return (<div>
        {currentUser ? <SignOutBtn /> : <button onClick={handleClick} className='btn btn-primary'>Sign In with Google</button>}

    </div>)
}

export default SignIn