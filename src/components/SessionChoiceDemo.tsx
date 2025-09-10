import React, { useState } from 'react';
import { SessionChoiceModal } from './SessionChoiceModal';

interface SessionChoiceDemoProps {
  tableId: string;
  restaurantId: string;
}

export const SessionChoiceDemo: React.FC<SessionChoiceDemoProps> = ({
  tableId,
  restaurantId
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleJoinSession = async (otp: string, customerData: { name: string; phone: string }) => {
    try {
      const response = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp,
          tableId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to join session');
      }

      console.log('Successfully joined session:', result.data);
      // Handle successful join (e.g., redirect to customer interface)
      
    } catch (error: any) {
      console.error('Error joining session:', error);
      throw error;
    }
  };

  const handleCreateSession = async (customerData: { name: string; phone: string }) => {
    try {
      // First create the session
      const createResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          restaurantId,
        }),
      });

      const createResult = await createResponse.json();

      if (!createResult.success) {
        throw new Error(createResult.message || 'Failed to create session');
      }

      // Then join the session with the customer
      const joinResponse = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: createResult.data.otp,
          tableId,
          customerName: customerData.name,
          customerPhone: customerData.phone,
        }),
      });

      const joinResult = await joinResponse.json();

      if (!joinResult.success) {
        throw new Error(joinResult.message || 'Failed to join new session');
      }

      console.log('Successfully created and joined session:', joinResult.data);
      // Handle successful creation and join (e.g., redirect to customer interface)
      
    } catch (error: any) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        Open Session Choice Modal
      </button>

      <SessionChoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tableId={tableId}
        restaurantId={restaurantId}
        onJoinSession={handleJoinSession}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
};

export default SessionChoiceDemo; 