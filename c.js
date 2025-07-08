const API_BASE_URL = 'http://localhost:3000';
let chatRefreshInterval = null;
let currentChatName = null;

async function start() {
    document.body.innerHTML = `
        <div id="sidebar">
            <h2>StakChat</h2>
            <ul>
                ${people()}
            </ul>
        </div>
        <div id="chatarea">
            <h1>Welcome to StakChat!</h1>
            <p>Select a friend to start chatting.</p>
        </div>
    `;
}

const user = JSON.parse(localStorage.getItem('StakChat-User'));

async function defineFriends() {
    if (!user) {
        window.location.href = 'https://ayaan-creator-web.github.io/StakChat/l.html';
    } else {
        try {
            friends = await fetch(`${API_BASE_URL}/users/${user.username}`).then(res => res.json());
        } catch (error) {
            console.error('Error fetching friends:', error);
            friends = [];
        }
        start();
    }
}
defineFriends();

function people() {
    return friends.map((friend) => {
        return `<li onclick="loadChat('${friend.name}')">${friend.name}</li>`;
    }).join('');
}

async function loadChat(name) {
    const chatArea = document.getElementById('chatarea');

    if (currentChatName !== name) {
        if (chatRefreshInterval) {
            clearInterval(chatRefreshInterval);
        }
        currentChatName = name;

        chatArea.innerHTML = `
            <h1>Chat with ${name}</h1>
            <div class="messages" id="messagesContainer"></div>
            <div class="chat-input">
                <input type="text" onkeydown="isEnter(event, () => send('${name}'))" placeholder="Type your message..." id="messageInput" />
                <button onclick="send('${name}')">Send</button>
            </div>
        `;

        chatArea.dataset.loaded = 'true';
        chatArea.dataset.chatWith = name;

        chatRefreshInterval = setInterval(async () => {
            const messagesContainer = document.getElementById('messagesContainer');
            if (messagesContainer) {
                messagesContainer.innerHTML = await getMessages(name);
            }
        }, 1000);
    }
}

async function getMessages(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${user.username}/${name}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const messages = await response.json();

        if (messages.length === 0) {
            return `<div style="text-align: center; margin-top: 2rem; color: #888;">No messages yet. Say hi!</div>`;
        }

        return messages.map(msg => {
            return `<p class="${msg.fromPerson === user.username ? 'own-message' : ''}"><strong>${from(msg.fromPerson)}</strong> ${msg.msg}</p>`;
        }).join('');
    } catch (error) {
        console.error('Error fetching messages:', error);
        return '<p>Error loading messages.</p>';
    }
}

function from(name) {
    if (name === user.username) {
        return '';
    } else {
        return '';
    }
}

async function send(name) {
    const input = document.getElementById('messageInput');
    const msg = input.value;

    if (!msg || msg.trim() === '') {
        alert('Message cannot be empty!');
        return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString();

    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fromPerson: user.username,
                toPerson: name,
                msg: msg,
                time: time,
                date: date
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message}`);
        }

        input.value = '';
        loadChat(name);
    } catch (error) {
        console.error('Error sending message:', error);
        alert(`Failed to send message: ${error.message || 'Unknown error'}`);
    }
}

function isEnter(event, callback) {
    if (event.key === 'Enter') {
        callback();
    }
}
