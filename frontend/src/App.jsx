import { useState, useRef, useEffect } from "react";

import {
  Bot,
  Plus,
  Menu,
  X,
  MessageSquare,
  Send,
  Mic,
  Sparkles,
  Trash2
} from "lucide-react";

import ReactMarkdown from "react-markdown";

import "./App.css";


function App() {

  // CREATE NEW CHAT ID
  const createChat = () => ({
    id: Date.now(),
    title: "New Chat",
    messages: [],
    updatedAt: Date.now()
  });


  // LOAD CHAT HISTORY
  const [chats, setChats] = useState(() => {

    try {

      const saved = localStorage.getItem("mike_chats");

      if (saved) {

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }

      }

    } catch (error) {

      console.error("Chat history loading error:", error);

    }

    return [createChat()];

  });


  const [activeChatId, setActiveChatId] = useState(() => {

    return localStorage.getItem("mike_active_chat");

  });


  const [input, setInput] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);


  const bottomRef = useRef(null);


  // GET ACTIVE CHAT
  const activeChat =
    chats.find(chat => chat.id === Number(activeChatId)) ||
    chats[0];

  const messages = activeChat?.messages || [];


  // SAVE CHAT HISTORY
  useEffect(() => {

    localStorage.setItem(
      "mike_chats",
      JSON.stringify(chats)
    );

  }, [chats]);


  // SAVE ACTIVE CHAT
  useEffect(() => {

    if (activeChat) {

      localStorage.setItem(
        "mike_active_chat",
        activeChat.id
      );

    }

  }, [activeChat]);


  // AUTO SCROLL
  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages, loading]);


  // UPDATE CHAT
  const updateChat = (chatId, updatedMessages) => {

    setChats(prev =>

      prev.map(chat => {

        if (chat.id === chatId) {

          const firstUserMessage = updatedMessages.find(
            message => message.role === "user"
          );

          return {
            ...chat,

            messages: updatedMessages,

            title: firstUserMessage
              ? firstUserMessage.text.slice(0, 30)
              : "New Chat",

            updatedAt: Date.now()
          };

        }

        return chat;

      })

    );

  };


  // SEND MESSAGE
  const sendMessage = async () => {

    const cleanMessage = input.trim();

    if (!cleanMessage || loading) return;

    const chatId = activeChat.id;

    const userMessage = {

      id: Date.now(),

      role: "user",

      text: cleanMessage

    };


    const updatedMessages = [
      ...messages,
      userMessage
    ];


    updateChat(chatId, updatedMessages);

    setInput("");

    setLoading(true);


    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/chat",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify({

            messages: updatedMessages.map(message => ({

              role: message.role,

              content: message.text

            }))

          })

        }

      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail || "Something went wrong."
        );

      }


      const aiMessage = {

        id: Date.now() + 1,

        role: "assistant",

        text: data.reply

      };


      setChats(prev =>

        prev.map(chat => {

          if (chat.id === chatId) {

            return {

              ...chat,

              messages: [
                ...chat.messages,
                aiMessage
              ],

              updatedAt: Date.now()

            };

          }

          return chat;

        })

      );


    } catch (error) {

      console.error("MIKE AI Error:", error);


      const errorMessage = {

        id: Date.now() + 2,

        role: "assistant",

        text: `Sorry! ${error.message}`

      };


      setChats(prev =>

        prev.map(chat => {

          if (chat.id === chatId) {

            return {

              ...chat,

              messages: [
                ...chat.messages,
                errorMessage
              ]

            };

          }

          return chat;

        })

      );


    } finally {

      setLoading(false);

    }

  };


  // NEW CHAT
  const newChat = () => {

    if (loading) return;

    const newConversation = createChat();

    setChats(prev => [
      newConversation,
      ...prev
    ]);

    setActiveChatId(newConversation.id);

    setInput("");

    setSidebarOpen(false);

  };


  // OPEN OLD CHAT
  const openChat = (chatId) => {

    if (loading) return;

    setActiveChatId(chatId);

    setInput("");

    setSidebarOpen(false);

  };


  // DELETE CHAT
  const deleteChat = (chatId) => {

    if (loading) return;

    const remainingChats = chats.filter(
      chat => chat.id !== chatId
    );

    if (remainingChats.length === 0) {

      const freshChat = createChat();

      setChats([freshChat]);

      setActiveChatId(freshChat.id);

    } else {

      setChats(remainingChats);

      if (Number(activeChatId) === chatId) {

        setActiveChatId(remainingChats[0].id);

      }

    }

  };


  // SUGGESTIONS
  const suggestions = [

    "Explain Python programming",

    "Help me build a website",

    "Write a professional email",

    "Explain Django REST API"

  ];


  return (

    <div className="app-container">


      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebarOpen ? "show-sidebar" : ""}`}>


        <div className="brand">

          <div className="brand-icon">

            <Bot size={25} />

          </div>


          <div>

            <h2>
              MIKE <span>AI</span>
            </h2>

            <p>YOUR PERSONAL AI</p>

          </div>


          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >

            <X />

          </button>

        </div>



        {/* NEW CHAT */}

        <button
          className="new-chat"
          onClick={newChat}
        >

          <Plus size={19} />

          New Chat

        </button>



        {/* HISTORY */}

        <div className="history-heading">

          RECENT CONVERSATIONS

        </div>


        <div className="history-list">

          {chats
            .filter(chat => chat.messages.length > 0)
            .map(chat => (

              <div
                className={`history-item ${
                  Number(activeChatId) === chat.id
                    ? "active-history"
                    : ""
                }`}
                key={chat.id}
                onClick={() => openChat(chat.id)}
              >

                <MessageSquare size={16} />

                <span>{chat.title}</span>


                <button
                  className="delete-chat"
                  onClick={(e) => {

                    e.stopPropagation();

                    deleteChat(chat.id);

                  }}
                  title="Delete chat"
                >

                  <Trash2 size={14} />

                </button>

              </div>

            ))}

        </div>



        <div className="sidebar-footer">

          <span className="online-dot"></span>

          MIKE AI is ready

        </div>


      </aside>



      {/* SIDEBAR OVERLAY */}

      {sidebarOpen && (

        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>

      )}



      {/* MAIN CONTENT */}

      <main className="main-content">



        {/* TOPBAR */}

        <header className="topbar">


          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
          >

            <Menu />

          </button>



          <div className="topbar-brand">

            <span className="status-dot"></span>

            <strong>MIKE AI</strong>

            <span className="assistant-label">
              Assistant
            </span>

          </div>



          <div className="topbar-right">

            <Sparkles size={16} />

            <span>AI POWERED</span>

          </div>


        </header>



        {/* CHAT AREA */}

        <section className="chat-area">


          {messages.length === 0 ? (


            <div className="welcome-section">


              <div className="welcome-logo">

                <Bot size={38} />

              </div>


              <span className="welcome-label">

                WELCOME TO MIKE AI

              </span>



              <h1>

                Hello, I'm <span>MIKE AI.</span>

              </h1>



              <p>

                Your intelligent AI assistant.

                <br />

                What would you like to explore today?

              </p>



              <div className="suggestions">


                {suggestions.map((item, index) => (

                  <button

                    key={index}

                    className="suggestion-card"

                    onClick={() => setInput(item)}

                  >

                    <Sparkles size={17} />

                    <span>{item}</span>

                  </button>

                ))}


              </div>


            </div>


          ) : (


            <div className="messages-container">


              {messages.map(message => (


                <div

                  key={message.id}

                  className={`message-row ${message.role}`}

                >


                  <div className="message-avatar">

                    {message.role === "user"
                      ? "S"
                      : <Bot size={20} />}

                  </div>



                  <div className="message-body">


                    <span className="message-name">

                      {message.role === "user"
                        ? "YOU"
                        : "MIKE AI"}

                    </span>



                    <div className="markdown-content">

                      <ReactMarkdown>

                        {message.text}

                      </ReactMarkdown>

                    </div>


                  </div>


                </div>


              ))}



              {loading && (

                <div className="message-row assistant">


                  <div className="message-avatar">

                    <Bot size={20} />

                  </div>



                  <div className="message-body">

                    <span className="message-name">

                      MIKE AI

                    </span>

                    <p>MIKE AI is thinking...</p>

                  </div>


                </div>

              )}



              <div ref={bottomRef}></div>


            </div>


          )}


        </section>



        {/* INPUT AREA */}

        <footer className="input-section">


          <div className="input-box">


            <textarea

              value={input}

              onChange={(e) => setInput(e.target.value)}

              onKeyDown={(e) => {

                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {

                  e.preventDefault();

                  sendMessage();

                }

              }}

              placeholder="Message MIKE AI..."

              rows="1"

              disabled={loading}

            />



            <div className="input-actions">


              <button
                className="voice-button"
                title="Voice input"
              >

                <Mic size={19} />

              </button>



              <span className="keyboard-hint">

                Enter to send · Shift + Enter for new line

              </span>



              <button

                className="send-button"

                onClick={sendMessage}

                disabled={!input.trim() || loading}

              >

                <Send size={18} />

              </button>


            </div>


          </div>



          <p className="footer-note">

            MIKE AI can make mistakes. Verify important information.

          </p>


        </footer>


      </main>


    </div>

  );

}


export default App;