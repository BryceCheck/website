import { useState, useEffect } from 'react';
import { useSelector, dispatch } from 'react-redux';
import { Container, Card, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useGetCurrentUser } from './Hooks';

import Navbar from '../Navbar/Navbar';

import './Profile.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const InputFields = {
  EMAIL: 'email',
  NUMBER: 'number',
  NAME: 'name',
  ROLE: 'role',
  SUBMIT: 'submit'
};

const RoleOptions = {
  ADMIN: 'Admin',
  USER: 'User'
}

const Profile = (props) => {

  const userInfo = useGetCurrentUser();
  const [inviteInfo, setInviteInfo] = useState({email: '', number: '', name: '', role: RoleOptions.USER});
  const [repRows, setRepRows] = useState([]);
  const [errors, setErrors] = useState({email: '', number: '', name: '', role: ''});
  const [showModal, setShowModal] = useState(false);

  const handleEmailChange = (e) => {
    handleStateChange(InputFields.EMAIL, e.target.value)
  }

  const handleNumberChange = (e) => {
    handleStateChange(InputFields.NUMBER, e.target.value);
  }

  const handleNameChange = (e) => {
    handleStateChange(InputFields.NAME, e.target.value)
  }

  const handleStateChange = (key, val) => {
    setInviteInfo(inviteInfo => ({
      ...inviteInfo,
      [`${key}`]: val
    }));
  }

  const handleErrorsChange = (role, val) => {
    var newErrors = errors;
    newErrors[role] = val;
    setErrors(newErrors);
  }

  const handleSendInvite = (e) => {
    console.log('Sending invite');
    var emptyFieldExists = false;
    // Make sure that all the data is there
    for (const [key, val] of Object.entries(errors)) if (val !== '') return;
    for (const [key, val] of Object.entries(inviteInfo)) {
      if (val === '') {
        console.log(`${key} is empty`);
        emptyFieldExists = true;
        handleErrorsChange(key, `No data entered for new user's ${key}`);
      }
    }
    if(emptyFieldExists) return;
    // post to the /users endpoint to create a user
    axios.post('/user', inviteInfo)
    // handle the response or errors
    .then(
      _ => {
        console.log('Successfully created user!');
        setShowModal(false);
        setInviteInfo({email: '', number: '', name: '', role: RoleOptions.USER});
        setErrors({email: '', number: '', name: '', role: ''});
      },
      err => {
        console.error(`Error while creating user: ${err}`);
        handleErrorsChange(InputFields.SUBMIT, 'Error while inviting new user. Please try again later');
      }
    )
  }

  // Get all of the users in the org on mount
  useEffect(() => {
    axios.get('/reps').then(
      res => {
        console.log(res.data);
        // Transform the json array of reps into table rows
        setRepRows(res.data.reps.map(rep => {
          // Make sure to only list the members who aren't logged in
          return <tr>
            <td>{rep.name}</td>
            <td>{rep.email}</td>
            <td>{rep.role}</td>
          </tr>;
        }))
      },  
      err => console.error('Error while getting org reps:', err)
    );
  }, [userInfo]);

  return (<>
    <Navbar/>
    <Container className='profile-container'>
      <Card>
        <Card.Header className='text-center'>
          <h2>Hello, {userInfo.firstName ? userInfo.firstName : userInfo.name}!</h2>
        </Card.Header>
        <Card.Body className='text-center'>
          <div className='profile-body-container text-center'>
            <img src='/fetchItLogo.png' alt='Profile Picture' className='profile-pic'/>
            <table className='profile-attribute-table'>
              <tr>
                <td className='individual-attribute bold'>Email</td><td className='individual-attribute'>{userInfo.email}</td>
              </tr>
              <tr>
                <td className='individual-attribute bold'>Role</td><td className='individual-attribute'>{userInfo.role}</td>
              </tr>
              <tr>
                <td className='individual-attribute bold'>Org</td><td className='individual-attribute'>{userInfo.org}</td>
              </tr>
            </table>
            { userInfo.role === RoleOptions.ADMIN
              ? <div className='table-break'>
                  <button onClick={() => setShowModal(true)} className="invite-button">Invite User</button>
                </div>
              : <></>
            }            
            <Table striped hover fixed>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {repRows}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
      <Modal.Header style={{justifyContent: 'center'}}>
        <h1>New User Input Form</h1>
      </Modal.Header>
      <Modal.Body style={{justifyContent: 'center'}}>
        <table className='centered-table'>
          <tr>
            <td className='individual-attribute bold'>Email</td>
            <td className='individual-attriubte'><input type='email' value={inviteInfo.email} onChange={handleEmailChange}/></td>
          </tr>
          <tr>
            <td className='individual-attribute bold'>Phone Number</td>
            <td className='individual-attriubte'><input value={inviteInfo.number} onChange={handleNumberChange}/></td>
          </tr>
          <tr>
            <td className='individual-attribute bold'>Name</td>
            <td className='individual-attriubte'><input value={inviteInfo.name} onChange={handleNameChange}/></td>
          </tr>
          <tr>
            <td className='individual-attribute bold'>Role</td>
            <td className='individual-attriubte'>
              <select value={inviteInfo.role} onChange={(e) => handleStateChange(InputFields.ROLE, e.target.value)}>
                <option>Admin</option>
                <option>User</option>
              </select>
            </td>
          </tr>
        </table>
      </Modal.Body>
      <Modal.Footer style={{justifyContent: 'center'}}>
        <button className='invite-button' onClick={handleSendInvite}>Send Invite</button>
      </Modal.Footer>
    </Modal>
  </>);
}

export default Profile;