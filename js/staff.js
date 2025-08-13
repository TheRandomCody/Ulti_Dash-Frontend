// js/staff.js

let serverRoles = [];

// --- UTILITY FUNCTIONS ---
function showToast(message, type = 'success') { /* ... */ }
function isColorDark(hexColor) { /* ... */ }

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
        mainContent.innerHTML = `<div class="text-center">...error message html...</div>`;
    }
}

// --- UI POPULATION & EVENT LISTENERS ---
function populateHeader(guild) { /* ... */ }

function populateStaffPanel(settings) {
    const panel = document.getElementById('staff-settings');
    const roleOptions = serverRoles.sort((a, b) => b.position - a.position).map(r => `<option value="${r.id}" data-color="${r.color}" data-icon="${r.icon}" data-emoji="${r.unicode_emoji}">${r.name}</option>`).join('');
    panel.innerHTML = `
        <h2 class="text-3xl font-bold mb-6">Staff Settings</h2>
        <form id="staff-form" class="bg-gray-800 p-8 rounded-lg max-w-4xl space-y-8">
            <!-- Staff form content... -->
        </form>`;
    if (settings) {
        // ... logic to populate the form with saved settings ...
    }
}

function addTeam(teamData = null) {
    // ... logic to add a team with the bubble UI ...
}

function updateAllAuthCheckboxes() {
    // ... logic to update the "Can Authorize" checkboxes ...
}

function setupEventListeners() {
    const staffForm = document.getElementById('staff-form');
    // ... other event listeners for the staff page ...
}

function updateSidebarLinks(guildId) {
    const sidebarNav = document.getElementById('sidebar-nav');
    sidebarNav.querySelectorAll('a').forEach(link => {
        const baseHref = link.getAttribute('href').split('#')[0];
        link.href = `${baseHref}#${guildId}`;
    });
}

document.addEventListener('DOMContentLoaded', initializeStaffPage);
