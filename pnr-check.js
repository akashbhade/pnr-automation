const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const config = JSON.parse(fs.readFileSync('config.json'));
const PNR_NUMBER = config.pnr;

// 📧 Email function
async function sendEmail(status, pnrData = {}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `🚆 PNR Status Update - ${pnrData.pnrNumber || PNR_NUMBER}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background:#f4f6f8;">
        <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:10px;">
          
          <h2 style="color:#2c3e50;">🚆 PNR Status Update</h2>

          <p style="font-size:16px;">
            <b>Status:</b> 
            <span style="color:${status === 'CONFIRMED' ? 'green' : 'orange'}; font-weight:bold;">
              ${status}
            </span>
          </p>

          <hr/>

          <h3>🚆 Train Details</h3>

<table style="width:100%; border-collapse: collapse;">
  <tr>
    <td><b>PNR Number</b></td>
    <td>${pnrData.pnrNumber}</td>
  </tr>

  <tr>
    <td><b>Train</b></td>
    <td>${pnrData.trainNumber} - ${pnrData.trainName}</td>
  </tr>

  <tr>
    <td><b>Journey Date</b></td>
    <td>${pnrData.dateOfJourney}</td>
  </tr>

  <tr>
    <td><b>From → To</b></td>
    <td>${pnrData.sourceStation} → ${pnrData.destinationStation}</td>
  </tr>

  <tr>
    <td><b>Boarding Point</b></td>
    <td>${pnrData.boardingPoint}</td>
  </tr>

  <tr>
    <td><b>Reservation Upto</b></td>
    <td>${pnrData.reservationUpto}</td>
  </tr>

  <tr>
    <td><b>Class</b></td>
    <td>${pnrData.journeyClass}</td>
  </tr>

  <tr>
    <td><b>Passengers</b></td>
    <td>${pnrData.passengerCount}</td>
  </tr>

  <tr>
    <td><b>Chart Status</b></td>
    <td>${pnrData.chartStatus}</td>
  </tr>
</table>
          <hr/>

          <p style="font-size:12px;color:gray;">
            Auto-generated PNR tracking alert
          </p>

        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  console.log("📧 Beautiful email sent!");
}

// 🌐 API call
async function getPNRStatus(pnr) {
  try {
    const response = await axios.get(
      `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${pnr}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'irctc-indian-railway-pnr-status.p.rapidapi.com',
          'x-rapidapi-key': '0247996fc4msh40a645f8ac3efd6p1abe62jsna906063308d8'
        }
      }
    );

    console.log("Full response:", JSON.stringify(response.data, null, 2));

    // adjust based on actual response
    return {
  status: response.data.data.passengerList?.[0]?.currentStatusDetails || "N/A",

  pnrNumber: response.data.data.pnrNumber,
  trainNumber: response.data.data.trainNumber,
  trainName: response.data.data.trainName,
  dateOfJourney: response.data.data.dateOfJourney,
  sourceStation: response.data.data.sourceStation,
  destinationStation: response.data.data.destinationStation,
  boardingPoint: response.data.data.boardingPoint,
  reservationUpto: response.data.data.reservationUpto,
  journeyClass: response.data.data.journeyClass,
  chartStatus: response.data.data.chartStatus,
  passengerCount: response.data.data.numberOfpassenger
};

  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
  }
}

(async () => {
  console.log("Fetching PNR status from API...");

  const data = await getPNRStatus(PNR_NUMBER);
  const status = data.status;

  console.log("Current Status:", status);

  let lastStatus = "";

  // read previous status
  if (fs.existsSync('status.json')) {
    const data = JSON.parse(fs.readFileSync('status.json'));
    lastStatus = data.status;
  }

  console.log("Last Status:", lastStatus);

  if (data.status && data.status !== lastStatus) {
  console.log("Status changed → sending email");

  await sendEmail(data.status, data);

  fs.writeFileSync('status.json', JSON.stringify({ status: data.status }));
  } else {
    console.log("No change → no email");
  }
})();


