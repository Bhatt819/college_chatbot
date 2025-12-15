// ================= CHATBOT ELEMENTS =================
const chatbotIcon = document.getElementById("chatbotIcon");
const chatbotContainer = document.getElementById("chatbotContainer");
const chatbotClose = document.getElementById("chatbotClose");
const chatbotMessages = document.getElementById("chatbotMessages");
const chatbotInput = document.getElementById("chatbotInput");
const chatbotSend = document.getElementById("chatbotSend");

// ================= OPEN / CLOSE =================
chatbotIcon.addEventListener("click", () => {
    chatbotContainer.style.display = "flex";
    void chatbotContainer.offsetWidth;
    chatbotContainer.classList.add("show");
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    chatbotInput.focus();
});

chatbotClose.addEventListener("click", () => {
    chatbotContainer.classList.remove("show");
    setTimeout(() => {
        chatbotContainer.style.display = "none";
    }, 300);
});

// ================= ADD MESSAGE =================
function addMessage(message, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "user-message user-slide-in" : "bot-message message-slide-in";
    div.innerText = message;
    chatbotMessages.appendChild(div);

    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return div;
}

// ================= TYPING INDICATOR =================
function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "bot-message typing-indicator message-slide-in";
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <span></span><span></span><span></span>
        </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingDiv;
}

function removeTypingIndicator(el) {
    if (el && el.parentNode) el.remove();
}

// ================= SEND MESSAGE WITH 2 SECOND DELAY =================
async function sendMessage() {
    const text = chatbotInput.value.trim();
    if (text === "") return;

    // Add user message
    addMessage(text, "user");
    chatbotInput.value = "";
    chatbotInput.focus();

    // Show typing indicator
    const typing = showTypingIndicator();

    try {
        // Start timer for minimum 2 seconds delay
        const startTime = Date.now();
        const minDelay = 2000; // 2 seconds

        // Fetch response from server
        const response = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: text })
        });

        const data = await response.json();
        
        // Calculate remaining time to complete 2 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minDelay - elapsedTime;
        
        // Wait for remaining time (if any) before showing response
        setTimeout(() => {
            removeTypingIndicator(typing);
            addMessage(data.reply, "bot");
        }, remainingTime > 0 ? remainingTime : 0);

    } catch (error) {
        // For error also wait 2 seconds
        setTimeout(() => {
            removeTypingIndicator(typing);
            addMessage(
                "Sorry, server se connect nahi ho pa raha. Please try again.",
                "bot"
            );
        }, 2000);
        console.error("Chatbot Error:", error);
    }
}

// ================= ENTER KEY & CLICK EVENTS =================
chatbotSend.addEventListener("click", sendMessage);

chatbotInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

// Close chatbot if clicked outside
document.addEventListener("click", (e) => {
    if (
        !chatbotContainer.contains(e.target) &&
        !chatbotIcon.contains(e.target) &&
        chatbotContainer.classList.contains("show")
    ) {
        chatbotClose.click();
    }
});

// ================= INITIAL MESSAGE WITH DELAYS =================
document.addEventListener("DOMContentLoaded", () => {
    chatbotMessages.innerHTML = "";
    
    // Add first message after 300ms delay
    setTimeout(() => {
        addMessage("Hello! I'm GEHU Assistant 👋", "bot");
        
        // Add second message after 800ms more delay
        setTimeout(() => {
            addMessage(
                "You can ask me about courses, fees, admissions, hostel, campus, or placements.",
                "bot"
            );
        }, 800);
    }, 300);
});

// ================= GLOBAL ACCESS =================
window.Chatbot = {
    open: () => chatbotIcon.click(),
    close: () => chatbotClose.click(),
    send: sendMessage
};

// ================= AUTO-CLOSE ON MOBILE SCROLL =================
let touchStartY = 0;
let touchEndY = 0;

chatbotContainer.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
}, false);

chatbotContainer.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    // If swipe down more than 50px, close chatbot
    if (touchStartY - touchEndY > 50) {
        chatbotClose.click();
    }
}, false);

// ================= CHAT HISTORY =================
let chatHistory = [];

// Function to save chat to localStorage
function saveChatToStorage() {
    const chatData = {
        messages: chatHistory,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('gehuChatHistory', JSON.stringify(chatData));
}

// Function to load chat from localStorage
function loadChatFromStorage() {
    const saved = localStorage.getItem('gehuChatHistory');
    if (saved) {
        const data = JSON.parse(saved);
        chatHistory = data.messages || [];
        
        // Clear current messages and load saved ones
        if (chatHistory.length > 0) {
            chatbotMessages.innerHTML = '';
            chatHistory.forEach(msg => {
                addMessage(msg.text, msg.sender);
            });
        }
    }
}

// Modify addMessage to save to history
function addMessageAndSave(message, sender) {
    addMessage(message, sender);
    chatHistory.push({
        text: message,
        sender: sender,
        time: new Date().toISOString()
    });
    
    // Keep only last 50 messages
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }
    
    saveChatToStorage();
}

// Update sendMessage to use addMessageAndSave
async function sendMessage() {
    const text = chatbotInput.value.trim();
    if (text === "") return;

    // Add user message
    addMessageAndSave(text, "user");
    chatbotInput.value = "";
    chatbotInput.focus();

    // Show typing indicator
    const typing = showTypingIndicator();

    try {
        // Start timer for minimum 2 seconds delay
        const startTime = Date.now();
        const minDelay = 2000; // 2 seconds

        // Fetch response from server
        const response = await fetch("/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: text })
        });

        const data = await response.json();
        
        // Calculate remaining time to complete 2 seconds
        const elapsedTime = Date.now() - startTime;
        const remainingTime = minDelay - elapsedTime;
        
        // Wait for remaining time (if any) before showing response
        setTimeout(() => {
            removeTypingIndicator(typing);
            addMessageAndSave(data.reply, "bot");
        }, remainingTime > 0 ? remainingTime : 0);

    } catch (error) {
        // For error also wait 2 seconds
        setTimeout(() => {
            removeTypingIndicator(typing);
            addMessageAndSave(
                "Sorry, server se connect nahi ho pa raha. Please try again.",
                "bot"
            );
        }, 2000);
        console.error("Chatbot Error:", error);
    }
}

// Load chat history when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadChatFromStorage();
    
    // If no history, show initial messages
    if (chatHistory.length === 0) {
        setTimeout(() => {
            addMessageAndSave("Hello! I'm GEHU Assistant 👋", "bot");
            
            setTimeout(() => {
                addMessageAndSave(
                    "You can ask me about courses, fees, admissions, hostel, campus, or placements.",
                    "bot"
                );
            }, 800);
        }, 300);
    }
});

// ================= CLEAR CHAT FUNCTION =================
function clearChatHistory() {
    if (confirm("Are you sure you want to clear all chat history?")) {
        chatHistory = [];
        chatbotMessages.innerHTML = '';
        localStorage.removeItem('gehuChatHistory');
        
        // Show initial messages again
        setTimeout(() => {
            addMessageAndSave("Hello! I'm GEHU Assistant 👋", "bot");
            
            setTimeout(() => {
                addMessageAndSave(
                    "You can ask me about courses, fees, admissions, hostel, campus, or placements.",
                    "bot"
                );
            }, 800);
        }, 300);
    }
}

// Add clear button to header (optional)
const clearButton = document.createElement('span');
clearButton.className = 'chatbot-clear';
clearButton.innerHTML = '🗑️';
clearButton.title = 'Clear Chat History';
clearButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 45px;
    cursor: pointer;
    font-size: 18px;
    color: white;
    padding: 2px 5px;
    border-radius: 3px;
    transition: background-color 0.3s;
`;
clearButton.addEventListener('click', clearChatHistory);
clearButton.addEventListener('mouseenter', () => {
    clearButton.style.backgroundColor = 'rgba(255,255,255,0.1)';
});
clearButton.addEventListener('mouseleave', () => {
    clearButton.style.backgroundColor = 'transparent';
});

document.querySelector('.chatbot-header').appendChild(clearButton);