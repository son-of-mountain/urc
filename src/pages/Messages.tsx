import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Messages.css';

interface User {
  id: number;
  username: string;
  email: string;
  externalId: string;
  lastSeen?: string;
}

interface Message {
  id?: string;
  from: number;
  username: string;
  content: string;
  ts: string;
}

export default function Messages() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId: selectedUserId } = useParams();
  
  const session = useSelector((state: any) => state.session);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!session?.token) {
      navigate('/login');
    }
  }, [session, navigate]);

  // Fetch users list
  useEffect(() => {
    if (!session?.token) return;
    
    fetch('/api/users', {
      headers: { 'Authentication': `Bearer ${session.token}` }
    })
      .then(r => r.json())
      .then(data => {
        setUsers(data.filter((u: User) => u.id !== session.id));
      })
      .catch(err => console.error('Failed to fetch users:', err));
  }, [session]);

  // Load messages when user is selected
  useEffect(() => {
    if (!selectedUserId || !session?.token) return;
    
    const userId = parseInt(selectedUserId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      loadMessages(userId);
    }
  }, [selectedUserId, users, session]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (userId: number) => {
    try {
      const res = await fetch(
        `/api/message?type=user&targetId=${userId}`,
        { headers: { 'Authentication': `Bearer ${session.token}` } }
      );
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !session?.token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          type: 'user',
          targetId: selectedUser.id,
          content: newMessage
        })
      });

      if (res.ok) {
        setNewMessage('');
        await loadMessages(selectedUser.id);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (user: User) => {
    navigate(`/messages/${user.id}`);
  };

  return (
    <div className="messages-container">
      {/* Sidebar */}
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>Messages</h2>
          <div className="online-status">
            <span className="status-dot active"></span>
            <span>{session?.username}</span>
          </div>
        </div>

        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">No users available</div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => selectUser(user)}
              >
                <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                <span className="status-dot"></span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="messages-main">
        {!selectedUser ? (
          <div className="no-conversation">
            <div className="empty-icon">💬</div>
            <h3>Select a conversation to start messaging</h3>
            <p>Choose a user from the list to begin chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="header-user-info">
                <div className="header-avatar">{selectedUser.username[0].toUpperCase()}</div>
                <div>
                  <h3>{selectedUser.username}</h3>
                  <p className="status-text">
                    <span className="status-dot active"></span>
                    Active now
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`message ${msg.from === session?.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.ts).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!newMessage.trim() || loading}
              >
                {loading ? '⏳' : '📤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
