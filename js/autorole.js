// js/autorole.js

let serverRoles = [];

// --- UTILITY FUNCTIONS ---
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const toastEl = document.createElement('div');
        toastEl.id = 'toast';
        document.body.appendChild(toastEl);
    }
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- INITIALIZATION ---
async function initializeAutoRolePage() {
    const accessToken = localStorage.getItem('discord_access_token');
    if (!accessToken) { window.location.href = 'https://www.ulti-bot.com/'; return; }

    const guildId = window.location.hash.substring(1);
    if (!guildId) { window.location.href = 'https://www.ulti-bot.com/dashboard.html'; return; }

    const mainContent = document.getElementById('main-content');
    
    try {
        const response = await fetch(`https://api.ulti-bot.com/api/guild/${guildId}/details`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error(`Could not fetch server details. Status: ${response.status}`);

        const data = await response.json();
        const { guild, roles, savedSettings } = data;
        
        serverRoles = roles.filter(role => role.id !== guild.id);

        populateHeader(guild);
        populateAutoRolePanel(savedSettings ? savedSettings.autoRole : null);
        updateSidebarLinks(guildId);
        setupEventListeners();

    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `<div class="text-center"><h1 class="text-4xl font-bold text-red-500">An Error Occurred</h1><p class="text-gray-400 mt-4">Could not load server data.</p><p class="text-gray-500 text-sm mt-2">Error: ${error.message}</p><a href="/dashboard.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Back to Server List</a></div>`;
    }
}

// --- UI POPULATION & EVENT LISTENERS ---
function populateHeader(guild) {
    const serverHeader = document.getElementById('server-header');
    const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/1.png';
    serverHeader.innerHTML = `<img src="${iconUrl}" alt="Server Icon" class="w-16 h-16 rounded-full"><h1 class="text-4xl font-bold">${guild.name}</h1>`;
}

function populateAutoRolePanel(settings) {
    const panel = document.getElementById('autorole-settings');
    const createOptions = (elements, nameField) => `<option value="">Select...</option>` + elements.map(el => `<option value="${el.id}">${el[nameField]}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Auto Role Settings</h2>
        <form id="autorole-form" class="bg-gray-800 p-8 rounded-lg max-w-2xl space-y-4">
            <div>
                <label for="join-role" class="block text-sm font-medium text-gray-300 mb-2">Join Role</label>
                <select id="join-role" name="joinRoleId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverRoles, 'name')}</select>
                <p class="text-sm text-gray-400 mt-1">Automatically give this role to every new member who joins.</p>
            </div>
            <div class="pt-4">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Auto Role Settings</button>
            </div>
        </form>`;
    if (settings) {
        panel.querySelector('#join-role').value = settings.joinRoleId || '';
    }
}

function updateSidebarLinks(guildId) {
    const sidebarNav = document.getElementById('sidebar-nav');
    sidebarNav.querySelectorAll('a').forEach(link => {
        const baseHref = link.getAttribute('href').split('#')[0];
        link.href = `${baseHref}#${guildId}`;
    });
}

function setupEventListeners() {
    const autoRoleForm = document.getElementById('autorole-form');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    autoRoleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = autoRoleForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
        const formData = new FormData(autoRoleForm);
        const payload = {
            guildId,
            settings: {
                joinRoleId: formData.get('joinRoleId'),
            }
        };
        try {
            const response = await fetch('https://api.ulti-bot.com/api/settings/autorole', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save auto role settings.');
            showToast('Auto Role settings saved!', 'success');
        } catch (error) {
            showToast('Error saving auto role settings.', 'error');
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Auto Role Settings';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeAutoRolePage);
