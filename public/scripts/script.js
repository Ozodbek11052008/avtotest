
const API_URL = "https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action";
const API_KEY = "tmsbgsfi"; // Replace with your API key
const DATA_SOURCE = "Cluster0"; // Replace with your cluster name
const DATABASE = "AVTOTEST"; // Replace with your database name
const COLLECTION = "USERS"; // Replace with your collection name

// Admin credentials (hardcoded for simplicity)
const adminCredentials = {
    username: 'admin',
    password: 'admin123', // Insecure: Do not hardcode passwords in production
};

// Function to make API requests
async function makeApiRequest(action, body) {
    const response = await fetch(`${API_URL}/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": API_KEY,
        },
        body: JSON.stringify({
            dataSource: DATA_SOURCE,
            database: DATABASE,
            collection: COLLECTION,
            ...body,
        }),
    });
    return response.json();
}

// Validate user credentials
async function validateUser(username, password) {
    const result = await makeApiRequest("findOne", {
        filter: { username, password },
    });
    return result.document;
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if it's an admin login
    if (username === adminCredentials.username && password === adminCredentials.password) {
        localStorage.setItem('loggedInAdmin', JSON.stringify(adminCredentials));
        window.location.href = 'admin.html';
    }
    // Check if it's a user login
    else {
        const user = await validateUser(username, password);
        if (user && new Date(user.expiresAt) > new Date()) {
            // Check if the device matches the stored device
            if (user.deviceId === navigator.userAgent) {
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                window.location.href = 'index.html';
            } else {
                alert('You can only log in from the first device you used.');
                await makeApiRequest("deleteOne", {
                    filter: { _id: user._id }, // Delete the user's credentials
                });
            }
        } else {
            document.getElementById('loginMessage').textContent = 'Invalid username or password';
        }
    }
});