import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Navbar from '../Navbar/Navbar';

import './TextItHome.css';

const TextItHome = (props) => {
  return <>
    <Navbar/>
    <Container fluid classname='homepage-container'>
      <div className='homepage-content'>
        <img src='/fetchItLogo.png' alt='Fetch It!' width='50%'></img>
        <div className='homepage-text'>Text It is here to make it easier then ever to get in touch with your customers!</div>
      </div>
    </Container>
  </>;
}

export default TextItHome;