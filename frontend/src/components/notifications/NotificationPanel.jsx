import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socket.js';
import { useChats } from '../../hooks/useChat.js';
import { Bell, X, CheckCircle, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { formatTimeAgo } from '../../utils/constants.js';

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seenChats, setSeenChats] = useState(new Set()); // Track which chats user has seen
  const navigate = useNavigate();
  const { data: chatsData } = useChats();
  
  const chats = chatsData?.data || [];
  const chatUnreadCount = chats.reduce((total, chat) => {
    const chatId = chat.id || chat._id;
    if (chat.unreadCount > 0 && !seenChats.has(chatId)) {
      return total + chat.unreadCount;
    }
    return total;
  }, 0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewLead = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'info',
        title: 'New Lead',
        message: `${data.name} - ${data.interest?.model || 'New inquiry'}`,
        timestamp: new Date(),
        unread: true,
        seen: false
      }, ...prev]);
    };

    const handleLeadUpdated = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'success',
        title: 'Lead Updated',
        message: `Lead has been updated`,
        timestamp: new Date(),
        unread: true,
        seen: false
      }, ...prev]);
    };

    const handleLeadScored = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: data.tier === 'hot' ? 'alert' : 'info',
        title: 'Lead Scored',
        message: `Lead scored ${data.score} (${data.tier})`,
        timestamp: new Date(),
        unread: true,
        seen: false
      }, ...prev]);
    };

    const handleChatNotification = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: data.isMention ? 'alert' : 'info',
        title: data.isMention ? '🔔 Mentioned in Chat' : '💬 New Message',
        message: `${data.chatName}: ${data.message.content?.substring(0, 50) || 'New message'}${data.message.content?.length > 50 ? '...' : ''}`,
        timestamp: new Date(),
        unread: true,
        seen: false,
        chatId: data.chatId,
        isChat: true
      }, ...prev]);
    };

    const handleChatMention = (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'alert',
        title: '🔔 You were mentioned',
        message: `${data.mentionedBy} mentioned you in ${data.chatName}`,
        timestamp: new Date(),
        unread: true,
        seen: false,
        chatId: data.chatId,
        isChat: true
      }, ...prev]);
    };

    socket.on('lead:new', handleNewLead);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('lead:scored', handleLeadScored);
    socket.on('chat:notification', handleChatNotification);
    socket.on('chat:mention', handleChatMention);

    return () => {
      socket.off('lead:new', handleNewLead);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('lead:scored', handleLeadScored);
      socket.off('chat:notification', handleChatNotification);
      socket.off('chat:mention', handleChatMention);
    };
  }, []);

  const notificationUnseenCount = notifications.filter(n => !n.seen).length;
  const totalUnseenCount = notificationUnseenCount + chatUnreadCount;

  const markAsSeen = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true, unread: false } : n));
  };

  const markAllAsSeen = () => {
    setNotifications(prev => prev.map(n => ({ ...n, seen: true, unread: false })));
    const allChatIds = chats
      .filter(chat => chat.unreadCount > 0)
      .map(chat => chat.id || chat._id);
    setSeenChats(new Set([...seenChats, ...allChatIds]));
  };

  const handleNotificationClick = (notification) => {
    markAsSeen(notification.id);
    if (notification.isChat && notification.chatId) {
      navigate(`/chat?chatId=${notification.chatId}`);
      setIsOpen(false);
    }
  };

  const handleChatClick = (chatId) => {
    setSeenChats(prev => new Set([...prev, chatId]));
    navigate(`/chat?chatId=${chatId}`);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      }, 1000); // Mark as seen after 1 second of viewing
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 relative"
      >
        <Bell className="w-5 h-5" />
        {totalUnseenCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg border-2 border-white">
            {totalUnseenCount > 99 ? '99+' : totalUnseenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {totalUnseenCount > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalUnseenCount} unseen {totalUnseenCount === 1 ? 'notification' : 'notifications'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalUnseenCount > 0 && (
                  <button
                    onClick={markAllAsSeen}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {/* Show Chat Unread Messages Section */}
              {chatUnreadCount > 0 && (
                <div className="border-b border-gray-200">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-gray-700">Unread Messages</span>
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        {chatUnreadCount}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {chats
                      .filter(chat => {
                        const chatId = chat.id || chat._id;
                        return chat.unreadCount > 0 && !seenChats.has(chatId);
                      })
                      .slice(0, 5)
                      .map((chat) => {
                        const chatId = chat.id || chat._id;
                        const isUnseen = !seenChats.has(chatId);
                        return (
                        <div
                          key={chatId}
                          onClick={() => handleChatClick(chatId)}
                          className={`p-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                            isUnseen 
                              ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                              : 'bg-gray-50 border-l-2 border-l-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-sm font-semibold ${isUnseen ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {chat.name}
                                </p>
                                {isUnseen && (
                                  <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                  </span>
                                )}
                              </div>
                              {chat.lastMessage && (
                                <>
                                  <p className="text-sm text-gray-600 truncate">
                                    {chat.lastMessage.sender?.name && (
                                      <span className="font-medium text-gray-700">
                                        {chat.lastMessage.sender.name}:{' '}
                                      </span>
                                    )}
                                    {chat.lastMessage.content?.substring(0, 40)}
                                    {chat.lastMessage.content?.length > 40 ? '...' : ''}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTimeAgo(chat.lastMessage.createdAt)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Show Other Notifications */}
              {notifications.length > 0 && (
                <div className={chatUnreadCount > 0 ? 'border-t border-gray-200' : ''}>
                  {chatUnreadCount > 0 && (
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-700">Other Notifications</span>
                    </div>
                  )}
                  <div className="divide-y divide-gray-200">
                    {notifications
                      .filter(n => !n.seen || n.unread) // Show unseen or unread notifications
                      .map((notification) => {
                        const isUnseen = !notification.seen;
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                              isUnseen 
                                ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                                : notification.unread 
                                ? 'bg-gray-50 border-l-2 border-l-gray-300' 
                                : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {notification.isChat ? (
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                              ) : (
                                getIcon(notification.type)
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`text-sm font-medium ${isUnseen ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </p>
                                  {isUnseen && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 animate-pulse"></span>
                                  )}
                                </div>
                                <p className={`text-sm ${isUnseen ? 'text-gray-700' : 'text-gray-600'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTimeAgo(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {notifications.filter(n => !n.seen).length === 0 && chatUnreadCount === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No unseen notifications</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationPanel;
