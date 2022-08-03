import { Container, Row, Col } from 'react-bootstrap';

function NavbarItem(props) {
  return (
    <Col>
      <a href={props.link} className='navitem' style={{...props.style}}>
        {props.text}
      </a>
    </Col>
  );
}

function Navbar(props) {
  return (
      <div style={{position: 'absolute', top: '0', left: '0', width: '100vw'}}>
        <Container style={{display: 'flex', justifyContent: 'space-around', maxHeight: '40px', color: 'white', backgroundColor: 'black'}} fluid>
          <Row>
            <NavbarItem link='/' text='Home' style={{}}/>
            <NavbarItem link='/future' text='Future' style={{}}/>
            <NavbarItem link='/shop' text='Shop' style={{}}/>
          </Row>
        </Container>
      </div>
      
  )
}

export default Navbar;