class QuietConnect {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.init();
    }

    init() {
        // Handle waiting page
        const waitingPage = document.querySelector('#status');
        if (waitingPage) {
            this.handleWaitingPage();
        }

        // Handle chat page
        const chatPage = document.querySelector('.chat-page');
        if (chatPage) {
            this.handleChatPage();
        }
    }

    handleWaitingPage() {
        const status = document.getElementById('status');
        
        // Connect to backend and wait for match
        this.socket = io('https://quiet-connect.onrender.com', {
            timeout: 20000,
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            status.innerHTML = `
                <div class="waiting-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <p>A quiet companion found. Entering chat...</p>
            `;
            
            // Request a match
            this.socket.emit('find_match');
        });

        this.socket.on('match_found', (roomId) => {
            this.currentRoom = roomId;
            setTimeout(() => {
                window.location.href = `chat.html?room=${roomId}`;
            }, 1500);
        });

        this.socket.on('connect_error', (error) => {
            status.innerHTML = `
                <p>Server waking up... This may take up to 30 seconds on first connection.</p>
                <p>Refresh if waiting longer than 1 minute.</p>
            `;
        });

        // Handle disconnect gracefully
        this.socket.on('disconnect', () => {
            status.innerHTML = `
                <div class="waiting-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
                <p>Reconnecting...</p>
            `;
        });
    }

    handleChatPage() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentRoom = urlParams.get('room');
        
        if (!this.currentRoom) {
            window.location.href = 'waiting.html';
            return;
        }

        this.socket = io('https://quiet-connect.onrender.com');
        
        const messagesEl = document.getElementById('messages');
        const inputEl = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusEl = document.getElementById('connectionStatus');

        // Join room on connect
        this.socket.on('connect', () => {
            statusEl.textContent = '● Connected';
            statusEl.className = 'status-indicator connected';
            this.socket.emit('join_room', this.currentRoom);
        });

        // Receive messages
        this.socket.on('message', (data) => {
            this.addMessage(data, false);
        });

        // Connection status
        this.socket.on('disconnect', () => {
            statusEl.textContent = '● Disconnected';
            statusEl.className = 'status-indicator disconnected';
        });

        // Send message
        function sendMessage() {
            const message = inputEl.value.trim();
            if (!message || !this.socket.connected) return;

            this.socket.emit('send_message', {
                room: this.currentRoom,
                message: message
            });

            this.addMessage({ message: message, timestamp: Date.now() }, true);
            inputEl.value = '';
        }

        // Event listeners
        sendBtn.addEventListener('click', sendMessage.bind(this));
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage.call(this);
            }
        });

        // Focus input
        inputEl.focus();
    }

    addMessage(data, isSent) {
        const messagesEl = document.getElementById('messages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : 'received'}`;

        const time = new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-avatar">${isSent ? 'You' : '●'}</div>
            <div class="message-bubble">
                ${data.message}
                <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.5rem;">${time}</div>
            </div>
        `;

        messagesEl.appendChild(messageEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Auto-scroll
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuietConnect();
});
