// Code mode interface component
// Handles the code generation and copy functionality

import React, { useState } from 'react';

interface CodeModeInterfaceProps {
  codeModeMarker: { lat: number; lng: number } | null;
  onBack: () => void;
  isFullCodeMode?: boolean;
}

export const CodeModeInterface: React.FC<CodeModeInterfaceProps> = ({
  codeModeMarker,
  onBack,
  isFullCodeMode = false
}) => {
  const [description, setDescription] = useState("");
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const generateCode = () => {
    if (!codeModeMarker) return "";
    
    return `[//]:# (!worldmappin ${codeModeMarker.lat.toFixed(5)} lat ${codeModeMarker.lng.toFixed(5)} long ${description} d3scr)`;
  };

  const handleCopyCode = async () => {
    const code = generateCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedToClipboard(true);
      // Reset the copied state after 3 seconds
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    }
  };

  return (
    <div className="code-mode-div">
      <div className="code-mode-header">
        <button className="back-button" onClick={onBack} title={isFullCodeMode ? "Back to Map" : "Close"}>
          {isFullCodeMode ? "← Back" : "× Close"}
        </button>
        <h3>Get Location Code</h3>
      </div>
      
      <input
        type="text"
        placeholder="Short description here"
        maxLength={250}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="code-description-input"
      />
      
      <p className="info-text">
        {codeModeMarker
          ? copiedToClipboard
            ? "Copied successfully!"
            : "Click the code to copy, then add it to your post on Hive. Click anywhere on the map to change location."
          : "Click on the map on the location of your post for the code to be generated."}
      </p>
      
      {codeModeMarker && (
        <div
          className="code-to-copy"
          onClick={handleCopyCode}
          title="Click to copy"
        >
          {generateCode()}
        </div>
      )}
    </div>
  );
};

export default CodeModeInterface;
