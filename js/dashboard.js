// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    const headerUserProfile = document.getElementById('header-user-profile');
    const mainUserProfile = document.getElementById('user-profile-section');
    const serverListContainer = document.getElementById('server-list');
    const loadingPlaceholder = document.getElementById('loading-placeholder');

    const accessToken = localStorage.getItem('discord_access_token');
    
    if (!accessToken) {
        window.location.href = 'https://www.ulti-bot.com/';
        return;
    }

    try {
        // --- Fetch Essential Data First ---
        const [userResponse, guildsResponse] = await Promise.all([
            fetch('https://api.ulti-bot.com/api/auth/user', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
            fetch('https://api.ulti-bot.com/api/auth/guilds', { headers: { 'Authorization': `Bearer ${accessToken}` } })
        ]);

        if (!userResponse.ok || !guildsResponse.ok) {
            throw new Error('Failed to fetch essential user or server data.');
        }

        const user = await userResponse.json();
        const guilds = await guildsResponse.json();
        
        // --- Populate Header ---
        const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        headerUserProfile.innerHTML = `
            <span class="font-semibold hidden sm:block">${user.username}</span>
            <img src="${avatarUrl}" alt="User Avatar" class="w-10 h-10 rounded-full">
            <a href="#" id="logout-btn" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Logout</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('discord_access_token');
            window.location.href = 'https://www.ulti-bot.com/';
        });

        // --- Populate Main Profile Section (with placeholders) ---
        const ownedGuilds = guilds.filter(g => g.owner);
        mainUserProfile.innerHTML = `
            <div class="flex flex-col md:flex-row items-center gap-6">
                <img src="${avatarUrl}" alt="User Avatar" class="w-32 h-32 rounded-full border-4 border-gray-700">
                <div class="flex-1">
                    <h2 class="text-3xl font-bold">${user.global_name || user.username}</h2>
                    <p class="text-gray-400">@${user.username} (${user.id})</p>
                    <div id="profile-stats" class="flex flex-wrap gap-4 mt-4 text-sm">
                        <div class="bg-gray-700 p-2 rounded-md"><strong>Age:</strong> <span id="age-stat">N/A</span></div>
                        <div class="bg-gray-700 p-2 rounded-md"><strong>Bans in Network:</strong> <span id="bans-stat">N/A</span></div>
                        <div class="bg-gray-700 p-2 rounded-md"><strong>Verification Status:</strong> <span id="verification-stat">N/A</span></div>
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <button id="verify-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full">Verify Your Account</button>
                    <button class="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg w-full">Find Servers</button>
                </div>
            </div>
            ${ownedGuilds.length > 0 ? `
            <div class="mt-6 border-t border-gray-700 pt-4">
                <h3 class="font-bold mb-2">Servers You Own:</h3>
                <div class="flex flex-wrap gap-2">
                    ${ownedGuilds.map(g => `<span class="bg-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">${g.name}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        `;

        // Add event listener for the verification button
        document.getElementById('verify-btn').addEventListener('click', async () => {
            const verifyBtn = document.getElementById('verify-btn');
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Creating Session...';

            try {
                const response = await fetch('https://api.ulti-bot.com/stripe/create-verification-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({ discordId: user.id })
                });

                if (!response.ok) {
                    throw new Error('Failed to create Stripe session.');
                }

                const data = await response.json();
                window.location.href = data.url;

            } catch (error) {
                console.error('Verification Error:', error);
                alert('Could not start the verification process. Please try again later.');
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify Your Account';
            }
        });

        // --- Asynchronously Fetch and Populate Profile Details ---
        try {
            const profileDetailsResponse = await fetch('https://api.ulti-bot.com/api/profile/details', { headers: { 'Authorization': `Bearer ${accessToken}` } });
            if (profileDetailsResponse.ok) {
                const profileDetails = await profileDetailsResponse.json();
                let age = 'Not Set';
                if (profileDetails.birthday) {
                    const birthDate = new Date(profileDetails.birthday);
                    const ageDifMs = Date.now() - birthDate.getTime();
                    const ageDate = new Date(ageDifMs);
                    age = Math.abs(ageDate.getUTCFullYear() - 1970);
                }
                document.getElementById('age-stat').textContent = age;
                document.getElementById('bans-stat').textContent = profileDetails.banCount;
                document.getElementById('verification-stat').textContent = profileDetails.isStripeVerified ? 'Verified' : 'Unverified';
            } else {
                 console.error('Failed to fetch profile details, but continuing with page load.');
            }
        } catch (profileError) {
            console.error('Error fetching profile details:', profileError);
        }

        // --- Populate Server List ---
        loadingPlaceholder.style.display = 'none';
        if (guilds.length > 0) {
            serverListContainer.innerHTML = '';
            guilds.forEach(guild => {
                const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/1.png';
                const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${user.clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}&disable_guild_select=true`;
                let cardContent;
                if (guild.botInGuild && guild.canManage) {
                    cardContent = `<a href="/verification.html#${guild.id}" class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">...</a>`;
                } else if (!guild.botInGuild && guild.canManage) {
                    cardContent = `<div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">...</div>`;
                } else if (guild.botInGuild && !guild.canManage) {
                    cardContent = `<div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">...</div>`;
                } else {
                    cardContent = `<div class="server-card bg-gray-800 rounded-lg overflow-hidden block relative">...</div>`;
                }
                serverListContainer.innerHTML += cardContent.replace('...', `
                    <img src="${iconUrl}" alt="${guild.name} Icon" class="w-full h-32 object-cover">
                    <div class="p-4">
                        <h3 class="font-bold text-lg truncate">${guild.name}</h3>
                        <p class="text-sm ${guild.botInGuild && guild.canManage ? 'text-green-400' : 'text-gray-400'}">${guild.botInGuild && guild.canManage ? 'Manage Server' : 'Member'}</p>
                    </div>
                `);
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