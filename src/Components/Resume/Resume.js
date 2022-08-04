import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { Modal, Container, Row, Col } from 'react-bootstrap';

import Navbar from "../Navbar/Navbar";

import './Resume.css'

import tbcLogo from '../../Assets/tbc-logo.png';
import mynaricLogo from '../../Assets/mynaric-logo.jpeg';
import eclipticLogo from '../../Assets/ecliptic-logo.png';
import beyondLogo from '../../Assets/beyond-logo.png';
import intelLogo from '../../Assets/intel-logo.png';
import uscLogo from '../../Assets/usc-logo.png';
import vcLogo from '../../Assets/vc-logo.png';

function getModalDimensions() {
  const sizeReducer   = 0.7;
  const hrztlReducer  = 0.5;
  const isHorizontal  = window.innerWidth >= window.innerHeight;
  const width  = window.innerWidth * sizeReducer;
  const height = isHorizontal ? window.innerHeight * sizeReducer : window.innerWidth * hrztlReducer;
  return {width, height};
}

function Resume(props) {

  const {width, height} = getModalDimensions();
  const [displayModal, setDisplayModal] = useState(false);
  const [modalWidth, setModalWidth] = useState(width);
  const [modalHeight, setModalHeight] = useState(height);

  const videoFrame = <iframe width={modalWidth} height={modalHeight} src="https://www.youtube.com/embed/bjM2W6R5yJo" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  const videoModal = <Modal show={displayModal} onHide={e => setDisplayModal(false)}>
    <Modal.Body>
      {videoFrame}
    </Modal.Body>
  </Modal>;

  const handleResize = useCallback(event => {
    const {width, height} = getModalDimensions();
    setModalWidth(width);
    setModalHeight(height);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

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
        <Container className='resume-skills'>
          <div className="resume-title">Technical Skills</div>
          <Row>
            <Col className='resume-skills-title' xs='4' md='1'>Languages</Col>
            <Col xs='8' md='11'>C/C++, Golang, Javascript, Python, HTML, CSS</Col>
          </Row>
          <Row>
            <Col className='resume-skills-title' xs='4' md='1'>Technologies</Col>
            <Col xs='8' md='11'>Vitis/Vivado, VPX, GDB, Make, Valgrind, React, Bootstrap, Redux, AutoSAR, SLAM, Path Planning, Search Algorithms</Col>
          </Row>
        </Container>
        <Container className="resume-roles">
          <div className="resume-title">Experience</div>
          <Row className="resume-item-title">
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <a href='https://boringcompany.com'><img src={tbcLogo} alt='The Boring Company' height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Software Engineer II</Col>
            <Col xs md='4' className='resume-item-title-date'>2022-Present</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li className="resume-item-responsibility">Created <a className='resume-body-link' href='https://lvloop.com/tickets'>Payment and Ticketing system</a></li>
            <ul>
              <li>Processes ~$5-10K/day with only one station and no faults</li>
              <li>Microservice architecture for security, emails, texts, payments, printing, and pricing. Some services are used in many other parts of the company codebase</li>
              <li>Golang, NodeJS, React, Redux, PostgreSQL, AWS, and LetsEncrypt used</li>
              <li>Beginning to breakdown into dockerized containers for easy management through kubernetes</li>
            </ul>
            <li className="resume-item-responsibility">Completely rewrote mining software for tracking teams, consumables and machines. Decreased load times by 90%, increased response times up to 10x.</li>
            <li className="resume-item-responsibility">Created microservice architecture to break away from monorepos</li>
            <li className="resume-item-responsibility">Wrote regression tests for critical safety traffic control code to prevent regressions which could cause accidents</li>
          </ul>
          <Row className="resume-item-title">
            <Col xs='3' md='1'className='resume-item-title-logo'>
              <a href='https://mynaric.com'><img src={mynaricLogo} alt='Mynaric' height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Embedded SWE II</Col>
            <Col xs md='4' className='resume-item-title-date'>2021-2022</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li className="resume-item-responsibility">Rearchitected 2 product lines to have interoperable VPX electrical and mechanical standards and drew inspiration from AutoSAR for software</li>
            <ul>
              <li>Saved +$100K/month by freeing time of 4 testing engineers and 8 design engineers</li>
              <li>Able to streamline inventory for purchasing and manufacturing teams</li>
              <li>Increased modularity, collaboration, and portablility of dozens of components</li>
            </ul>
            <li className="resume-item-responsibility">Co-led design of microcontroller, memory, communications, and power systems choices for <a className='resume-body-link' href='https://mynaric.com/products/space/condor-mk3/'>Condor MK3 MEO</a></li>
            <ul>
              <li>FRAM memory needed to store triple redundant boot images</li>
              <li>Radiation tolerance neeed to be able to handle outer Van Allen Belt radiation levels on Memory, FPGA and Microcontroller</li>
              <li>Optimized parts list for availability, lowest idle power draw, and footprint</li>
              <li>Decided on VPX backplane architecture with EE team for power and comms management</li>
            </ul>
            <li className="resume-item-responsibility">Optimized C Code to run on a 20 KHz control loop by using DMA and fixed-point math</li>
            <li>Wrote completely modular I2C, SPI, and RS-485 Services and Microcontroller Abstraction Layers</li>
            <li>Worked in Munich for 2 months</li>
          </ul>
          <Row className="resume-item-title">
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <a href='https://www.eclipticenterprises.com/'><img src={eclipticLogo} alt="Ecliptic Enterprises" height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Embedded SWE II</Col>
            <Col xs md='4' className='resume-item-title-date'>2020-2021</Col>
          </Row>
          <ul className="resume-item-responsibilities">
            <li>Worked with a major defense contractor to convert Matlab code to embedded C++ on <a className='resume-body-link' href='https://www.northropgrumman.com/wp-content/uploads/Approved-ePROCS-21-1321-FactSheet_PIRPL_28JUL2021_v6.pdf'>PIRPL</a></li>
            <ul>
              <li>Simulation was meeting control loop frequency requirements, but hardware was not</li>
              <li>Matlab code was double precision, but microcontroller in SoC was single precision</li>
              <li>Connected ARM processor to Double Precision Xilinx core by overriding ARM runtime double precision methods and using the core functionality</li>
            </ul>
            <li>Built I2C, RS485 UART, and SPI interfaces to communicate with  motors, cameras, sensors and SoC’s on a few major defense contractor’s satellites</li>
            <li>Worked on backplane communication architecture using Aurora Core from Xilinx between memory, controller, and peripheral boards</li>
          </ul>
          <Row className="resume-item-title">
            <Col xs='3' md='1' className="resume-item-title-logo">
              <a href='https://beyond.ai'><img src={beyondLogo} alt="Beyond Limits" height='22px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>Software Engineer II</Col>
            <Col xs md='4' className='resume-item-title-date'>2018-2020</Col>
          </Row>
          <ul className='resume-item-responsibilities'>
            <li>Led a $1.1M robotics project to completion under budget and on-time for 14 months</li>
            <ul>
              <li>Goal was to autonomously map and inspect oil and gas installations offshore for cracks and leaks, with the option of manual override</li>
              <li>Control interface was an XBox controller and a webpage which connected to an API server to interface with the ROS network</li>
              <li>Led all communication with customer, translated customer needs to engineering team, managed deadlines, schedules, scrum meetings, and resources</li>
              <li>Took a <a className="resume-body-link" href="https://www.eddyfi.com/en/product/magg-magnetic-inspection-robotic-crawler">COTS Robot</a> and equipped it with a Velodyne LIDAR, ultrasonic sensors, two cameras, inductive sensors controlled by NVIDIA Jetson board</li>
              <li>Built and tuned entire SLAM pipeline experimenting with different packages and ROS bags. Used Google Cartographer</li>
              <li>Developed dynamic path planning, obstacle avoidance and designed communication/control architecture</li>
              <li>Tested both in office and at <a className='resume-body-link' href='https://teex.org/about-us/disaster-city/'>Disaster City</a></li>
            </ul>
            <li>Led an intern project to take <a className='resume-body-link' href='https://www.robotis.us/turtlebot-3-burger-us/'>Turtle Bots</a> to autonmously map and then go to specific points on the map</li>
            <ul>
              <li>Control interface was a webpage that broadcast the map and locations of each robot</li>
              <li>Used out-of-box ROS SLAM package for swarm mapping</li>
              <li>Tested and needed to add ultrasonic sensors to avoid glass, reflective surfaces, and wires</li>
              <li>Coordinated efforts between ML team, web development team and robotics team</li>
            </ul>
          </ul>
          <Row className='resume-item-title'>
            <Col xs='3' md='1' className="resume-item-title-logo">
              <a href='https://intel.com'><img src={intelLogo} alt="Intel" height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>New Devices SWE Intern</Col>
            <Col xs md='4' className='resume-item-title-date'>2016-2017</Col>
          </Row>
          <ul className='resume-item-responsibilities'>
            <li>Took a gap year and worked in Santa Clara after my Junior year at USC</li>
            <li>Created complete testing, reporting, and data ingestion pipeline for <div onClick={e => setDisplayModal(true)} className='resume-body-link resume-body-div-link'>Swing IQ</div></li>
            <li>Travelled to San Diego, Seattle, Pullman, Chicago, IMG Academy, CES 2017, and East Stroudsberg University for live testing</li>
            <li>Won Commitment to Excellence Award for devotion to detail on testing data</li>
            <li>Ported Python data ingestion pipeline to C# for production apps</li>
          </ul>
          <div className='resume-title'>Education</div>
          <Row className='resume-item-title'>
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <a href='https://usc.edu'><img src={uscLogo} alt="USC" height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>BS CECS (EECS)</Col>
            <Col xs md='4' className='resume-item-title-date'>2015-2019</Col>
          </Row>
          <Row className='resume-item-title'>
            <Col xs='3' md='1' className='resume-item-title-logo'>
              <a href='https://venturacollege.edu'><img src={vcLogo} alt="Ventura College" height='30px'/></a>
            </Col>
            <Col xs='auto' md='7' className='resume-item-title-text'>AS EE</Col>
            <Col xs md='4' className='resume-item-title-date'>2012-2015</Col>
          </Row>
        </Container>
      </div>
      {videoModal}
    </>
  );
}

export default Resume;
