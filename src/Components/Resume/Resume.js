import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { Container, Row, Col } from 'react-bootstrap';

import Navbar from "../Navbar/Navbar";

import './Resume.css'

import tbcLogo from '../../Assets/tbc-logo.png';
import mynaricLogo from '../../Assets/mynaric-logo.jpeg';
import eclipticLogo from '../../Assets/ecliptic-logo.png';

function Resume(props) {

  return (
    <>
      <Navbar/>
      <div className="resume">
        <div className="resume-intro">
          <div>Bryce Check</div>
          <div className="resume-links-container">
            <a href="https://github.com/BryceCheck"><FontAwesomeIcon icon={faGithub} className='resume-github-icon'/></a>
            <a href="https://www.linkedin.com/in/bcheck/"><FontAwesomeIcon icon={faLinkedinIn} className='resume-linkedin-icon'/></a>
          </div>
        </div>
        <div className="resume-title">Technical Skills</div>
        <Container className='resume-skills'>
          <Row>
            <Col className='resume-skills-title' xs='4' md='1'>Languages</Col>
            <Col xs='8' md='11'>C/C++, Golang, Javascript, Python, HTML, CSS</Col>
          </Row>
          <Row>
            <Col className='resume-skills-title' xs='4' md='1'>Technologies</Col>
            <Col xs='8' md='11'>Vitis/Vivado, VPX, GDB, Make, Valgrind, React, Bootstrap, Redux, AutoSAR, SLAM, Path Planning, Search Algorithms</Col>
          </Row>
        </Container>
        <div className="resume-title">Experience</div>
        <Container className="resume-roles">
          <Row className="resume-item-title">
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <img src={tbcLogo} alt='The Boring Company' height='30px'/>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Software Engineer II</Col>
            <Col xs md='4' className='resume-item-title-date'>2022-Present</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li className="resume-item-responsibility">Created Payment and Ticketing system, found <a href='https://lvloop.com/tickets'>here</a></li>
            <li className="resume-item-responsibility">Completely rewrote mining software for tracking teams, consumables and machines. Decreased load times by 90%, increased response times up to 10x.</li>
            <li className="resume-item-responsibility">Created microservice architecture to break away from monorepos</li>
            <li className="resume-item-responsibility">Wrote regression tests for critical safety traffic control code to prevent regressions which could cause accidents</li>
            <li className="resume-item-responsibility">Worked in Golang, Javascript and some Python</li>
          </ul>
          <Row className="resume-item-title">
            <Col xs='3' md='1'className='resume-item-title-logo'>
              <img src={mynaricLogo} alt='Mynaric' height='30px'/>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Embedded SWE II</Col>
            <Col xs md='4' className='resume-item-title-date'>2021-2022</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li className="resume-item-responsibility">
              Rearchitected 2 product lines to have interoperable VPX electrical and mechanical standards and drew inspiration from AutoSAR for software
                <ul>
                  <li>Saved +$100K/month by freeing time of 4 testing engineers and 8 design engineers</li>
                  <li>Able to streamline inventory for purchasing and manufacturing teams</li>
                  <li>Increased modularity, collaboration, and portablility of dozens of components</li>
                </ul>
            </li>
            <li className="resume-item-responsibility">
              Co-led design of microcontroller, memory, communications, and power systems choices for Condor MK3 MEO
            </li>
            <li className="resume-item-responsibility">
              Optimized C Code to run on a 20 KHz control loop by using DMA and fixed-point math
            </li>
            <li>
              Wrote completely modular I2C, SPI, and RS-485 Services and Microcontroller Abstraction Layers
            </li>
            <li>
              Worked in Munich for 2 months
            </li>
          </ul>
          <Row className="resume-item-title">
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <img src={eclipticLogo} alt="Ecliptic Enterprises" height='30px'/>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Embedded SWE II</Col>
            <Col xs md='4' className='resume-item-title-date'>2020-2021</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li>Built I2C, UART, and SPI interfaces to communicate with  motors, cameras, sensors and SoC’s on a few major defense contractor’s satellites</li>
          </ul>
        </Container>
      </div>
    </>
  );

}

export default Resume;
