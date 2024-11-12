# Privacy Policy Analyzer Extension

This extension allows you to scan a webpage for a privacy policy and analyze its content using an AI model. When a privacy policy is found, it provides an analysis and score for each category mentioned in the policy.

## Prerequisites

Before you begin, make sure you have the following:

- **Google Chrome** installed on your machine.
- **Node.js** installed to build the extension (if you haven't built it yet).
- Your API key for the privacy policy analysis endpoint (Groq API) set up as an environment variable.

## Local Setup

### 1. Clone the repository

### 2. npm install

### 3. Set VITE_API_KEY=your-groq-api-key in your .env file

### 4. npm run build

### 5. Test the extension in Chrome

#### Step 1: Open Chrome Extensions page

1. Open the Chrome browser.
2. Go to the Chrome Extensions page: `chrome://extensions/`.
3. Enable **Developer mode** at the top right corner.

#### Step 2: Load your extension

1. Click on the **Load unpacked** button.
2. In the dialog that opens, navigate to the `dist` folder of your project (which contains the built extension files), and select the folder.

Your extension should now be installed locally.

#### Step 3: Test the extension

1. Once the extension is installed, a new icon should appear in the Chrome toolbar.
2. Visit any webpage with a privacy policy.
3. Click on the extension icon to start scanning the page for a privacy policy.
4. If a policy is found, the extension will analyze it and display the results.
