// js/verification.js

let serverRoles = [];
let serverChannels = [];

// --- UTILITY FUNCTIONS ---
function showToast(message, type = 'success') { /* ... */ }

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
        updateSidebarLinks(guildId);
        setupEventListeners();

    } catch (error) {
        console.error('Error loading page:', error);
        mainContent.innerHTML = `<div class="text-center">...error message html...</div>`;
    }
}

// --- UI POPULATION & EVENT LISTENERS ---
function populateHeader(guild) { /* ... */ }

function populateVerificationPanel(settings) {
    const panel = document.getElementById('verification-settings');
    const createOptions = (elements, nameField) => `<option value="">Select...</option>` + elements.map(el => `<option value="${el.id}">${el[nameField]}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Verification Settings</h2>
        <form id="verification-form" class="bg-gray-800 p-8 rounded-lg max-w-4xl space-y-8">
            <div>
                <h3 class="text-2xl font-bold mb-4">Join Actions</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <label for="verified-user-action">If a Verified user joins:</label>
                        <select id="verified-user-action" name="verifiedUserAction" class="bg-gray-700 rounded-md p-2">
                            <option value="none">Do Nothing</option>
                            <option value="give_role">Give Role</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="unverified-user-action">If an Unverified user joins:</label>
                        <select id="unverified-user-action" name="unverifiedUserAction" class="bg-gray-700 rounded-md p-2">
                            <option value="give_role">Give Unverified Role</option>
                            <option value="kick">Kick</option>
                            <option value="ban">Ban</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <h3 class="text-2xl font-bold mb-4">Verification Roles & Channel</h3>
                <div class="space-y-4">
                    <div>
                        <label for="verification-channel" class="block text-sm font-medium text-gray-300 mb-2">Verification Channel</label>
                        <select id="verification-channel" name="verificationChannelId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverChannels, 'name')}</select>
                    </div>
                    <div>
                        <label for="unverified-role" class="block text-sm font-medium text-gray-300 mb-2">Unverified Role</label>
                        <select id="unverified-role" name="unverifiedRoleId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverRoles, 'name')}</select>
                    </div>
                    <div>
                        <label for="verified-role" class="block text-sm font-medium text-gray-300 mb-2">Verified Role</label>
                        <select id="verified-role" name="verifiedRoleId" class="w-full p-2 bg-gray-700 rounded-md">${createOptions(serverRoles, 'name')}</select>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <h3 class="text-2xl font-bold mb-4">Age Gate</h3>
                <div class="space-y-4">
                    <label class="flex items-center"><input type="checkbox" id="age-gate-toggle" name="ageGateEnabled" class="form-checkbox h-5 w-5"> <span class="ml-2">Enable Age Gate</span></label>
                    <div class="flex items-center justify-between">
                        <label for="min-age">Minimum Age:</label>
                        <input type="number" id="min-age" name="minAge" class="bg-gray-700 rounded-md p-2 w-24" min="13" max="99" value="13">
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="max-age">Maximum Age:</label>
                        <input type="number" id="max-age" name="maxAge" class="bg-gray-700 rounded-md p-2 w-24" min="13" max="99" value="99">
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="age-gate-action">Action for users outside age range:</label>
                        <select id="age-gate-action" name="ageGateAction" class="bg-gray-700 rounded-md p-2">
                            <option value="kick">Kick</option>
                            <option value="ban">Ban</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-700 pt-6">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg">Save Verification Settings</button>
            </div>
        </form>`;
    if (settings) {
        panel.querySelector('#verified-user-action').value = settings.verifiedUserAction || 'none';
        panel.querySelector('#unverified-user-action').value = settings.unverifiedUserAction || 'give_role';
        panel.querySelector('#verification-channel').value = settings.verificationChannelId || '';
        panel.querySelector('#unverified-role').value = settings.unverifiedRoleId || '';
        panel.querySelector('#verified-role').value = settings.verifiedRoleId || '';
        if (settings.ageGate) {
            panel.querySelector('#age-gate-toggle').checked = settings.ageGate.isEnabled || false;
            panel.querySelector('#min-age').value = settings.ageGate.minAge || 13;
            panel.querySelector('#max-age').value = settings.ageGate.maxAge || 99;
            panel.querySelector('#age-gate-action').value = settings.ageGate.action || 'kick';
        }
    }
}

function updateSidebarLinks(guildId) { /* ... */ }

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
            settings: {
                verifiedUserAction: formData.get('verifiedUserAction'),
                unverifiedUserAction: formData.get('unverifiedUserAction'),
                verificationChannelId: formData.get('verificationChannelId'),
                unverifiedRoleId: formData.get('unverifiedRoleId'),
                verifiedRoleId: formData.get('verifiedRoleId'),
                ageGate: {
                    isEnabled: document.getElementById('age-gate-toggle').checked,
                    minAge: formData.get('minAge'),
                    maxAge: formData.get('maxAge'),
                    action: formData.get('ageGateAction')
                }
            }
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
            saveBtn.disabled = false; saveBtn.textContent = 'Save Verification Settings';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeVerificationPage);
