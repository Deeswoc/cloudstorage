import logo from './logo.svg';
import './App.css';
import './style/output.css'
import { useForm } from 'react-hook-form';
import Root from './compoments/root';
import "bootstrap/dist/css/bootstrap.min.css"
import SignIn from './compoments/auth/signIn';
import { auth } from './firebase'
import { Container, Nav, NavDropdown, Navbar } from 'react-bootstrap';
import { useState } from 'react';
import UserProfileImage from './compoments/auth/userProfileImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'


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

  function updateName(e) {
    const fileNameDis = document.getElementById('file-name');

    fileNameDis.innerHTML = e.target.value.split('\\').at(-1);
  }

  const FileController = ({ control, register, name, rules }) => {

  }

  const uploadField = register('upload', {required: true});

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
        onChange={(e)=>{
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
  const [currentUser, setCurrentUser] = useState(null);

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

        <Root currentUser={currentUser} />
      </header>
    </div>
  );
}



export default App;
