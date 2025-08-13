// js/logging.js

let serverChannels = [];

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
async function initializeLoggingPage() {
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
        const { guild, channels, savedSettings } = data;
        
        serverChannels = channels;

        populateHeader(guild);
        populateLoggingPanel(savedSettings ? savedSettings.logging : null);
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

function populateLoggingPanel(settings) {
    const panel = document.getElementById('logging-settings');
    const createOptions = (elements, nameField) => `<option value="">Select...</option>` + elements.map(el => `<option value="${el.id}">${el[nameField]}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Logging Settings</h2>
        <form id="logging-form" class="bg-gray-800 p-8 rounded-lg max-w-2xl space-y-4">
            <div>
                <label for="action-log-channel" class="block text-sm font-medium text-gray-300 mb-2">Action Log Channel</label>
                <select id="action-log-channel" name="actionLogChannelId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverChannels, 'name')}</select>
                <p class="text-sm text-gray-400 mt-1">Logs moderator actions like kicks, bans, and warns.</p>
            </div>
            <div>
                <label for="message-log-channel" class="block text-sm font-medium text-gray-300 mb-2">Message Log Channel</label>
                <select id="message-log-channel" name="messageLogChannelId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverChannels, 'name')}</select>
                <p class="text-sm text-gray-400 mt-1">Logs all edited and deleted messages.</p>
            </div>
            <div class="pt-4">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Logging Settings</button>
            </div>
        </form>`;
    if (settings) {
        panel.querySelector('#action-log-channel').value = settings.actionLogChannelId || '';
        panel.querySelector('#message-log-channel').value = settings.messageLogChannelId || '';
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
    const loggingForm = document.getElementById('logging-form');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    loggingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = loggingForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
        const formData = new FormData(loggingForm);
        const payload = {
            guildId,
            settings: {
                actionLogChannelId: formData.get('actionLogChannelId'),
                messageLogChannelId: formData.get('messageLogChannelId'),
            }
        };
        try {
            const response = await fetch('https://api.ulti-bot.com/api/settings/logging', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save logging settings.');
            showToast('Logging settings saved!', 'success');
        } catch (error) {
            showToast('Error saving logging settings.', 'error');
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Logging Settings';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeLoggingPage);
