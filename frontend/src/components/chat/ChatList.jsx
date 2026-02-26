import { useState } from 'react';
import { useChats, useCreateDirectChat, useCreateGroupChat } from '../../hooks/useChat.js';
import { useAgents } from '../../hooks/useChat.js';
import { MessageSquare, Users, Plus, Search } from 'lucide-react';
import { formatTimeAgo } from '../../utils/constants.js';

const ChatList = ({ onSelectChat, selectedChatId, onCreateGroup, seenChats = new Set(), onChatSeen }) => {
  const { data: chatsData, isLoading } = useChats();
  const { data: agentsData } = useAgents();
  const createDirectChat = useCreateDirectChat();
  const createGroupChat = useCreateGroupChat();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const chats = chatsData?.data || [];
  const agents = agentsData?.data || [];

  const filteredChats = chats.filter(chat => {
    const searchLower = searchTerm.toLowerCase();
    return chat.name?.toLowerCase().includes(searchLower) ||
           chat.lastMessage?.content?.toLowerCase().includes(searchLower);
  });

  const handleCreateDirectChat = async (agentId) => {
    try {
      const result = await createDirectChat.mutateAsync(agentId);
      if (result.data) {
        onSelectChat(result.data._id || result.data.id);
        setShowNewChat(false);
      }
    } catch (error) {
      console.error('Error creating direct chat:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    try {
      const memberIds = selectedAgents.map(a => a.id || a._id);
      const result = await createGroupChat.mutateAsync({
        name: groupName,
        description: groupDescription,
        memberIds
      });
      if (result.data) {
        onSelectChat(result.data._id || result.data.id);
        setShowNewGroup(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedAgents([]);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowNewGroup(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Group"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">New Chat</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agents.map(agent => (
                <button
                  key={agent.id || agent._id}
                  onClick={() => handleCreateDirectChat(agent.id || agent._id)}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-gray-500">{agent.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewChat(false)}
              className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Create Group</h3>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full mb-3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              placeholder="Description (optional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full mb-3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              rows="2"
            />
            <div className="mb-3">
              <div className="text-sm font-medium mb-2">Select Members</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {agents.map(agent => {
                  const isSelected = selectedAgents.some(a => (a.id || a._id) === (agent.id || agent._id));
                  return (
                    <label key={agent.id || agent._id} className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAgents([...selectedAgents, agent]);
                          } else {
                            setSelectedAgents(selectedAgents.filter(a => (a.id || a._id) !== (agent.id || agent._id)));
                          }
                        }}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim()}
                className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewGroup(false);
                  setGroupName('');
                  setGroupDescription('');
                  setSelectedAgents([]);
                }}
                className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chats found</div>
        ) : (
          filteredChats.map(chat => {
            const chatId = chat.id || chat._id;
            const isSeen = seenChats.has(chatId);
            const shouldShowCount = chat.unreadCount > 0 && !isSeen;
            
            return (
            <button
              key={chatId}
              onClick={() => {
                onSelectChat(chatId);
                if (onChatSeen) {
                  onChatSeen(chatId);
                }
              }}
              className={`w-full text-left p-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 group ${
                chatId === selectedChatId 
                  ? 'bg-gradient-to-r from-accent/10 to-accent/5 border-l-4 border-l-accent' 
                  : 'hover:border-l-2 hover:border-l-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                  chat.type === 'group' 
                    ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                    : 'bg-gradient-to-br from-accent to-accent/70'
                } shadow-md`}>
                  {chat.type === 'group' ? (
                    <Users className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {chat.name?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate text-gray-900">{chat.name}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTimeAgo(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage.type === 'system' ? (
                        <span className="italic text-gray-500">{chat.lastMessage.content}</span>
                      ) : (
                        <span>
                          {chat.lastMessage.sender?.name && (
                            <span className="font-medium text-gray-700">
                              {chat.lastMessage.sender.name}:{' '}
                            </span>
                          )}
                          {chat.lastMessage.content}
                        </span>
                      )}
                    </p>
                  )}
                  {shouldShowCount && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
