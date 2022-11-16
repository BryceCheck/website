import { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import Navbar from '../Navbar/Navbar';
import { DateTime } from 'luxon';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

import './Reports.css'

// Register all plugins with ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const CALLS_PER_DAY = 'Average Calls Per Day';
const CALLS_PER_HOUR = 'Average Calls Per Hour';
const RECEPTIONIST_CALLS = 'Receptionist Call Counts';

const generateReceptionistReport = (dat, setReport) => {

}

const generateHourReport = (data, setReport) => {

}

const generateDayReport = (data, setReport) => {
  // Create an array of dictionaries to store the calls per day of different days
  const daysArray = [];
  const avgArray = [];
  for(var i = 1; i <= 7; i++) {
    daysArray.push({});
  }
  // Divide data based upon day
  for(var i = 0; i < data.length; i++) {
    const entry = data[i];
    const start = DateTime.fromISO(entry.StartTime)
    if(daysArray[start.weekday - 1].hasOwnProperty(start.toISODate())) {
      daysArray[start.weekday - 1][start.toISODate()] += 1;
    } else {
      daysArray[start.weekday - 1][start.toISODate()] = 1;
    }
  }
  // Find averages per weekday
  for(var i = 0; i < 7; i++) {
    const vals = Object.values(daysArray[i]);
    const sum = vals.reduce((prev, curr) => prev + curr);
    const samples = vals.length;
    avgArray.push(sum/samples);
  }
  // Create the chart based upon the processed Data
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Avg. Calls Per Weekday'
      }
    },
    maintainAspectRatio: false
  }
  const chartData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Avg. Calls',
        data: avgArray,
        backgroundColor: 'cornflowerblue'
      }
    ]
  }
  console.log(options);
  setReport(<Bar options={options} data={chartData} height={600} width={900}/>);
}

const handleReportGeneration = (reportType, startDate, endDate, setErrorMsg, setReport) => {
  // Make sure required data is there
  if(!startDate) {
    return setErrorMsg('Please enter a start date');
  }
  if(!reportType) {
    return setErrorMsg('Please enter a report type');
  }
  // Choose the type of report
  var query='?';
  if(reportType === CALLS_PER_DAY) {
    query += `type=day`;
  } else if(reportType === CALLS_PER_HOUR) {
    query += `type=hour`;
  } else if(reportType === RECEPTIONIST_CALLS) {
    query += `type=receptionist`
  }
  // add in the date filters
  query += `&start=${startDate}`;
  if(endDate) {
    query += `&end=${endDate}`;
  }
  // Make the request
  axios.get(`/get-report${query}`)
  .then(
    res => {
      if (reportType === CALLS_PER_DAY) {
        generateDayReport(res.data, setReport);
      }
    },
    err => {
      console.error(`Error while getting report data from servers: ${err}`);
      setErrorMsg(`Could not generate reports. Please try again later`);
    }
  );
}

const Reports = (props) => {
  
  const [report, setReport] = useState(<></>);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState(CALLS_PER_DAY);
  const [errorMsg, setErrorMsg] = useState('');

  return (
    <>
      <Navbar/>
      <Container fluid className='reports-container'>
        <div className='report-search-params-container'>
          <h1 className='report-title spaced'>Report Settings</h1>
          <select className='spaced' value={reportType} onChange={e =>setReportType(e.target.value)}>
            <option>Average Calls Per Day</option>
            <option>Average Calls Per Hour</option>
            <option>Receptionist Call Counts</option>
          </select>
          <div className='date-container spaced'>
            <input className='date-input h-spaced' type='date' value={startDate} onChange={e => setStartDate(e.target.value)}/>
            <input className='date-input h-spaced' type='date' value={endDate} onChange={e => setEndDate(e.target.value)}/>
          </div>
          <button className='report-button spaced' onClick={_ => handleReportGeneration(reportType, startDate, endDate, setErrorMsg, setReport)}>
            Generate Report
          </button>
        </div>
        <div className='error-msg'>{errorMsg}</div>
        <div className='report-container'>
          {report}
        </div>
      </Container>
    </>
  )
}

export default Reports;