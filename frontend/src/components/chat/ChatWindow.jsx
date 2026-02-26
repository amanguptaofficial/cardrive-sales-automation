import { useState, useEffect, useRef } from 'react';
import { useChat, useSendMessage } from '../../hooks/useChat.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSocket } from '../../services/socket.js';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, Smile, X, Users } from 'lucide-react';
import { formatTimeAgo } from '../../utils/constants.js';
import toast from 'react-hot-toast';

const ChatWindow = ({ chatId }) => {
  const { data: chatData, isLoading } = useChat(chatId);
  const { agent } = useAuth();
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socket = getSocket();

  const chat = chatData?.data;
  const messages = chat?.messages || [];

  const emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];

  useEffect(() => {
    if (chatId && socket) {
      socket.emit('chat:join', chatId);
      socket.emit('user:join', agent?.id || agent?._id);

      socket.on('chat:message', (data) => {
        if (data.chatId === chatId) {
          queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      });

      socket.on('chat:mention', (data) => {
        if (data.chatId === chatId) {
          toast.success(`You were mentioned by ${data.mentionedBy}`, {
            icon: '🔔',
          });
        }
      });

      socket.on('chat:typing', (data) => {
        if (data.chatId === chatId && data.userId !== (agent?.id || agent?._id)) {
          setIsTyping(data.isTyping);
        }
      });

      return () => {
        socket.off('chat:message');
        socket.off('chat:mention');
        socket.off('chat:typing');
        socket.emit('chat:leave', chatId);
      };
    }
  }, [chatId, socket, agent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() && !file) return;

    try {
      await sendMessage.mutateAsync({
        chatId,
        content: message,
        mentions,
        file
      });
      setMessage('');
      setFile(null);
      setMentions([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(message + emoji);
    setShowEmojiPicker(false);
  };

  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const mentionInputRef = useRef(null);

  const handleMention = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setMessage(value);
    
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
    
    const mentionRegex = /@(\w+)/g;
    const matches = [...value.matchAll(mentionRegex)];
    const newMentions = matches.map(match => {
      const query = match[1].toLowerCase();
      const member = chat?.members?.find(m => {
        const name = m.user?.name?.toLowerCase() || '';
        return name.includes(query) || name.split(' ').some(part => part.startsWith(query));
      });
      return member?.user?._id || member?.user?.id;
    }).filter(Boolean);
    
    setMentions(newMentions);
  };

  const handleMentionSelect = (member) => {
    const textBefore = message.substring(0, mentionPosition - mentionQuery.length - 1);
    const textAfter = message.substring(mentionPosition);
    const newMessage = `${textBefore}@${member.user?.name || member.name} ${textAfter}`;
    setMessage(newMessage);
    setShowMentionSuggestions(false);
    setMentionQuery('');
    
    const memberId = member.user?._id || member.user?.id || member.id || member._id;
    if (memberId && !mentions.includes(memberId.toString())) {
      setMentions([...mentions, memberId.toString()]);
    }
    
    setTimeout(() => {
      mentionInputRef.current?.focus();
      const newPosition = mentionPosition - mentionQuery.length + (member.user?.name || member.name).length + 1;
      mentionInputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const filteredMembers = chat?.members?.filter(m => {
    if (!mentionQuery) return false;
    const name = m.user?.name?.toLowerCase() || '';
    return name.includes(mentionQuery.toLowerCase()) || 
           name.split(' ').some(part => part.startsWith(mentionQuery.toLowerCase()));
  }) || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Select a chat to start messaging</div>
      </div>
    );
  }

  const currentUserId = agent?.id || agent?._id;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-md">
              {chat.type === 'group' ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white font-bold text-lg">
                  {chat.name?.charAt(0).toUpperCase() || 'C'}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{chat.name}</h2>
              {chat.type === 'group' && (
                <p className="text-sm text-gray-500">
                  {chat.members?.length || 0} members
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white min-h-0">
        {messages.map((msg, index) => {
          const isOwn = msg.sender?._id?.toString() === currentUserId?.toString() || 
                       msg.sender?.id?.toString() === currentUserId?.toString();
          const isSystem = msg.type === 'system';
          
          return (
            <div
              key={msg._id || index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isSystem ? 'justify-center' : ''}`}
            >
              <div className={`max-w-[70%] ${isSystem ? 'text-center' : ''}`}>
                {!isSystem && !isOwn && (
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender?.name || 'Unknown'}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md ${
                    isSystem
                      ? 'bg-gray-100 text-gray-600 italic text-sm'
                      : isOwn
                      ? 'bg-gradient-to-r from-accent to-accent/90 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {msg.type === 'file' || msg.type === 'image' ? (
                    <div>
                      {msg.type === 'image' ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${msg.fileUrl}`}
                          alt={msg.fileName}
                          className="max-w-full h-auto rounded"
                        />
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${msg.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Paperclip className="w-4 h-4" />
                          {msg.fileName}
                        </a>
                      )}
                      {msg.content && <p className="mt-2">{msg.content}</p>}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {msg.content?.split(/(@\w+)/g).map((part, idx) => {
                        if (part.startsWith('@')) {
                          const mentionedName = part.substring(1);
                          const isMentioned = msg.mentions?.some(m => 
                            m?.name?.toLowerCase().includes(mentionedName.toLowerCase())
                          );
                          return (
                            <span
                              key={idx}
                              className={`font-semibold ${
                                isMentioned ? 'text-blue-400' : 'text-blue-300'
                              }`}
                            >
                              {part}
                            </span>
                          );
                        }
                        return <span key={idx}>{part}</span>;
                      })}
                    </p>
                  )}
                </div>
                {!isSystem && (
                  <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTimeAgo(msg.createdAt)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {file && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <span className="text-xs text-gray-500">
              ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <button
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        {/* Mention Suggestions */}
        {showMentionSuggestions && filteredMembers.length > 0 && (
          <div className="mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredMembers.map((member, idx) => (
              <button
                key={member.user?._id || member.user?.id || idx}
                onClick={() => handleMentionSelect(member)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-semibold text-sm">
                    {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{member.user?.name || member.name}</div>
                  {member.user?.email && (
                    <div className="text-xs text-gray-500">{member.user.email}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={mentionInputRef}
              value={message}
              onChange={handleMention}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !showMentionSuggestions) {
                  e.preventDefault();
                  handleSend();
                } else if (e.key === 'Escape') {
                  setShowMentionSuggestions(false);
                }
              }}
              onClick={() => setShowMentionSuggestions(false)}
              placeholder="Type a message... Use @ to mention someone"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-white shadow-sm transition-all"
              rows="1"
            />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Add emoji"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-64 h-48 overflow-y-auto grid grid-cols-8 gap-1">
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-1 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim() && !file}
              className="p-2.5 bg-gradient-to-r from-accent to-accent/90 text-white rounded-lg hover:from-accent/90 hover:to-accent shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-4">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {mentions.length > 0 && (
            <span className="text-accent font-medium">
              Mentioning {mentions.length} {mentions.length === 1 ? 'person' : 'people'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
