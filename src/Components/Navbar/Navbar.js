import { Container, Row, Col } from 'react-bootstrap';

import './Navbar.css'

function Navbar(props) {
  return (
      <div className='nav-bar'>
        <Container fluid>
          <Row>
            <Col><div className='nav-link-text'><a className='nav-bar-link' href='/'>Home</a></div></Col>
            <Col><div className='nav-link-text'><a className='nav-bar-link' href='/future'>Future</a></div></Col>
            <Col><div className='nav-link-text'><a className='nav-bar-link' href='/shop'>Shop</a></div></Col>
          </Row>
        </Container>
      </div>
  )
}

export default Navbar;
