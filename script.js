document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Stores the conversation history for the API call
    let chatHistory = [];

    // Function to add a message to the chat log
    function addMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('flex', 'mb-4', 'animate-fade-in');

        const bubble = document.createElement('div');
        bubble.classList.add('rounded-lg', 'p-3', 'max-w-md', 'shadow');

        if (sender === 'user') {
            messageElement.classList.add('justify-end');
            bubble.classList.add('bg-blue-500', 'text-white');
        } else {
            messageElement.classList.add('justify-start');
            bubble.classList.add('bg-gray-200', 'text-gray-800');
        }
        
        bubble.innerHTML = message.replace(/\n/g, '<br>');
        messageElement.appendChild(bubble);
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the bottom
    }
    
    // Function to show a loading indicator
    function showLoadingIndicator() {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loading';
        loadingElement.classList.add('flex', 'justify-start', 'mb-4');
        loadingElement.innerHTML = `
            <div class="bg-gray-200 text-gray-800 rounded-lg p-3 shadow">
                <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                    <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
                </div>
            </div>
        `;
        chatLog.appendChild(loadingElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Function to remove the loading indicator
    function hideLoadingIndicator() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();

        if (!userMessage) return;

        addMessage('user', userMessage);
        userInput.value = '';
        sendButton.disabled = true;
        
        showLoadingIndicator();

        try {
            // Add user message to history for the API
            chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            
            // Prepare payload for the Gemini API
            const payload = {
                contents: chatHistory
            };

            // IMPORTANT: Replace with your own API key when running locally
            const apiKey = "AIzaSyCgAxQcV3yjQmeE-UNmqKV1ruZH5LtKfh4"; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }

            const result = await response.json();
            
            hideLoadingIndicator();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                
                const botMessage = result.candidates[0].content.parts[0].text;
                addMessage('bot', botMessage);
                // Add bot response to history
                chatHistory.push({ role: "model", parts: [{ text: botMessage }] });
            } else {
                addMessage('bot', "I'm sorry, I couldn't generate a response. Please try again.");
            }

        } catch (error) {
            hideLoadingIndicator();
            console.error("Error fetching from Gemini API:", error);
            addMessage('bot', "Oops! Something went wrong. Please check the console for errors.");
        } finally {
            sendButton.disabled = false;
            userInput.focus();
        }
    });
});
