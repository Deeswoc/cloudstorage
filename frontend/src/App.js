import logo from './logo.svg';
import './App.css';

import { useForm } from 'react-hook-form';

const MyForm = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    try {
      alert("Sending form data")
      // Send the form data to the server
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="upload">Field Name:</label>
      <input
        type="file"
        id="upload"
        name="upload"
        {...register('upload')}
      />

      <button type="submit">Submit</button>
    </form>
  );
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <MyForm></MyForm>
      </header>
    </div>
  );
}

export default App;
