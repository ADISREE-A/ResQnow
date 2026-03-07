import React, { useState } from "react";

const EmergencyContacts = ({ showAll = false }) => {
  const [showAllContacts, setShowAllContacts] = useState(showAll);

  // Emergency contacts by category
  const emergencyContacts = {
    "🚨 Life Threatening": [
      { name: "Emergency Services (Police/Fire/Ambulance)", number: "911", available: "24/7" },
      { name: "Poison Control", number: "1-800-222-1222", available: "24/7" }
    ],
    "👮 Police": [
      { name: "Police Emergency", number: "911", available: "24/7" },
      { name: "Non-Emergency Police", number: "311", available: "24/7" },
      { name: "FBI", number: "1-202-324-3000", available: "24/7" }
    ],
    "🏥 Medical": [
      { name: "Ambulance", number: "911", available: "24/7" },
      { name: "Medical Emergency", number: "911", available: "24/7" },
      { name: "Nurse Hotline", number: "1-800-622-6232", available: "24/7" }
    ],
    "🔥 Fire": [
      { name: "Fire Emergency", number: "911", available: "24/7" },
      { name: "Fire Department (Non-emergency)", number: "311", available: "24/7" }
    ],
    "🆘 Crisis Support": [
      { name: "National Suicide Prevention", number: "988", available: "24/7" },
      { name: "Domestic Violence Hotline", number: "1-800-799-7233", available: "24/7" },
      { name: "Child Abuse Hotline", number: "1-800-422-4453", available: "24/7" },
      { name: "Disaster Relief", number: "211", available: "24/7" }
    ],
    "🌍 International": [
      { name: "US Embassy (General)", number: "1-888-407-4747", available: "24/7" },
      { name: "Interpol", number: "+33-1-44-37-37-37", available: "24/7" }
    ]
  };

  const quickDial = (number) => {
    window.location.href = `tel:${number}`;
  };

  // Get first categories for compact few view
  const visibleCategories = showAllContacts || showAll
    ? Object.keys(emergencyContacts) 
    : ["🚨 Life Threatening", "👮 Police", "🏥 Medical"];

  return (
    <div style={{
      backgroundColor: "#1a1a1a",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
      color: "white"
    }}>
      {!showAll && (
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "15px"
        }}>
          <h2 style={{ margin: 0 }}>📞 Emergency Contacts</h2>
          <button
            onClick={() => setShowAllContacts(!showAllContacts)}
            style={{
              background: "none",
              border: "1px solid #4da6ff",
              color: "#4da6ff",
              padding: "5px 12px",
              borderRadius: "15px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {showAllContacts ? "Show Less" : "Show All"}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: "15px" }}>
        {visibleCategories.map((category) => (
          <div key={category} style={{
            backgroundColor: "#222",
            padding: "15px",
            borderRadius: "8px"
          }}>
            <h3 style={{ 
              margin: "0 0 10px 0", 
              color: "#ff6b6b",
              fontSize: "16px"
            }}>
              {category}
            </h3>
            {emergencyContacts[category].map((contact, index) => (
              <div key={index} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: index < emergencyContacts[category].length - 1 ? "1px solid #333" : "none"
              }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{contact.name}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>
                    Available: {contact.available}
                  </div>
                </div>
                <button
                  onClick={() => quickDial(contact.number)}
                  style={{
                    backgroundColor: "#4da6ff",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                >
                  📱 {contact.number}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ 
        marginTop: "20px", 
        display: "grid", 
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: "10px" 
      }}>
        <button
          onClick={() => quickDial("911")}
          style={{
            backgroundColor: "#ff4444",
            color: "white",
            border: "none",
            padding: "15px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          🚨 CALL 911
        </button>
        <button
          onClick={() => quickDial("311")}
          style={{
            backgroundColor: "#ff9933",
            color: "white",
            border: "none",
            padding: "15px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          📞 CALL 311
        </button>
        <button
          onClick={() => quickDial("988")}
          style={{
            backgroundColor: "#9b59b6",
            color: "white",
            border: "none",
            padding: "15px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          🧠 988 CRISIS
        </button>
      </div>
    </div>
  );
};

export default EmergencyContacts;

