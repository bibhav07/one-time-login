require("dotenv").config();
var mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/otp-login");

const express = require('express');
const app = express();
app.use(express.static('public'));

const userRoute = require('./routes/userRoute');
app.use('/api', userRoute);

const port = process.env.SERVER_PORT | 3000;
app.listen(port, () => {
    console.log(`Authorization Server running on ${port}...`);
});