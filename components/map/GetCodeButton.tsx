// Get Code button component with toggle functionality
// Allows users to enter code mode for generating location codes

import React from 'react';

interface GetCodeButtonProps {
  isCodeMode: boolean;
  onToggleCodeMode: () => void;
}

export const GetCodeButton: React.FC<GetCodeButtonProps> = ({
  isCodeMode,
  onToggleCodeMode
}) => {
  return (
    <div className="get-code-button-container">
      <button
        className={`get-code-button ${isCodeMode ? 'active' : ''}`}
        onClick={onToggleCodeMode}
        title={isCodeMode ? "Exit Code Mode" : "Get Code"}
      >
        {isCodeMode ? "Browse Map" : "Get Code"}
      </button>
    </div>
  );
};

export default GetCodeButton;
