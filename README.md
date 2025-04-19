# Smart QR Code & Barcode Generator

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-NETLIFY-APP-ID/deploy-status)](https://app.netlify.com/sites/YOUR-NETLIFY-APP-NAME/deploys)

A web application that allows users to generate QR codes and barcodes with customizable options. Built with Next.js, React, and Tailwind CSS.

![Smart QR Code & Barcode Generator](https://github.com/yourusername/smartqrcode/assets/screenshot.png)

## Live Demo

[Visit the live demo](https://smartqrcode.netlify.app)

## Features

- **QR Code Generation**: Create QR codes for URLs, text, contact information, and more
- **Barcode Generation**: Generate barcodes in various formats (CODE128, UPC, EAN, etc.)
- **Customization Options**: Modify colors, size, and other parameters
- **High-Quality Downloads**: Save generated codes as PNG images
- **No Registration Required**: Free to use without creating an account
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed JavaScript for better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **qrcode & react-qr-code**: Libraries for QR code generation
- **jsbarcode**: Library for barcode generation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/smartqrcode.git
   cd smartqrcode
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Deployment to Netlify via GitHub

### Prerequisites

- GitHub repository with your code
- Netlify account
- Firebase project (for authentication and database)

### Step 1: Push Your Code to GitHub

Ensure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### Step 2: Connect to Netlify

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select GitHub as your provider
4. Authorize Netlify to access your GitHub account
5. Select your repository

### Step 3: Configure Build Settings

The repository includes a `netlify.toml` file that configures:

- **Build command**: `npm run build`
- **Publish directory**: `out`
- **Node version**: 18

You don't need to change these settings unless you have specific requirements.

### Step 4: Set Environment Variables

Set the following environment variables in Netlify dashboard (Site settings > Build & deploy > Environment):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `STRIPE_SECRET_KEY` (if using Stripe)
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (if using Stripe)
- `PAYPAL_CLIENT_ID` (if using PayPal)
- `PAYPAL_CLIENT_SECRET` (if using PayPal)
- `FLUTTERWAVE_SECRET_KEY` (if using Flutterwave)
- `NEXT_PUBLIC_APP_URL` (set to your Netlify URL)

### Step 5: Deploy

Click "Deploy site" and Netlify will build and deploy your application.

### Local Deployment Preparation

You can use the included script to prepare your project for deployment:

```bash
# On Windows
netlify-deploy.bat

# On Linux/Mac
# Run the equivalent commands:
# rm -rf .next out
# npm ci
# npm run build
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [qrcode](https://github.com/soldair/node-qrcode) for QR code generation
- [react-qr-code](https://github.com/rosskhanas/react-qr-code) for React QR code component
- [jsbarcode](https://github.com/lindell/JsBarcode) for barcode generation
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Next.js](https://nextjs.org/) for the framework
