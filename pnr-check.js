const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PNR_NUMBER = '8347553443';

// 📧 Email function
async function sendEmail(status) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'akashbhade333@gmail.com',
      pass: 'pdiiklugosbytnuq' // ⚠️ use new one
    }
  });

  await transporter.sendMail({
    from: 'akashbhade333@gmail.com',
    to: 'akashbhade333@gmail.com',
    subject: 'PNR Status Update',
    text: `PNR Status: ${status}`
  });

  console.log("📧 Email sent!");
}

// 🌐 API call
async function getPNRStatus(pnr) {
  try {
    const response = await axios.get(
      `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/8347553443`,
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
    return response.data.data.passengerList[0].currentStatusDetails;

  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
  }
}

(async () => {
  console.log("Fetching PNR status from API...");

  const status = await getPNRStatus(PNR_NUMBER);

  console.log("Current Status:", status);

  let lastStatus = "";

  // read previous status
  if (fs.existsSync('status.json')) {
    const data = JSON.parse(fs.readFileSync('status.json'));
    lastStatus = data.status;
  }

  console.log("Last Status:", lastStatus);

  if (status && status !== lastStatus) {
    console.log("Status changed → sending email");

    await sendEmail(status);

    // update file
    fs.writeFileSync('status.json', JSON.stringify({ status }));

  } else {
    console.log("No change → no email");
  }
})();


