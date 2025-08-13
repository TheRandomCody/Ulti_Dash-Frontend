// js/staff.js

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

function isColorDark(hexColor) {
    if (!hexColor || hexColor === '#000000') return true;
    const rgb = parseInt(hexColor.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128;
}

// --- INITIALIZATION ---
async function initializeStaffPage() {
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
        populateStaffPanel(savedSettings ? savedSettings.staff : null);
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

function populateStaffPanel(settings) {
    const panel = document.getElementById('staff-settings');
    const roleOptions = serverRoles.sort((a, b) => b.position - a.position).map(r => `<option value="${r.id}" data-color="${r.color}" data-icon="${r.icon}" data-emoji="${r.unicode_emoji}">${r.name}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Staff Settings</h2>
        <form id="staff-form" class="bg-gray-800 p-8 rounded-lg max-w-4xl space-y-8">
            <div>
                <label class="flex items-center cursor-pointer">
                    <span class="text-lg font-medium text-white mr-4">Enable Custom Staff Hierarchy</span>
                    <div class="relative">
                        <input type="checkbox" id="staff-hierarchy-toggle" class="sr-only peer">
                        <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                        <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-full peer-checked:bg-blue-500"></div>
                    </div>
                </label>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <label for="owner-role" class="block text-lg font-medium text-gray-300 mb-2">Server Owner Role</label>
                <select id="owner-role" name="ownerRoleId" class="w-full p-2 bg-gray-700 rounded-md"><option value="">Select...</option>${roleOptions}</select>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                <h3 class="text-2xl font-bold mb-4">Staff Teams</h3>
                <div id="staff-teams-container" class="space-y-6"></div>
                <button type="button" id="add-team-btn" class="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Add Staff Team</button>
            </div>
            <div class="border-t border-gray-700"></div>
            <div>
                 <label class="flex items-center cursor-pointer">
                    <span class="text-lg font-medium text-white mr-4">Enable Emergency Override Command</span>
                    <div class="relative">
                        <input type="checkbox" id="emergency-override-toggle" class="sr-only peer">
                        <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                        <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-full peer-checked:bg-blue-500"></div>
                    </div>
                </label>
            </div>
            <div class="border-t border-gray-700 pt-6">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg">Save All Staff Settings</button>
            </div>
        </form>`;
    if (settings) {
        panel.querySelector('#staff-hierarchy-toggle').checked = settings.isEnabled || false;
        panel.querySelector('#owner-role').value = settings.ownerRoleId || '';
        panel.querySelector('#emergency-override-toggle').checked = settings.emergencyOverrideEnabled || false;
        if (settings.teams) {
            settings.teams.forEach(team => addTeam(team));
        }
    }
}

function addTeam(teamData = null) {
    const teamsContainer = document.getElementById('staff-teams-container');
    if (teamsContainer.children.length >= 5) {
        showToast('You can only have a maximum of 5 staff teams.', 'error');
        return;
    }
    const teamId = teamData ? teamData.teamId : `team-${Date.now()}`;
    const teamTemplate = document.createElement('div');
    teamTemplate.id = teamId;
    teamTemplate.className = "staff-team bg-gray-700 p-6 rounded-lg border border-gray-600";
    teamTemplate.dataset.teamId = teamId;
    
    const roleOptions = serverRoles.sort((a, b) => b.position - a.position).map(r => `<option value="${r.id}" data-color="${r.color}" data-icon="${r.icon}" data-emoji="${r.unicode_emoji}">${r.name}</option>`).join('');

    const createPermissionRow = (action) => `
        <div class="flex items-center justify-between">
            <span class="capitalize">${action}</span>
            <div class="flex gap-4">
                <label><input type="radio" name="perm-${action}-${teamId}" value="full"> Full</label>
                <label><input type="radio" name="perm-${action}-${teamId}" value="auth"> Auth</label>
                <label><input type="radio" name="perm-${action}-${teamId}" value="none" checked> None</label>
            </div>
        </div>
    `;

    teamTemplate.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <input type="text" placeholder="Team Name" class="team-name text-xl font-bold bg-transparent border-b border-gray-500" value="${teamData ? teamData.teamName : ''}">
            <button type="button" class="text-red-500 hover:text-red-400 font-bold remove-team-btn">Remove</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Team Roles (Max 5)</label>
                <div class="role-bubbles-container bg-gray-800 p-2 rounded-md min-h-[40px]"></div>
                <select class="add-role-select w-full p-2 mt-2 bg-gray-800 rounded-md"><option value="">Add a role...</option>${roleOptions}</select>
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-300 mb-2">Punishment Rules</label>
                ${createPermissionRow('ban')}
                ${createPermissionRow('kick')}
                ${createPermissionRow('mute')}
                ${createPermissionRow('warn')}
                ${createPermissionRow('blacklist')}
            </div>
        </div>
        <div class="mt-4 border-t border-gray-600 pt-4">
            <label class="block text-sm font-medium text-gray-300 mb-2">Can Authorize Requests For:</label>
            <div class="can-authorize-container grid grid-cols-2 gap-2"></div>
        </div>
    `;
    teamsContainer.appendChild(teamTemplate);
    updateAllAuthCheckboxes();

    const bubblesContainer = teamTemplate.querySelector('.role-bubbles-container');
    const addRoleSelect = teamTemplate.querySelector('.add-role-select');

    addRoleSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const roleId = selectedOption.value;
        if (!roleId) return;

        if (bubblesContainer.children.length >= 5) {
            showToast('A team can only have a maximum of 5 roles.', 'error');
            e.target.value = '';
            return;
        }
        
        if (bubblesContainer.querySelector(`[data-role-id="${roleId}"]`)) {
            e.target.value = '';
            return;
        }

        const roleName = selectedOption.textContent;
        const color = selectedOption.dataset.color || '0';
        const icon = selectedOption.dataset.icon;
        const emoji = selectedOption.dataset.emoji;

        const bubble = document.createElement('div');
        bubble.className = 'role-bubble';
        bubble.dataset.roleId = roleId;
        
        const hexColor = `#${parseInt(color).toString(16).padStart(6, '0')}`;
        bubble.style.backgroundColor = hexColor;
        bubble.style.color = isColorDark(hexColor) ? 'white' : 'black';

        let iconHtml = '';
        if (icon && icon !== 'null') {
            iconHtml = `<img src="https://cdn.discordapp.com/role-icons/${roleId}/${icon}.png" class="role-icon">`;
        } else if (emoji && emoji !== 'null') {
            iconHtml = `<span class="emoji">${emoji}</span>`;
        }

        bubble.innerHTML = `${iconHtml}<span>${roleName}</span>`;
        bubble.addEventListener('click', () => bubble.remove());
        bubblesContainer.appendChild(bubble);
        e.target.value = '';
    });

    if (teamData) {
        Object.entries(teamData.permissions).forEach(([action, value]) => {
            const radio = teamTemplate.querySelector(`input[name="perm-${action}-${teamId}"][value="${value}"]`);
            if (radio) radio.checked = true;
        });
        teamData.roles.forEach(roleId => {
            const option = addRoleSelect.querySelector(`option[value="${roleId}"]`);
            if (option) {
                option.selected = true;
                addRoleSelect.dispatchEvent(new Event('change'));
            }
        });
    }

    teamTemplate.querySelector('.remove-team-btn').addEventListener('click', () => {
        teamTemplate.remove();
        updateAllAuthCheckboxes();
    });
}

function updateAllAuthCheckboxes() {
    const allTeams = Array.from(document.querySelectorAll('.staff-team'));
    allTeams.forEach(currentTeam => {
        const authContainer = currentTeam.querySelector('.can-authorize-container');
        const currentTeamId = currentTeam.dataset.teamId;
        authContainer.innerHTML = '';

        allTeams.forEach(otherTeam => {
            const otherTeamId = otherTeam.dataset.teamId;
            if (currentTeamId === otherTeamId) return;

            const otherTeamName = otherTeam.querySelector('.team-name').value || 'Unnamed Team';
            const checkboxId = `auth-${currentTeamId}-for-${otherTeamId}`;
            
            const checkboxHtml = `
                <label for="${checkboxId}" class="flex items-center">
                    <input type="checkbox" id="${checkboxId}" data-authorizes-team-id="${otherTeamId}" class="form-checkbox h-4 w-4 text-blue-500">
                    <span class="ml-2">${otherTeamName}</span>
                </label>
            `;
            authContainer.insertAdjacentHTML('beforeend', checkboxHtml);
        });
    });
}

function updateSidebarLinks(guildId) {
    const sidebarNav = document.getElementById('sidebar-nav');
    sidebarNav.querySelectorAll('a').forEach(link => {
        const baseHref = link.getAttribute('href').split('#')[0];
        link.href = `${baseHref}#${guildId}`;
    });
}

function setupEventListeners() {
    const staffForm = document.getElementById('staff-form');
    const addTeamBtn = document.getElementById('add-team-btn');
    const accessToken = localStorage.getItem('discord_access_token');
    const guildId = window.location.hash.substring(1);

    addTeamBtn.addEventListener('click', () => addTeam());

    staffForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = staffForm.querySelector('button[type="submit"]');
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';

        const teams = [];
        document.querySelectorAll('.staff-team').forEach(teamEl => {
            const teamId = teamEl.dataset.teamId;
            const permissions = {};
            ['ban', 'kick', 'mute', 'warn', 'blacklist'].forEach(action => {
                permissions[action] = teamEl.querySelector(`input[name="perm-${action}-${teamId}"]:checked`).value;
            });
            const canAuthorize = Array.from(teamEl.querySelectorAll('.can-authorize-container input:checked')).map(cb => cb.dataset.authorizesTeamId);
            
            teams.push({
                teamId,
                teamName: teamEl.querySelector('.team-name').value,
                roles: Array.from(teamEl.querySelectorAll('.role-bubble')).map(b => b.dataset.roleId),
                permissions,
                canAuthorize
            });
        });

        const payload = {
            guildId,
            isEnabled: document.getElementById('staff-hierarchy-toggle').checked,
            ownerRoleId: document.getElementById('owner-role').value,
            emergencyOverrideEnabled: document.getElementById('emergency-override-toggle').checked,
            teams
        };

        try {
            const response = await fetch('https://api.ulti-bot.com/api/settings/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Failed to save staff settings.');
            showToast('Staff settings saved successfully!', 'success');
        } catch (error) {
            showToast('Error saving staff settings.', 'error');
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save All Staff Settings';
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeStaffPage);