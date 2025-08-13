// js/moderation.js

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
async function initializeModerationPage() {
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
        populateModerationPanel(savedSettings ? savedSettings.moderation : null);
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

function populateModerationPanel(settings) {
    const panel = document.getElementById('moderation-settings');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Moderation Settings</h2>
        <form id="moderation-form" class="bg-gray-800 p-8 rounded-lg max-w-4xl space-y-8">
            <div>
                <h3 class="text-2xl font-bold mb-4">Join Gate</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <label for="no-avatar-action">Action for users with no avatar:</label>
                        <select id="no-avatar-action" name="noAvatarAction" class="bg-gray-700 rounded-md p-2">
                            <option value="none">None</option>
                            <option value="kick">Kick</option>
                            <option value="ban">Ban</option>
                        </select>
                    </div>
                    <div class="flex items-center justify-between">
                        <label for="min-account-age">Minimum account age (in days):</label>
                        <input type="number" id="min-account-age" name="minAccountAgeDays" class="bg-gray-700 rounded-md p-2 w-24" min="0" placeholder="e.g., 7">
                    </div>
                    <div>
                        <label for="banned-usernames" class="block mb-2">Banned words in username (comma-separated):</label>
                        <textarea id="banned-usernames" name="bannedUsernames" rows="3" class="w-full bg-gray-700 rounded-md p-2"></textarea>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <h3 class="text-2xl font-bold mb-4">Content Filtering</h3>
                <div class="space-y-4">
                    <div>
                        <label for="banned-words" class="block mb-2">Banned words in messages (comma-separated):</label>
                        <textarea id="banned-words" name="bannedWords" rows="4" class="w-full bg-gray-700 rounded-md p-2"></textarea>
                    </div>
                    <label class="flex items-center"><input type="checkbox" id="block-invites" name="blockInvites" class="form-checkbox h-5 w-5"> <span class="ml-2">Block Server Invites</span></label>
                    <label class="flex items-center"><input type="checkbox" id="block-mass-mention" name="blockMassMention" class="form-checkbox h-5 w-5"> <span class="ml-2">Block Mass Mentions</span></label>
                    <label class="flex items-center"><input type="checkbox" id="block-caps" name="blockCaps" class="form-checkbox h-5 w-5"> <span class="ml-2">Block Excessive Caps</span></label>
                </div>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <h3 class="text-2xl font-bold mb-4">Warning System & Punishments</h3>
                <div id="warning-tiers-container" class="space-y-4"></div>
                <button type="button" id="add-tier-btn" class="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Add Punishment Tier</button>
            </div>
            <div class="border-t border-gray-700 pt-6">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg">Save Moderation Settings</button>
            </div>
        </form>`;

    if (settings) {
        if (settings.joinGate) {
            panel.querySelector('#no-avatar-action').value = settings.joinGate.noAvatarAction || 'none';
            panel.querySelector('#min-account-age').value = settings.joinGate.minAccountAgeDays || 0;
            panel.querySelector('#banned-usernames').value = (settings.joinGate.bannedUsernames || []).join(', ');
        }
        if (settings.contentFiltering) {
            panel.querySelector('#banned-words').value = (settings.contentFiltering.bannedWords || []).join(', ');
            panel.querySelector('#block-invites').checked = settings.contentFiltering.blockInvites || false;
            panel.querySelector('#block-mass-mention').checked = settings.contentFiltering.blockMassMention || false;
            panel.querySelector('#block-caps').checked = settings.contentFiltering.blockCaps || false;
        }
        if (settings.warningSystem && settings.warningSystem.tiers) {
            settings.warningSystem.tiers.forEach(tier => addWarningTier(tier));
        }
    }
}

function addWarningTier(tierData = null) {
    const tiersContainer = document.getElementById('warning-tiers-container');
    const tierTemplate = document.createElement('div');
    tierTemplate.className = "warning-tier flex items-center gap-4 bg-gray-700 p-3 rounded-md";
    tierTemplate.innerHTML = `
        <span>On</span>
        <input type="number" class="warn-count bg-gray-800 rounded-md p-2 w-20" min="1" placeholder="e.g., 3" value="${tierData ? tierData.warnCount : ''}">
        <span>warnings, apply</span>
        <select class="action bg-gray-800 rounded-md p-2">
            <option value="mute">Mute</option>
            <option value="kick">Kick</option>
            <option value="ban">Ban</option>
        </select>
        <span>for</span>
        <input type="number" class="duration bg-gray-800 rounded-md p-2 w-20" min="0" placeholder="e.g., 60" value="${tierData ? tierData.duration : ''}">
        <select class="duration-unit bg-gray-800 rounded-md p-2">
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
        </select>
        <button type="button" class="text-red-500 hover:text-red-400 font-bold ml-auto remove-tier-btn">Remove</button>
    `;
    tiersContainer.appendChild(tierTemplate);
    tierTemplate.querySelector('.remove-tier-btn').addEventListener('click', () => tierTemplate.remove());

    if (tierData) {
        tierTemplate.querySelector('.action').value = tierData.action || 'mute';
        tierTemplate.querySelector('.duration-unit').value = tierData.durationUnit || 'minutes';
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
    const moderationForm = document.getElementById('moderation-form');
    const addTierBtn = document.getElementById('add-tier-btn');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    addTierBtn.addEventListener('click', () => addWarningTier());

    moderationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = moderationForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';

        const tiers = [];
        document.querySelectorAll('.warning-tier').forEach(tierEl => {
            tiers.push({
                warnCount: tierEl.querySelector('.warn-count').value,
                action: tierEl.querySelector('.action').value,
                duration: tierEl.querySelector('.duration').value,
                durationUnit: tierEl.querySelector('.duration-unit').value
            });
        });

        const payload = {
            guildId,
            settings: {
                joinGate: {
                    noAvatarAction: document.getElementById('no-avatar-action').value,
                    minAccountAgeDays: document.getElementById('min-account-age').value,
                    bannedUsernames: document.getElementById('banned-usernames').value,
                },
                contentFiltering: {
                    bannedWords: document.getElementById('banned-words').value,
                    blockInvites: document.getElementById('block-invites').checked,
                    blockMassMention: document.getElementById('block-mass-mention').checked,
                    blockCaps: document.getElementById('block-caps').checked,
                },
                warningSystem: { tiers }
            }
        };

        try {
            const response = await fetch('https://api.ulti-bot.com/api/settings/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save moderation settings.');
            showToast('Moderation settings saved!', 'success');
        } catch (error) {
            showToast('Error saving moderation settings.', 'error');
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Moderation Settings';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeModerationPage);
