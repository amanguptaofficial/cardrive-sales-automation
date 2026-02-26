import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getSocket } from '../services/socket.js';
import AppLayout from '../components/layout/AppLayout.jsx';
import ChatList from '../components/chat/ChatList.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [seenChats, setSeenChats] = useState(() => {
    const stored = localStorage.getItem('seenChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedChatId) {
      setSeenChats(prev => {
        const newSet = new Set([...prev, selectedChatId]);
        localStorage.setItem('seenChats', JSON.stringify([...newSet]));
        return newSet;
      });
    }
  }, [selectedChatId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.chatId && seenChats.has(data.chatId)) {
        setSeenChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.chatId);
          localStorage.setItem('seenChats', JSON.stringify([...newSet]));
          return newSet;
        });
      }
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [seenChats]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleChatSeen = (chatId) => {
    setSeenChats(prev => {
      const newSet = new Set([...prev, chatId]);
      localStorage.setItem('seenChats', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-8rem)] flex border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="w-80 border-r border-gray-200 flex-shrink-0">
          <ChatList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
            seenChats={seenChats}
            onChatSeen={handleChatSeen}
          />
        </div>
        <div className="flex-1 min-w-0">
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;
