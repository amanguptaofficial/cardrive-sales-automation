import Chat from '../models/Chat.js';
import Agent from '../models/Agent.js';
import Lead from '../models/Lead.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { getIO } from '../socket.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only images and documents are allowed.', 400));
    }
  }
});

export const getChats = asyncHandler(async (req, res) => {
  const userId = req.agent._id;
  
  const chats = await Chat.find({
    'members.user': userId,
    isActive: true
  })
  .populate('members.user', 'name email role')
  .populate('createdBy', 'name email')
  .populate('messages.sender', 'name email')
  .sort({ updatedAt: -1 })
  .lean();

  const formattedChats = chats.map(chat => {
    const member = chat.members.find(m => m.user._id.toString() === userId.toString());
    const unreadCount = chat.messages.filter(msg => {
      const isOwnMessage = msg.sender?._id?.toString() === userId.toString() || 
                          msg.sender?.id?.toString() === userId.toString();
      const isSystemMessage = msg.type === 'system';
      return !isOwnMessage && !isSystemMessage && member && new Date(msg.createdAt) > new Date(member.lastReadAt);
    }).length;

    const lastMessage = chat.messages[chat.messages.length - 1] || null;

    return {
      id: chat._id,
      type: chat.type,
      name: chat.type === 'group' ? chat.name : chat.members.find(m => m.user._id.toString() !== userId.toString())?.user?.name || 'Chat',
      description: chat.description,
      avatar: chat.avatar,
      members: chat.members,
      unreadCount,
      lastMessage: lastMessage ? {
        id: lastMessage._id,
        content: lastMessage.content,
        type: lastMessage.type,
        sender: lastMessage.sender,
        createdAt: lastMessage.createdAt
      } : null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };
  });

  res.json({
    success: true,
    data: formattedChats
  });
});

export const getChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.agent._id;

  const chat = await Chat.findOne({
    _id: id,
    'members.user': userId,
    isActive: true
  })
  .populate('members.user', 'name email role')
  .populate('createdBy', 'name email')
  .populate('messages.sender', 'name email')
  .populate('messages.mentions', 'name email');

  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  const member = chat.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.lastReadAt = new Date();
    await chat.save();
  }

  res.json({
    success: true,
    data: chat
  });
});

export const createDirectChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.agent._id;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  if (userId === currentUserId.toString()) {
    throw new AppError('Cannot create chat with yourself', 400);
  }

  const existingChat = await Chat.findOne({
    type: 'direct',
    'members.user': { $all: [currentUserId, userId] },
    isActive: true
  })
  .populate('members.user', 'name email role');

  if (existingChat) {
    return res.json({
      success: true,
      data: existingChat
    });
  }

  const user = await Agent.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const chat = await Chat.create({
    type: 'direct',
    members: [
      { user: currentUserId, role: 'member' },
      { user: userId, role: 'member' }
    ],
    createdBy: currentUserId,
    messages: []
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate('members.user', 'name email role')
    .populate('createdBy', 'name email');

  const io = getIO();
  if (io) {
    io.to(userId.toString()).emit('chat:new', { chat: populatedChat });
  }

  res.status(201).json({
    success: true,
    data: populatedChat
  });
});

export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, description, memberIds } = req.body;
  const currentUserId = req.agent._id;

  if (!name) {
    throw new AppError('Group name is required', 400);
  }

  const members = [{ user: currentUserId, role: 'admin' }];
  
  if (memberIds && Array.isArray(memberIds)) {
    for (const memberId of memberIds) {
      if (memberId !== currentUserId.toString()) {
        const user = await Agent.findById(memberId);
        if (user) {
          members.push({ user: memberId, role: 'member' });
        }
      }
    }
  }

  const chat = await Chat.create({
    type: 'group',
    name,
    description,
    members,
    createdBy: currentUserId,
    messages: [{
      sender: currentUserId,
      content: `Group "${name}" created`,
      type: 'system'
    }],
    settings: {
      autoAddNewLeads: false
    }
  });

  const populatedChat = await Chat.findById(chat._id)
    .populate('members.user', 'name email role')
    .populate('createdBy', 'name email')
    .populate('messages.sender', 'name email');

  const io = getIO();
  if (io) {
    members.forEach(member => {
      if (member.user.toString() !== currentUserId.toString()) {
        io.to(member.user.toString()).emit('chat:new', { chat: populatedChat });
      }
    });
  }

  res.status(201).json({
    success: true,
    data: populatedChat
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  let { content, mentions, replyTo } = req.body;
  const userId = req.agent._id;

  if (!content && !req.file) {
    throw new AppError('Message content or file is required', 400);
  }

  const chat = await Chat.findOne({
    _id: chatId,
    'members.user': userId,
    isActive: true
  })
  .populate('members.user', 'name email');

  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (content && !mentions) {
    mentions = [];
    const mentionRegex = /@(\w+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    
    for (const match of matches) {
      const mentionedName = match[1];
      const member = chat.members.find(m => {
        const memberName = m.user?.name?.toLowerCase() || '';
        return memberName.includes(mentionedName.toLowerCase()) || 
               memberName.split(' ').some(part => part.toLowerCase().startsWith(mentionedName.toLowerCase()));
      });
      if (member && member.user._id.toString() !== userId.toString()) {
        mentions.push(member.user._id.toString());
      }
    }
  }

  if (typeof mentions === 'string') {
    try {
      mentions = JSON.parse(mentions);
    } catch (e) {
      mentions = [];
    }
  }

  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  const messageData = {
    sender: userId,
    content: content || '',
    type: req.file ? (req.file.mimetype.startsWith('image/') ? 'image' : 'file') : 'text',
    mentions: Array.isArray(mentions) ? mentions : []
  };

  if (req.file) {
    messageData.fileUrl = `/uploads/chat/${req.file.filename}`;
    messageData.fileName = req.file.originalname;
    messageData.fileSize = req.file.size;
    messageData.content = messageData.content || req.file.originalname;
  }

  if (replyTo) {
    messageData.replyTo = replyTo;
  }

  chat.messages.push(messageData);
  await chat.save();

  const populatedChat = await Chat.findById(chatId)
    .populate('messages.sender', 'name email')
    .populate('messages.mentions', 'name email');

  const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

  const io = getIO();
  if (io) {
    const sender = await Agent.findById(userId).select('name email');
    
    chat.members.forEach(member => {
      const memberId = member.user._id?.toString() || member.user.toString();
      const isMentioned = mentions && Array.isArray(mentions) && mentions.includes(memberId);
      const isNotSender = memberId !== userId.toString();

      io.to(memberId).emit('chat:message', {
        chatId: chatId,
        message: newMessage
      });

      if (isNotSender) {
        io.to(memberId).emit('chat:notification', {
          chatId: chatId,
          chatName: chat.type === 'group' ? chat.name : sender?.name || 'Someone',
          message: {
            content: newMessage.content,
            type: newMessage.type,
            sender: sender?.name || 'Unknown'
          },
          isMention: isMentioned
        });
      }

      if (isMentioned && isNotSender) {
        io.to(memberId).emit('chat:mention', {
          chatId: chatId,
          chatName: chat.type === 'group' ? chat.name : 'Direct Chat',
          message: newMessage,
          mentionedBy: sender?.name || 'Someone'
        });
      }
    });
  }

  res.json({
    success: true,
    data: newMessage
  });
});

export const addMembers = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { memberIds } = req.body;
  const userId = req.agent._id;

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'members.user': userId,
    isActive: true
  });

  if (!chat) {
    throw new AppError('Chat not found or you are not a member', 404);
  }

  const member = chat.members.find(m => m.user.toString() === userId.toString());
  if (member.role !== 'admin') {
    throw new AppError('Only admins can add members', 403);
  }

  const newMembers = [];
  for (const memberId of memberIds) {
    if (!chat.members.some(m => m.user.toString() === memberId)) {
      const user = await Agent.findById(memberId);
      if (user) {
        chat.members.push({ user: memberId, role: 'member' });
        newMembers.push(user);
      }
    }
  }

  if (newMembers.length > 0) {
    chat.messages.push({
      sender: userId,
      content: `${newMembers.map(u => u.name).join(', ')} ${newMembers.length === 1 ? 'was' : 'were'} added to the group`,
      type: 'system'
    });
    await chat.save();

    const io = getIO();
    if (io) {
      newMembers.forEach(member => {
        io.to(member._id.toString()).emit('chat:new', { chat });
      });
      chat.members.forEach(member => {
        io.to(member.user.toString()).emit('chat:updated', { chatId, chat });
      });
    }
  }

  const populatedChat = await Chat.findById(chatId)
    .populate('members.user', 'name email role')
    .populate('messages.sender', 'name email');

  res.json({
    success: true,
    data: populatedChat
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { chatId, memberId } = req.params;
  const userId = req.agent._id;

  const chat = await Chat.findOne({
    _id: chatId,
    type: 'group',
    'members.user': userId,
    isActive: true
  });

  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  const member = chat.members.find(m => m.user.toString() === userId.toString());
  if (member.role !== 'admin' && memberId !== userId.toString()) {
    throw new AppError('Only admins can remove members', 403);
  }

  const removedMember = chat.members.find(m => m.user.toString() === memberId);
  if (removedMember) {
    chat.members = chat.members.filter(m => m.user.toString() !== memberId);
    
    chat.messages.push({
      sender: userId,
      content: `${removedMember.user.name || 'A member'} was removed from the group`,
      type: 'system'
    });
    
    await chat.save();

    const io = getIO();
    if (io) {
      io.to(memberId).emit('chat:removed', { chatId });
      chat.members.forEach(m => {
        io.to(m.user.toString()).emit('chat:updated', { chatId, chat });
      });
    }
  }

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
});

export const getAgents = asyncHandler(async (req, res) => {
  const agents = await Agent.find({
    isVerified: true,
    isActive: true
  })
  .select('name email role')
  .sort({ name: 1 });

  res.json({
    success: true,
    data: agents
  });
});

export const notifyNewLead = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email');

    if (!lead) return;

    const groups = await Chat.find({
      type: 'group',
      'settings.autoAddNewLeads': true,
      isActive: true
    });

    const io = getIO();
    if (io && groups.length > 0) {
      groups.forEach(group => {
        const message = {
          sender: null,
          content: `🎯 New Lead: ${lead.name} - ${lead.interest?.model || 'Vehicle'} (${lead.tier?.toUpperCase() || 'NEW'})`,
          type: 'system',
          metadata: {
            leadId: lead._id.toString(),
            leadName: lead.name,
            leadTier: lead.tier,
            leadModel: lead.interest?.model
          }
        };

        group.messages.push(message);
        group.save();

        group.members.forEach(member => {
          io.to(member.user.toString()).emit('chat:message', {
            chatId: group._id.toString(),
            message: {
              ...message,
              _id: message._id || new Date().getTime(),
              createdAt: new Date()
            }
          });
        });
      });
    }
  } catch (error) {
    logger.error('Error notifying groups about new lead:', error);
  }
};
