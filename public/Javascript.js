// Full JavaScript code with integrated functionality

let currentFacingMode = "environment";
let stream = null;
let extractedData = {};

// Elements
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const outputDiv = document.getElementById('outputAttributes');

// Start Camera
async function startCamera() {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: { facingMode: currentFacingMode, width: 1280, height: 720 },
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error("Camera error:", err);
    }
}

// Flip Camera
document.getElementById('flipButton').addEventListener('click', () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera();
});

// Capture Image and Process
document.getElementById('captureButton').addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Enhance the image for better OCR accuracy
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    preprocessImage(context, imageData);

    const imgDataURL = canvas.toDataURL("image/png");
    processImage(imgDataURL);
});

// Preprocess Image (Grayscale, Brightness)
function preprocessImage(context, imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11; // Grayscale
        data[i] = data[i + 1] = data[i + 2] = grayscale; // Apply grayscale
        data[i] = Math.min(data[i] * 1.2, 255); // Adjust brightness
    }
    context.putImageData(imageData, 0, 0);
}

// Process Image with Tesseract.js
async function processImage(imageDataURL) {
    try {
        outputDiv.innerHTML = "<p>Processing...</p>";

        const result = await Tesseract.recognize(imageDataURL, 'eng', {
            logger: m => console.log(m),
        });

        if (result && result.data.text) {
            console.log('Extracted Text:', result.data.text); // Debugging
            processTextToAttributes(result.data.text);
        } else {
            outputDiv.innerHTML = "<p>No text detected. Please try again.</p>";
        }
    } catch (error) {
        console.error("Tesseract.js Error:", error);
    }
}

// Map Extracted Text to Keywords
function processTextToAttributes(text) {
    const keywords = [
        "Product name", "Colour", "Motor type", "Frequency", "Gross weight", "Ratio",
        "Motor Frame", "Model", "Speed", "Quantity", "Voltage", "Material", "Type",
        "Horse power", "Consignee", "LOT", "Stage", "Outlet", "Serial number", "Head Size",
        "Delivery size", "Phase", "Size", "MRP", "Use before", "Height",
        "Maximum Discharge Flow", "Discharge Range", "Assembled by", "Manufacture date",
        "Company name", "Customer care number", "Seller Address", "Seller email", "GSTIN",
        "Total amount", "Payment status", "Payment method", "Invoice date", "Warranty", 
        "Brand", "Motor horsepower", "Power", "Motor phase", "Engine type", "Tank capacity",
        "Head", "Usage/Application", "Weight", "Volts", "Hertz", "Frame", "Mounting", "Toll free number",
        "Pipesize", "Manufacturer", "Office", "SR number", "RPM"
    ];

    const lines = text.split("\n").map(line => line.trim()).filter(line => line); // Split text into lines and clean it
    extractedData = {};
    const unmatchedLines = [];

    // Iterate through keywords and map lines containing them
    keywords.forEach(keyword => {
        for (let line of lines) {
            if (line.toLowerCase().includes(keyword.toLowerCase())) {
                const valueMatch = line.match(/[:\-]\s*(.*)/); // Extract value after ':' or '-'
                const value = valueMatch && valueMatch[1]?.trim() ? valueMatch[1].trim() : "-";
                if (value !== "-") {
                    extractedData[keyword] = value;
                }
                break;
            }
        }
    });

    // Identify lines that do not match any keyword
    lines.forEach(line => {
        if (!Object.values(extractedData).some(value => line.includes(value))) {
            unmatchedLines.push(line);
        }
    });

    // Store unmatched lines as "Other Specifications"
    extractedData["Other Specifications"] = unmatchedLines.length > 0 ? unmatchedLines.join(", ") : "None";
    displayData();
}

// Display Extracted Data
function displayData() {
    // Clear the existing output
    outputDiv.innerHTML = "";

    // Add a title for the extracted data section
    outputDiv.innerHTML += `<h3>Extracted Data</h3>`;

    // Loop through extracted data and display each key-value pair
    Object.entries(extractedData).forEach(([key, value]) => {
        if (value && value !== "-") {
            // Highlight important fields with proper styling
            outputDiv.innerHTML += `<p><strong>${key}:</strong> ${value}</p>`;
        }
    });

    // Check and display unmatched lines stored in "Other Specifications"
    if (extractedData["Other Specifications"] && extractedData["Other Specifications"] !== "None") {
        outputDiv.innerHTML += `<h4>Other Specifications:</h4>`;
        outputDiv.innerHTML += `<p>${extractedData["Other Specifications"]}</p>`;
    } else {
        outputDiv.innerHTML += `<h4>Other Specifications:</h4>`;
        outputDiv.innerHTML += `<p>No additional information found.</p>`;
    }
}

// Send Data to Salesforce
document.getElementById('sendToSalesforce').addEventListener('click', async () => {
    try {
        const response = await fetch('/send-to-salesforce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(extractedData),
        });

        const result = await response.json();
        if (result.success) {
            alert('Data successfully sent to Salesforce!');
        } else {
            alert('Failed to send data to Salesforce.');
        }
    } catch (error) {
        console.error('Error sending data to Salesforce:', error);
    }
});

// Start Camera on Load
startCamera();
