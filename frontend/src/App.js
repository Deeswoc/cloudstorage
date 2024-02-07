import './App.css';
import './style/output.css'
import { useForm } from 'react-hook-form';
import Root from './compoments/root';
import SignIn from './compoments/auth/signIn';
import { auth } from './firebase'
import { Button, Col, Container, Nav, NavDropdown, Navbar, ProgressBar, Row } from 'react-bootstrap';
import { useEffect, useRef, useState } from 'react';
import UserProfileImage from './compoments/auth/userProfileImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { ToastContainer, toast } from 'react-toastify';
import { io } from "socket.io-client";
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';
import './layout.css';
import BigNumber from "bignumber.js";
import Cookies from 'js-cookie'
import UsageBar from './compoments/storage/usageBar';
import HomePage from './HomePage';
// import { ProgressBar } from 'react-toastify/dist/components';
const MyForm = ({ currentUser }) => {
  const { register, handleSubmit } = useForm();
  const toastId = useRef(null);
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("file", data.upload[0]);
      const req = new XMLHttpRequest();
      req.open('POST', "api/files/upload");

      req.upload.addEventListener('progress', function (e) {
        const progress = (e.loaded / e.total);
        if (toastId.current === null) {
          toastId.current = toast('Upload in Progress', { progress, });
        } else {
          toast.update(toastId.current, { progress })
        }
      })

      req.onload = function () {
        if (req.status === 507) {
          toast.warn("Out of Storage!");
          toast.dismiss(toastId.current);
          toastId.current = null;
        }
      }

      req.addEventListener('readystatechange', function (e) {
        if (this.readyState === 4) {
          toast.dismiss(toastId.current);
          toastId.current = null;
        }
      })

      req.send(formData);
    } catch (error) {
      console.error('Error sending form data:', error);
    }
  };

  function selectFile(e) {
    const upload = document.getElementById('upload');
    upload.click();
  }

  const uploadField = register('upload', { required: true });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='px-2'>
      <div className='border-2 bg-blue- border-blue-300 flex flex-row'>
        <div className='inline-block bg-blue-300 hover:bg-blue-700 duration-200 self-stretch flex' >
          <input type='button' className='btn' value={"Select File"} id='styled-file-selector' onClick={selectFile}></input>
        </div>
        <div className='flex w-100 text-truncate'>
          <span id='file-name' className='text-lg self-center px-2 text-truncate'>File to upload</span>
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
      </div>

    </form>
  );
};



function App() {
  const [socket, setSocket] = useState(null);
  const [spaceUsed, setSpaceUsed] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [files, setFiles] = useState([]);
  const filesRef = useRef();
  const notify = (message) => toast.dark(message, { toastId: 34 });

  function reallocateSpace(freedSpace) {
    setSpaceUsed(BigNumber(spaceUsed).minus(BigNumber(freedSpace)));
  }

  filesRef.current = files;
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
    (async function () {
      const isSignedIn = Cookies.get('signed_in');
      if (isSignedIn) {
        try {
          const res = await fetch("api/profile/info");
          const user = await res.json();
          setCurrentUser(user);
          setSpaceUsed(user.used_space);
        } catch (err) {
          console.log("Error");
        }
      }
    })()
  }, []);

  function addFile(newFile) {
    setSpaceUsed(BigNumber(currentUser.used_space).plus(BigNumber(newFile.size)));
    setFiles([...filesRef.current, newFile]);
  }

  useEffect(() => {
    if (currentUser) {
      const newSocketConnction = io("ws://localhost:3000/notfications", {
        transports: ['websocket']
      });
      console.log("Listening for messages on channel: ", `event-${currentUser.uid}`);
      setSocket(newSocketConnction);
      newSocketConnction.on(`event-${currentUser.uid}`, (event) => {
        console.log("Files: ", files);
        if (event.type === 'file' && event.action === 'new') {
          addFile(event.file);
        }
        notify("A file just got uploaded");
      });

    } else {
      if (socket)
        socket.disconnect();
    }


  }, [currentUser])

  return (
    <div className="App">
      <header className="App-header">
        <Navbar expand="lg" className="bg-body-tertiary">
          <Container>
            <Navbar.Brand href="#home">FolderJam</Navbar.Brand>
            <SignIn setCurrentUser={setCurrentUser} currentUser={currentUser} />
          </Container>
        </Navbar>
      </header>
      <main className={`grid ${currentUser ? 'default' : 'welcome flex flex-column items-center align-center content-center'}`} id='layout'>
        {
          currentUser ?
            <>
              <Sidebar currentUser={currentUser} spaceUsed={spaceUsed} />
              <Root currentUser={currentUser} files={files} setFiles={setFiles} reallocateSpace={reallocateSpace} />
            </>
            :
            <HomePage />
        }
      </main>
      <ToastContainer />
    </div>
  );
}

function Sidebar({ currentUser, spaceUsed }) {
  return (
    <div id='sidebar' className='bg-slate-400' style={{ paddingTop: 105 }}>
      {
        currentUser ?
          <div className='flex flex-row justify-center'>
            <UserProfileImage imgURL={currentUser.profile_photo} />
          </div>
          : ''
      }

      {
        currentUser ?
          <>
            <hr />
            <MyForm />
          </>
          :
          ''
      }

      <hr />

      <div className='px-2'>
        {
          currentUser ?
            <UsageBar spaceUsed={spaceUsed} totalSpace={currentUser.tier.space_allotted} />
            : ''
        }
      </div>
    </div>
  )
}

export default App;
