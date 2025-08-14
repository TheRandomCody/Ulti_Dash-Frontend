// js/dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('discord_access_token');
    if (!accessToken) {
        window.location.href = '/';
        return;
    }

    const userInfo = document.getElementById('user-info');
    const welcomeMessage = document.getElementById('welcome-message');

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
        // Display the error on the page instead of immediately redirecting
        welcomeMessage.textContent = 'Could not load dashboard.';
        const mainContent = document.querySelector('main.container');
        if(mainContent) {
            mainContent.innerHTML += `<p class="text-red-500 mt-4 text-center">Error: ${error.message}. Please try logging in again.</p>`;
        }
        // Still log out after a delay so the user can see the error
        localStorage.removeItem('discord_access_token');
        setTimeout(() => {
            // window.location.href = '/'; // You can re-enable this later if you want
        }, 5000);
    }
});
