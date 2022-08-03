import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "../Navbar/Navbar";

const upIcon = <FontAwesomeIcon icon={['fas', 'circle-chevron-up']}/>;
const downIcon = <FontAwesomeIcon icon={['fas', 'circle-chevron-down']}/>;

function Resume(props) {
  return (
    <>
      <Navbar/>
      <div className="resume">
        <div className="resume-intro">
          <FontAwesomeIcon icon={['fa-brands', 'fa-linked-in']}/>
          <h1>Bryce Check</h1>
          <FontAwesomeIcon icon={['fa-brands', 'fa-github']}/>
        </div>
        <div className="resume-skill-list">
          <div className="resume-skill">
            <div>Languages</div>
            <div>C/C++, Golang, Javascript, Python, HTML, CSS</div>
          </div>
          <div className="resume-skill">
            <div>Technologies</div>
            <div>Vitis/Vivado, GDB, Make, Valgrind, React, Bootstrap, Redux, AutoSAR, SLAM, Path Planning, Search Algorithms</div>
          </div>
        </div>
        <ul className="resume-roles">
          <li className="resume-item">
            <div className="resume-item-header">
              <div className="resume-item-title">
                <div>The Boring Company |</div>
                <div>Software Engineer II</div>
              </div>
              <div>2022-Present</div>
            </div>
            <ul className="resume-item-responsibilities">
              <li className="resume-item-responsibility">Created Payment and Ticketing system which can be found <a href='https://lvloop.com/tickets'>here</a></li>
              <li className="resume-item-responsibility">Completely rewrote mining activity logging software for tracking teams, consumables and machines. Increased load times by 90%, increased response times by 10x in some cases.</li>
              <li className="resume-item-responsibility">Created microservice architecture to break away from monorepos</li>
              <li className="resume-item-responsibility">Wrote regression tests for critical safety traffic control code to prevent regressions which could cause accidents</li>
              <li className="resume-item-responsibility">Worked in Golang, Javascript and some Python</li>
              <li></li>
            </ul>
          </li>
        </ul>
      </div>
    </>
  );

}

export default Resume;
