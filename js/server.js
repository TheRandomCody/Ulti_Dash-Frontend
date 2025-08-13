// js/server.js

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

function isColorDark(hexColor) {
    const rgb = parseInt(hexColor.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
}

// --- INITIALIZATION ---
async function initializeDashboard() {
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
        populateStaffPanel(savedSettings ? savedSettings.staff : null);
        populateModerationPanel(savedSettings ? savedSettings.moderation : null);
        populateLoggingPanel(savedSettings ? savedSettings.logging : null);
        populateAutoRolePanel(savedSettings ? savedSettings.autoRole : null);

        setupEventListeners();

    } catch (error) {
        console.error('Error loading server dashboard:', error);
        mainContent.innerHTML = `<div class="text-center"><h1 class="text-4xl font-bold text-red-500">An Error Occurred</h1><p class="text-gray-400 mt-4">Could not load server data.</p><p class="text-gray-500 text-sm mt-2">Error: ${error.message}</p><a href="/dashboard.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Back to Server List</a></div>`;
    }
}

// --- UI POPULATION FUNCTIONS ---
function populateHeader(guild) { /* ... */ }
function populateVerificationPanel(settings) { /* ... */ }
function populateStaffPanel(settings) { /* ... */ }
function populateModerationPanel(settings) { /* ... */ }
function populateLoggingPanel(settings) { /* ... */ }
function populateAutoRolePanel(settings) { /* ... */ }

// --- EVENT LISTENERS ---
function setupEventListeners() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    // FIXED: Correct tab switching logic
    sidebarNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);

            // Update active link in sidebar
            sidebarNav.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            // Show the correct settings panel and hide others
            settingsPanels.forEach(panel => {
                if (panel.id === `${targetId}-settings`) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        }
    });

    // Delegate event listeners for all forms within the settings content area
    document.getElementById('settings-content').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const saveBtn = form.querySelector('button[type="submit"]');
        if (!saveBtn) return;

        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
        
        let endpoint = '';
        let payload = { guildId, settings: {} };

        if (form.id === 'verification-form') {
            endpoint = 'verification';
            payload.settings = {
                verificationChannelId: form.verificationChannelId.value,
                unverifiedRoleId: form.unverifiedRoleId.value,
                verifiedRoleId: form.verifiedRoleId.value
            };
        } else if (form.id === 'moderation-form') {
            endpoint = 'moderation';
            // ... logic to gather moderation settings ...
        } else if (form.id === 'logging-form') {
            endpoint = 'logging';
            // ... logic to gather logging settings ...
        } else if (form.id === 'autorole-form') {
            endpoint = 'autorole';
            // ... logic to gather autorole settings ...
        } else if (form.id === 'staff-form') {
            endpoint = 'staff';
            // ... logic to gather staff settings ...
        }

        if (!endpoint) {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Changes';
            return;
        }

        try {
            const response = await fetch(`https://api.ulti-bot.com/api/settings/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Failed to save ${endpoint} settings.`);
            showToast(`${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} settings saved!`, 'success');
        } catch (error) {
            showToast(`Error saving ${endpoint} settings.`, 'error');
        } finally {
            saveBtn.disabled = false; 
            // Reset button text based on which form it is
            if(form.id === 'staff-form' || form.id === 'moderation-form') {
                saveBtn.textContent = 'Save All Settings';
            } else {
                 saveBtn.textContent = 'Save Changes';
            }
        }
    });

    // Add other specific event listeners (like for adding staff teams) here
    const addTeamBtn = document.getElementById('add-team-btn');
    if(addTeamBtn) addTeamBtn.addEventListener('click', () => addTeam());
    
    const addTierBtn = document.getElementById('add-tier-btn');
    if(addTierBtn) addTierBtn.addEventListener('click', () => addWarningTier());
}

// Run the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
