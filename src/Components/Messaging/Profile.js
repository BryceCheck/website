import { useState, useEffect } from 'react';
import { useSelector, dispatch } from 'react-redux';
import { Container, Card, Table } from 'react-bootstrap';
import axios from 'axios';
import { useGetCurrentUser } from './Hooks';

import Navbar from '../Navbar/Navbar';

import './Profile.css';


const Profile = (props) => {

  const userInfo = useGetCurrentUser();
  const [repRows, setRepRows] = useState([]);

  // Get all of the users in the org on mount
  useEffect(() => {
    axios.get('/reps').then(
      res => {
        console.log(res.data);
        // Transform the json array of reps into table rows
        setRepRows(res.data.reps.map(rep => {
          // Make sure to only list the members who aren't logged in
          console.log(rep.email, userInfo.id);
          if (rep.email === userInfo.id) return;
          return <tr>
            <td>{rep.name}</td>
            <td>{rep.email}</td>
            <td>{rep.role}</td>
          </tr>;
        }))
      },  
      err => console.error('Error while getting org reps:', err)
    );
  }, [userInfo])

  return (<>
    <Navbar/>
    <Container className='profile-container'>
      <Card>
        <Card.Header className='text-center'>
          <h2>Hello, {userInfo.firstName}!</h2>
        </Card.Header>
        <Card.Body className='text-center'>
          <div className='profile-body-container text-center'>
            <img src='https://brycecheck.com/assets/fetchItLogo.png' alt='Profile Picture' className='profile-pic'/>
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
        <Card.Footer>

        </Card.Footer>
      </Card>
    </Container>
  </>);
}

export default Profile;