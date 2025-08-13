// js/verification.js

let serverRoles = [];
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
async function initializeVerificationPage() {
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
        const { guild, channels, roles, savedSettings } = data;
        
        serverRoles = roles.filter(role => role.id !== guild.id);
        serverChannels = channels;

        populateHeader(guild);
        populateVerificationPanel(savedSettings ? savedSettings.verification : null);
        updateSidebarLinks(guildId); // <-- FIXED: Update sidebar links with the server ID
        setupEventListeners();

    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `<div class="text-center"><h1 class="text-4xl font-bold text-red-500">An Error Occurred</h1><p class="text-gray-400 mt-4">Could not load server data.</p><p class="text-gray-500 text-sm mt-2">Error: ${error.message}</p><a href="/dashboard.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Back to Server List</a></div>`;
    }
}

// --- UI POPULATION FUNCTIONS ---
function populateHeader(guild) {
    const serverHeader = document.getElementById('server-header');
    const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/1.png';
    serverHeader.innerHTML = `<img src="${iconUrl}" alt="Server Icon" class="w-16 h-16 rounded-full"><h1 class="text-4xl font-bold">${guild.name}</h1>`;
}

function populateVerificationPanel(settings) {
    const panel = document.getElementById('verification-settings');
    const createOptions = (elements, nameField) => `<option value="">Select...</option>` + elements.map(el => `<option value="${el.id}">${el[nameField]}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Verification Settings</h2>
        <div class="bg-gray-800 p-8 rounded-lg max-w-2xl">
            <form id="verification-form">
                <div class="mb-4">
                    <label for="verification-channel" class="block text-sm font-medium text-gray-300 mb-2">Verification Channel</label>
                    <select id="verification-channel" name="verificationChannelId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverChannels, 'name')}</select>
                </div>
                <div class="mb-4">
                    <label for="unverified-role" class="block text-sm font-medium text-gray-300 mb-2">Unverified Role</label>
                    <select id="unverified-role" name="unverifiedRoleId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverRoles, 'name')}</select>
                </div>
                <div class="mb-6">
                    <label for="verified-role" class="block text-sm font-medium text-gray-300 mb-2">Verified Role</label>
                    <select id="verified-role" name="verifiedRoleId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverRoles, 'name')}</select>
                </div>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
            </form>
        </div>`;
    if (settings) {
        panel.querySelector('#verification-channel').value = settings.verificationChannelId || '';
        panel.querySelector('#unverified-role').value = settings.unverifiedRoleId || '';
        panel.querySelector('#verified-role').value = settings.verifiedRoleId || '';
    }
}

// NEW: Function to update sidebar links
function updateSidebarLinks(guildId) {
    const sidebarNav = document.getElementById('sidebar-nav');
    sidebarNav.querySelectorAll('a').forEach(link => {
        const baseHref = link.getAttribute('href').split('#')[0];
        link.href = `${baseHref}#${guildId}`;
    });
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    const verificationForm = document.getElementById('verification-form');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    verificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = verificationForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
        const formData = new FormData(verificationForm);
        const payload = {
            guildId,
            verificationChannelId: formData.get('verificationChannelId'),
            unverifiedRoleId: formData.get('unverifiedRoleId'),
            verifiedRoleId: formData.get('verifiedRoleId')
        };
        try {
            const response = await fetch('https://api.ulti-bot.com/api/settings/verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save settings.');
            showToast('Verification settings saved!', 'success');
        } catch (error) {
            showToast('Error saving settings.', 'error');
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Changes';
        }
    });
}

// Run the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initializeVerificationPage);
