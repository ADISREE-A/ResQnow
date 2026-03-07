import React, { useState, useEffect, useRef } from "react";
import { speak } from "../utils/voice";

// OpenAI API configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";
const API_URL = "https://api.openai.com/v1/chat/completions";

const AIChatbot = ({ currentHazard, userLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI Emergency Assistant. I can help you with survival guidance, emergency procedures, and safety tips. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Emergency context for the AI
  const getEmergencyContext = () => {
    let context = "You are an emergency survival assistant. ";
    if (currentHazard) {
      context += `Current emergency situation: ${currentHazard}. `;
    }
    if (userLocation) {
      context += `User location: ${userLocation.lat}, ${userLocation.lng}. `;
    }
    context += "Provide concise, life-saving guidance. Keep responses short and actionable.";
    return context;
  };

  // Quick action buttons
  const quickActions = [
    { label: "🔥 Fire Safety", prompt: "What should I do if there's a fire?" },
    { label: "🌊 Flood Safety", prompt: "What should I do during a flood?" },
    { label: "🏥 First Aid", prompt: "Give me basic first aid instructions" },
    { label: "🚨 Emergency Contacts", prompt: "What emergency numbers should I call?" },
    { label: "🆘 SOS Tips", prompt: "Give me survival tips" },
    { label: "📍 My Location", prompt: `I'm at coordinates ${userLocation?.lat}, ${userLocation?.lng}. What's nearby?` }
  ];

  // Send message to OpenAI
  const sendMessage = async (userMessage = input) => {
    if (!userMessage.trim() || isLoading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: userMessage }
    ];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Check if API key is available
      if (!OPENAI_API_KEY) {
        // Fallback to rule-based responses
        const response = getRuleBasedResponse(userMessage);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        speak(response);
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: getEmergencyContext() },
            ...newMessages
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const aiResponse = data.choices[0].message.content;
        setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
        speak(aiResponse);
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback to rule-based
      const fallbackResponse = getRuleBasedResponse(userMessage);
      setMessages(prev => [...prev, { role: "assistant", content: fallbackResponse + "\n\n(AI service unavailable - using offline mode)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rule-based fallback responses
  const getRuleBasedResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("fire")) {
      return "🔥 FIRE SAFETY:\n1. Stay low to avoid smoke\n2. Feel doors before opening\n3. Use wet cloth to cover nose\n4. Exit calmly, don't run\n5. Call 911 immediately\n6. If trapped, stay near floor";
    }
    if (lowerMessage.includes("flood")) {
      return "🌊 FLOOD SAFETY:\n1. Move to higher ground immediately\n2. Don't walk or drive through water\n3. 6 inches of water can knock you down\n4. 1 foot of moving water can sweep your car\n5. Avoid bridges over fast-moving water\n6. Stay off electrical equipment in water";
    }
    if (lowerMessage.includes("earthquake")) {
      return "🌍 EARTHQUAKE SAFETY:\n1. DROP to your hands and knees\n2. COVER under sturdy furniture\n3. HOLD ON until shaking stops\n4. Stay away from windows\n5. If outside, move away from buildings\n6. Expect aftershocks";
    }
    if (lowerMessage.includes("medical") || lowerMessage.includes("first aid") || lowerMessage.includes("injured")) {
      return "🏥 FIRST AID BASICS:\n1. Check breathing\n2. Control bleeding with pressure\n3. Don't move injured persons\n4. Apply ice for swelling\n5. Clean wounds carefully\n6. Seek medical help immediately";
    }
    if (lowerMessage.includes("emergency number") || lowerMessage.includes("call")) {
      return "📞 EMERGENCY CONTACTS:\n• Police: 911\n• Fire Department: 911\n• Ambulance: 911\n• Poison Control: 1-800-222-1222\n• Disaster Hotline: 211";
    }
    if (lowerMessage.includes("trapped") || lowerMessage.includes("stuck")) {
      return "🆘 TRAPPED?:\n1. Stay calm, conserve energy\n2. Signal for help (whistle, shout)\n3. Make noise at regular intervals\n4. If phone works, call 911\n5. Stay visible near light/air\n6. Don't panic - help is coming";
    }
    if (lowerMessage.includes("lost") || lowerMessage.includes("direction")) {
      return "🧭 LOST?:\n1. Stay where you are if safe\n2. Share your location\n3. Look for landmarks\n4. Follow water downhill\n5. Stay visible to rescuers\n6. Use phone GPS";
    }
    if (lowerMessage.includes("kidnap") || lowerMessage.includes("abduct")) {
      return "🚨 KIDNAPPING:\n1. Stay calm, avoid panic\n2. Observe surroundings\n3. Remember details\n4. Look for escape opportunities\n5. Once safe, call 911 immediately";
    }
    if (lowerMessage.includes("gas") || lowerMessage.includes("chemical")) {
      return "☢️ GAS/CHEMICAL:\n1. Move upwind immediately\n2. Cover mouth with wet cloth\n3. Avoid skin contact\n4. Get fresh air ASAP\n5. Remove contaminated clothing\n6. Seek medical attention";
    }
    if (lowerMessage.includes("storm") || lowerMessage.includes("lightning")) {
      return "⛈️ STORM SAFETY:\n1. Go indoors immediately\n2. Avoid windows\n3. Don't use electrical equipment\n4. Stay away from trees\n5. If outdoors, crouch low\n6. Wait 30 min after thunder";
    }

    return "I'm here to help! Ask me about:\n• Fire safety\n• Flood safety\n• First aid\n• Earthquake procedures\n• Emergency contacts\n• Trapped/survival tips\n\nOr describe your emergency situation.";
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#4da6ff",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(77, 166, 255, 0.4)",
          zIndex: 1000,
          fontSize: "28px"
        }}
        title="AI Assistant"
      >
        🤖
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "380px",
            height: "500px",
            backgroundColor: "#1a1a1a",
            borderRadius: "15px",
            boxShadow: "0 5px 25px rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #333"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "15px",
              backgroundColor: "#4da6ff",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <strong>🤖 AI Emergency Assistant</strong>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                {OPENAI_API_KEY ? "Online" : "Offline Mode"}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "#222",
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              borderBottom: "1px solid #333"
            }}
          >
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.prompt)}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  backgroundColor: "#333",
                  color: "#ccc",
                  border: "none",
                  borderRadius: "15px",
                  cursor: "pointer"
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "15px"
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "15px",
                    backgroundColor: msg.role === "user" ? "#4da6ff" : "#333",
                    color: "white",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {msg.role === "assistant" && "🤖 "}
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ color: "#888", fontSize: "12px" }}>AI is thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "15px",
              backgroundColor: "#222",
              borderTop: "1px solid #333",
              display: "flex",
              gap: "10px"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask for help..."
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#333",
                color: "white",
                outline: "none"
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading}
              style={{
                padding: "10px 15px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#4da6ff",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;

