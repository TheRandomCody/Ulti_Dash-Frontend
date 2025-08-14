// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('discord_access_token');
    if (!accessToken) {
        window.location.href = '/';
        return;
    }

    const userInfo = document.getElementById('user-info');
    const welcomeMessage = document.getElementById('welcome-message');
    const mainContent = document.querySelector('main.container');

    try {
        const response = await fetch('https://api.ulti-bot.com/auth/user', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            // If the response is not OK, throw an error with the status
            throw new Error(`Failed to fetch user data. Status: ${response.status}`);
        }

        const user = await response.json();
        
        welcomeMessage.textContent = `Welcome, ${user.username}!`;
        
        const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        userInfo.innerHTML = `
            <span>${user.username}</span>
            <img src="${avatarUrl}" alt="Avatar" class="w-10 h-10 rounded-full">
            <button id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg">Logout</button>
        `;

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('discord_access_token');
            window.location.href = '/';
        });

        // Placeholder functionality for the new buttons
        document.getElementById('view-profile-btn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('The user profile page is coming soon!');
        });

        document.getElementById('find-servers-btn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('The server discovery page is coming soon!');
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        // Display the error on the page permanently for debugging
        if (welcomeMessage) {
            welcomeMessage.textContent = 'Could not load dashboard.';
        }
        if (mainContent) {
            mainContent.innerHTML += `<p class="text-red-500 mt-4 text-center"><strong>Error:</strong> ${error.message}. Please check the console (F12) for more details and report this error.</p>`;
        }
        // Temporarily disable the logout to see the error
        // localStorage.removeItem('discord_access_token');
    }
});
