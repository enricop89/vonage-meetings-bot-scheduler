// Write a nodeJS server with express that exposes the following API endpoints:
// POST /meetings/create - creates a new meeting and should accepts
// type: instant or long_term.
// expires_at - the time the meeting expires
// recording_options - the recording options for the meeting
// ui_settings is an object with the following properties: language:
// and returns the links _links: guest_url and host_url
// the external service to call is https://api-eu.vonage.com/beta/meetings/rooms

// Write the code
// You can use any npm package you want

const express = require("express");
const fs = require("fs");
const path = require("path");
const Vonage = require("@vonage/server-sdk");
const bodyParser = require("body-parser");
const { tokenGenerate } = require("@vonage/jwt");

const app = express();
app.use(bodyParser.json());
// add dot env to the project
require("dotenv").config();

function generateJwt() {
  const privateKey = fs.readFileSync(
    path.join(__dirname, process.env.PRIVATE_KEY)
  );
  const applicationId = process.env.APPLICATION_ID;
  const jwtToken = tokenGenerate(applicationId, privateKey);

  return jwtToken;
}

// Endpoint to create a new meeting
app.post("/meetings", (req, res) => {
  // Parse the type of meeting, expires_at, recording_options and ui_settings from the request body
  const { type, expires_at, recording_options, ui_settings, display_name } =
    req.body;
  const jwt = generateJwt();
  const url = "https://api-eu.vonage.com/beta/meetings/rooms";
  // create an object to store the request body
  const toSend = {
    type,
    expires_at: new Date(expires_at).toISOString(),
    recording_options: { auto_record: Boolean(recording_options) },
    ui_settings,
    display_name,
  };
  console.log("toSend", toSend);

  // if type is instant, remove expires_at from the request body
  if (type === "instant") {
    delete toSend.expires_at;
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(toSend),
  };
  // call the API
  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => {
      console.log("Meeting Created", data);
      // check if links are present in the response
      if (!data._links) {
        return res.status(500).json({ error: "Failed to create meeting" });
      }
      // return the guest_url and host_url
      res.status(200).json({
        guest_url: data._links.guest_url.href,
        host_url: data._links.host_url.href,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Failed to create meeting" });
    });
});

// can you create three endpoints to listen the following webhooks: rooms, sessions , recordings
// and print the payload to the console
app.post("/webhooks/rooms", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Webhook received" });
});
app.post("/webhooks/sessions", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Webhook received" });
});
app.post("/webhooks/recordings", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "Webhook received" });
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
