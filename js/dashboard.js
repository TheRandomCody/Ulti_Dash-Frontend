// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const userProfileContainer = document.getElementById('user-profile');
    const serverListContainer = document.getElementById('server-list');
    const loadingPlaceholder = document.getElementById('loading-placeholder');

    const accessToken = localStorage.getItem('discord_access_token');
    
    if (!accessToken) {
        window.location.href = 'https://www.ulti-bot.com/';
        return;
    }

    try {
        const userResponse = await fetch('https://api.ulti-bot.com/api/auth/user', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!userResponse.ok) throw new Error('Failed to fetch user data.');
        const user = await userResponse.json();
        
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        userProfileContainer.innerHTML = `
            <span class="font-semibold">${user.username}</span>
            <img src="${avatarUrl}" alt="User Avatar" class="w-10 h-10 rounded-full">
            <a href="#" id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Logout</a>
        `;

        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('discord_access_token');
            window.location.href = 'https://www.ulti-bot.com/';
        });

        const guildsResponse = await fetch('https://api.ulti-bot.com/api/auth/guilds', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!guildsResponse.ok) throw new Error('Failed to fetch server data.');
        const guilds = await guildsResponse.json();

        loadingPlaceholder.style.display = 'none';
        
        if (guilds.length > 0) {
            serverListContainer.innerHTML = '';
            guilds.forEach(guild => {
                const iconUrl = guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                    : 'https://cdn.discordapp.com/embed/avatars/1.png';
                
                let cardContent;
                const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${user.clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}&disable_guild_select=true`;

                if (guild.botInGuild && guild.canManage) {
                    cardContent = `
                        <a href="/verification.html#${guild.id}" class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">
                            <img src="${iconUrl}" alt="${guild.name} Icon" class="w-full h-32 object-cover">
                            <div class="p-4">
                                <h3 class="font-bold text-lg truncate">${guild.name}</h3>
                                <p class="text-sm text-green-400">Manage Server</p>
                            </div>
                        </a>`;
                } else if (!guild.botInGuild && guild.canManage) {
                    cardContent = `
                        <div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">
                            <img src="${iconUrl}" alt="${guild.name} Icon" class="w-full h-32 object-cover">
                            <div class="p-4">
                                <h3 class="font-bold text-lg truncate">${guild.name}</h3>
                                <p class="text-sm text-blue-400">Ready to Invite</p>
                            </div>
                            <div class="card-overlay">
                                <a href="${inviteUrl}" target="_blank" rel="noopener noreferrer" class="invite-button">Invite Ulti-Bot</a>
                            </div>
                        </div>`;
                } else if (guild.botInGuild && !guild.canManage) {
                    cardContent = `
                        <div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">
                            <img src="${iconUrl}" alt="${guild.name} Icon" class="w-full h-32 object-cover">
                            <div class="p-4">
                                <h3 class="font-bold text-lg truncate">${guild.name}</h3>
                                <p class="text-sm text-gray-400">Permissions Needed</p>
                            </div>
                            <div class="card-overlay" style="background-color: rgba(239, 68, 68, 0.7);">
                                <span class="font-bold text-white">Lacks Modify Permissions</span>
                            </div>
                        </div>`;
                } else { // !guild.botInGuild && !guild.canManage
                    cardContent = `
                        <div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">
                            <img src="${iconUrl}" alt="${guild.name} Icon" class="w-full h-32 object-cover">
                            <div class="p-4">
                                <h3 class="font-bold text-lg truncate">${guild.name}</h3>
                                <p class="text-sm text-gray-400">Permissions Needed</p>
                            </div>
                            <div class="card-overlay" style="background-color: rgba(17, 24, 39, 0.8);">
                                <span class="font-bold text-white">Lacks Invite Permissions</span>
                            </div>
                        </div>`;
                }
                serverListContainer.innerHTML += cardContent;
            });
        } else {
            serverListContainer.innerHTML = '<p class="col-span-full text-center text-gray-400">You are not in any servers.</p>';
        }

    } catch (error) {
        console.error('Dashboard Error:', error);
        loadingPlaceholder.textContent = 'Failed to load dashboard. Please try logging in again.';
        localStorage.removeItem('discord_access_token');
        setTimeout(() => window.location.href = 'https://www.ulti-bot.com/', 3000);
    }
});
