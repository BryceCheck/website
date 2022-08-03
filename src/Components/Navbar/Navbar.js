import { Container, Row, Col } from 'react-bootstrap';

function Navbar(props) {
  return (
      <div style={{position: 'absolute', top: '0', left: '0', width: '100vw'}}>
        <Container style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-around', maxHeight: '40px', color: 'white', backgroundColor: 'black'}} fluid>
          <Row style={{width: '100vw'}}>
            <Col sm='4' className='nav-col'><a className='nav-link' href='/'>Home</a></Col>
            <Col sm='4' className='nav-col'><a className='nav-link' href='/future'>Future</a></Col>
            <Col sm='4' className='nav-col'><a className='nav-link' href='/shop'>Shop</a></Col>
          </Row>
        </Container>
      </div>
      
  )
}

export default Navbar;