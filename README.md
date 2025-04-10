# Smart QR Code & Barcode Generator

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

## Deployment

This project is configured for easy deployment on Netlify:

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `out`
4. Deploy!

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
