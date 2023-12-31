import './App.css';
import './style/output.css'
import { useForm } from 'react-hook-form';
import Root from './compoments/root';
import SignIn from './compoments/auth/signIn';
import { auth } from './firebase'
import { Button, Container, Nav, NavDropdown, Navbar } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import UserProfileImage from './compoments/auth/userProfileImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { ToastContainer, toast } from 'react-toastify';
import { io } from "socket.io-client";
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

const MyForm = ({ currentUser }) => {
  const { register, handleSubmit } = useForm();
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("file", data.upload[0]);
      console.log("Data", data);
      const idToken = await auth.currentUser.getIdToken(true);
      console.log('Uploading...', formData);
      const response = await fetch("http://localhost:3000/upload", {
        method: 'POST', body: formData, headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      // Handle the server response
      if (response.ok) {
        console.log('Form data sent successfully!');
      } else {
        console.error('Failed to send form data to the server');
      }
    } catch (error) {
      console.error('Error sending form data:', error);
    }
  };

  function selectFile(e) {
    console.log("Button: ", e)
    const upload = document.getElementById('upload');
    upload.click();
  }

  const uploadField = register('upload', { required: true });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='border-2 bg-blue- border-blue-300 flex flex-row'>
      <div className='inline-block bg-blue-300 hover:bg-blue-700 duration-200 self-stretch flex' >
        <input type='button' className='btn' value={"Select File"} id='styled-file-selector' onClick={selectFile}></input>
      </div>
      <div style={{ width: 300 }} className='flex'>

        <span id='file-name' className='text-lg self-center px-2 text-truncate'>File... to upload</span>
      </div>

      <input
        type="file"
        id="upload"
        className='hidden'

        {...uploadField}
        onChange={(e) => {
          const fileName = document.getElementById('file-name');
          fileName.innerHTML = e.target.value.split('\\').at(-1);
          uploadField.onChange(e);
        }}
      />

      <div className='inline-block bg-blue-300 hover:bg-blue-700 duration-200 self-stretch flex '>

        <button type="submit" className='btn bg-blue-600 rounded-0 align'><FontAwesomeIcon icon={icon({ name: 'cloud-arrow-up' })}></FontAwesomeIcon></button>
      </div>
    </form>
  );
};



function App() {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const notify = (message) => toast(message);
  const notifyEvent = (event) => {
    switch (event.action) {
      case 'delete': {
        toast.warn(`${event.fileName} was just deleted!`);
        break;
      }

      case 'new': {

      }

      default: {
        toast.warn("Something weird happened");
      }
    }
  }
  useEffect(() => {


    console.log('bread')
  }, []);


  useEffect(() => {

    if (currentUser) {
      const newSocketConnction = io("ws://localhost:3000", {
        transports: ['websocket']
      });
      console.log("Listening for messages on channel: ", `event-${currentUser.uid}`);
      setSocket(newSocketConnction);
      newSocketConnction.on(`event-${currentUser.uid}`, (event) => {
        console.log("Uploaded a file");
        console.log("Event: ", event);
        notify("A file just got uploaded");
      });

      newSocketConnction.on(`test`, (message) => {
        notify(message);
        console.log("Test message recieved: ", message);
      })
    } else {
      if (socket)
        socket.disconnect();
    }


  }, [currentUser])

  return (
    <div className="App">
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#home">FolderJam</Navbar.Brand>
          <SignIn setCurrentUser={setCurrentUser} currentUser={currentUser} />
        </Container>
      </Navbar>
      <header className="App-header">
        {
          currentUser ?
            <UserProfileImage imgURL={currentUser.photoURL} />
            :
            ''
        }


        {
          currentUser ?
            <MyForm />
            :
            ''
        }
        <Button onClick={async () => {
          try {

            let response = await fetch("/test");
            let data = await response.text();
            console.log("Data: ", data);
          } catch (error) {
            console.log("Error happend", error);
          }
        }}>Test</Button>
        <Root currentUser={currentUser} />
      </header>
      <ToastContainer />
    </div>
  );
}



export default App;
