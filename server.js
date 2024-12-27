const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // To call Salesforce REST API

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the "public" folder

// Salesforce Configuration
const salesforceConfig = {
    instanceUrl: 'https://test.salesforce.com',
    username: 'sairamtelagamsetti@sathkrutha.sandbox',
    password: 'Sairam12345@',
    securityToken: 'ZYaDg3Smv8Iw6PiiCW1e2Wlf',
    objectApi: 'SETA_product_details__c', // Object API
};

// Salesforce Login to Retrieve Access Token
let accessToken = '';

async function authenticateWithSalesforce() {
    try {
        const loginResponse = await axios.post(
            `${salesforceConfig.instanceUrl}/services/oauth2/token`,
            new URLSearchParams({
                grant_type: 'Sairam12345@ZYaDg3Smv8Iw6PiiCW1e2Wlf',
                client_id: '3MVG9k02hQhyUgQC_fDqr_qE5AtXfgKI7BfQyPxMdt4cmExwbRlrAX.kNJvotnqSbiYQtUGWI7spX8Cpg4M6e', // Replace with your Salesforce connected app client ID
                client_secret: 'C5FC108C1EFCC47FC81B3CAB2E0881F6CD11DB368CDE391749E3A261E5DFEF6D', // Replace with your Salesforce connected app client secret
                username: salesforceConfig.username,
                password: `${salesforceConfig.password}${salesforceConfig.securityToken}`,
            })
        );

        accessToken = loginResponse.data.access_token;
        console.log('Salesforce authentication successful.');
    } catch (error) {
        console.error('Salesforce authentication failed:', error.response.data);
        throw new Error('Unable to authenticate with Salesforce.');
    }
}

// Endpoint to receive data from the frontend
app.post('/send-to-salesforce', async (req, res) => {
    if (!accessToken) {
        await authenticateWithSalesforce();
    }

    try {
        const extractedData = req.body;

        // Map extracted data to Salesforce fields
        const salesforceData = {
            Brand__c: extractedData["Brand"] || null,
            Colour__c: extractedData["Colour"] || null,
            Company_name__c: extractedData["Company name"] || null,
            Customer_care_number__c: extractedData["Customer care number"] || null,
            Frequency__c: extractedData["Frequency"] || null,
            Gross_weight__c: extractedData["Gross weight"] || null,
            GSTIN__c: extractedData["GSTIN"] || null,
            Head_Size__c: extractedData["Head Size"] || null,
            Height__c: extractedData["Height"] || null,
            Horse_power__c: extractedData["Horse power"] || null,
            Manufacture_date__c: extractedData["Manufacture date"] || null,
            Material__c: extractedData["Material"] || null,
            Model__c: extractedData["Model"] || null,
            Motor_Frame__c: extractedData["Motor Frame"] || null,
            Motor_Type__c: extractedData["Motor type"] || null,
            MRP__c: extractedData["MRP"] || null,
            Other_Specifications__c: extractedData["Other Specifications"] || null,
            Phase__c: extractedData["Phase"] || null,
            Product_Name__c: extractedData["Product name"] || null,
            Quantity__c: extractedData["Quantity"] || null,
            Ratio__c: extractedData["Ratio"] || null,
            Seller_Address__c: extractedData["Seller Address"] || null,
            Stage__c: extractedData["Stage"] || null,
            Total_amount__c: extractedData["Total amount"] || null,
            Usage_Application__c: extractedData["Usage/Application"] || null,
            Voltage__c: extractedData["Voltage"] || null,
        };

        // Push data to Salesforce
        const response = await axios.post(
            `${salesforceConfig.instanceUrl}/services/data/vXX.X/sobjects/${salesforceConfig.objectApi}`,
            salesforceData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ success: true, message: 'Data stored in Salesforce!', response: response.data });
    } catch (error) {
        console.error('Error saving to Salesforce:', error.response.data || error);
        res.status(500).json({ success: false, message: 'Failed to store data', error });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await authenticateWithSalesforce(); // Authenticate on server startup
});
