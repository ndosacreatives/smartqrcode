import React from "react";
import QRModalExample from "@/components/QRModalExample";

export default function QRModalExamplePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          QR Code Modal Example
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-base text-gray-500 sm:text-lg">
          This example demonstrates how to use the QRCodeModal component to display QR codes in a modal dialog.
        </p>
      </div>
      
      <div className="mt-8">
        <QRModalExample />
      </div>
      
      <div className="mt-16 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">How to Use the QRCodeModal Component</h2>
        
        <div className="prose prose-blue max-w-none">
          <p>
            The <code>QRCodeModal</code> component is designed to display QR codes in a modal dialog.
            It accepts the following props:
          </p>
          
          <ul>
            <li><code>isOpen</code> (boolean): Controls whether the modal is visible</li>
            <li><code>onClose</code> (function): Callback function that is called when the modal is closed</li>
            <li><code>value</code> (string): The content to encode in the QR code</li>
            <li><code>title</code> (string, optional): The title displayed at the top of the modal (default: "QR Code")</li>
            <li><code>downloadable</code> (boolean, optional): Whether to show the download button (default: true)</li>
          </ul>
          
          <p>Example usage:</p>
          
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{`
// Import the component
import QRCodeModal from "@/components/QRCodeModal";

// Component usage within your React component
const MyComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState("https://example.com");

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Open QR Code
      </button>
      
      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        value={qrValue}
        title="Your QR Code"
        downloadable={true}
      />
    </>
  );
};
            `}</code>
          </pre>
        </div>
      </div>
    </div>
  );
} 