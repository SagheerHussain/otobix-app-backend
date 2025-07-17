const axios = require('axios');
require('dotenv').config();

const headers = {
    'Content-Type': 'application/json',
    'x-auth-key': process.env.PERFIOS_AUTH_KEY
};

const BASE_URL = process.env.PERFIOS_BASE_URL;

exports.sendOtp = async (mobile, caseId) => {
    const payload = {
        mobile,
        consent: "y",
        clientData: { caseId }
    };

    const { data } = await axios.post(`${BASE_URL}/otp`, payload, { headers });
    return data;
};

exports.verifyOtp = async (requestId, otp, caseId) => {
    const payload = {
        request_id: requestId,
        otp,
        clientData: { caseId }
    };

    const { data } = await axios.post(`${BASE_URL}/status`, payload, { headers });
    return data;
};

exports.fetchDetails = async (requestId, caseId) => {
    const payload = {
        request_id: requestId,
        clientData: { caseId }
    };

    const { data } = await axios.post(`${BASE_URL}/details`, payload, { headers });
    return data;
};
