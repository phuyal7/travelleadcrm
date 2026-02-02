// firebase-config.js (Separate file - create this first)
// Save this as firebase-config.js in the same directory

// script.js - Main application file with Firebase integration

// Import Firebase functions
import { 
    database, 
    ref, 
    set, 
    get, 
    update, 
    remove, 
    onValue,
    push,
    query,
    orderByChild,
    equalTo
} from './firebase-config.js';

// Database reference paths
const DB_PATHS = {
    LEADS: 'leads',
    AGENTS: 'agents',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings'
};

// Firebase Database Operations
const firebaseDB = {
    // Generate unique ID
    generateId: () => push(ref(database)).key,
    
    // Initialize Firebase data structure
    initializeFirebaseData: async () => {
        try {
            const leadsRef = ref(database, DB_PATHS.LEADS);
            const snapshot = await get(leadsRef);
            
            if (!snapshot.exists()) {
                // Add initial demo data
                const initialLead = {
                    id: 'LEAD001',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890',
                    destination: 'Annapurna',
                    travelDates: 'Feb 2026',
                    budget: 1500,
                    travelers: 2,
                    tripType: 'Trekking',
                    status: 'New',
                    source: 'Website',
                    notes: 'Interested in trekking package',
                    agent: '',
                    createdDate: new Date().toLocaleDateString('en-US'),
                    lastUpdated: new Date().toISOString()
                };
                
                const initialAgent = {
                    id: 'AGT001',
                    name: 'Sarah Johnson',
                    email: 'sarah@agency.com',
                    phone: '9876543210',
                    status: 'Active',
                    assignedLeads: 12,
                    performanceScore: 85,
                    joinDate: '2023-01-15'
                };
                
                const initialSettings = {
                    companyName: 'TravelLeadCRM',
                    defaultStatus: 'New',
                    currency: 'USD',
                    timezone: 'UTC+5:45',
                    leadPrefix: 'LEAD',
                    pageSize: 50,
                    adminEmail: 'admin@travelleadcrm.com',
                    emailNotifications: true
                };
                
                // Set initial data
                await set(ref(database, `${DB_PATHS.LEADS}/LEAD001`), initialLead);
                await set(ref(database, `${DB_PATHS.AGENTS}/AGT001`), initialAgent);
                await set(ref(database, DB_PATHS.SETTINGS), initialSettings);
                
                console.log('Firebase initialized with demo data');
            }
        } catch (error) {
            console.error('Error initializing Firebase:', error);
        }
    },

    // Lead Operations
    getLeads: async () => {
        try {
            const leadsRef = ref(database, DB_PATHS.LEADS);
            const snapshot = await get(leadsRef);
            
            if (snapshot.exists()) {
                const leads = snapshot.val();
                // Convert object to array
                return Object.keys(leads).map(key => ({
                    ...leads[key],
                    firebaseKey: key
                }));
            }
            return [];
        } catch (error) {
            console.error('Error getting leads:', error);
            return [];
        }
    },

    getLead: async (id) => {
        try {
            const leadRef = ref(database, `${DB_PATHS.LEADS}/${id}`);
            const snapshot = await get(leadRef);
            
            if (snapshot.exists()) {
                return { ...snapshot.val(), firebaseKey: id };
            }
            return null;
        } catch (error) {
            console.error('Error getting lead:', error);
            return null;
        }
    },

    addLead: async (leadData) => {
        try {
            const leadId = 'LEAD' + Date.now().toString().slice(-6);
            const leadWithId = {
                ...leadData,
                id: leadId,
                createdDate: new Date().toLocaleDateString('en-US'),
                lastUpdated: new Date().toISOString()
            };
            
            const leadRef = ref(database, `${DB_PATHS.LEADS}/${leadId}`);
            await set(leadRef, leadWithId);
            
            // Update analytics
            await firebaseDB.updateAnalytics();
            
            console.log('Lead added to Firebase:', leadId);
            return leadWithId;
        } catch (error) {
            console.error('Error adding lead:', error);
            throw error;
        }
    },

    updateLead: async (id, updates) => {
        try {
            const leadRef = ref(database, `${DB_PATHS.LEADS}/${id}`);
            const snapshot = await get(leadRef);
            
            if (snapshot.exists()) {
                const currentData = snapshot.val();
                const updatedData = {
                    ...currentData,
                    ...updates,
                    lastUpdated: new Date().toISOString()
                };
                
                await update(leadRef, updatedData);
                
                // Update analytics
                await firebaseDB.updateAnalytics();
                
                console.log('Lead updated in Firebase:', id);
                return updatedData;
            }
            return null;
        } catch (error) {
            console.error('Error updating lead:', error);
            throw error;
        }
    },

    deleteLead: async (id) => {
        try {
            const leadRef = ref(database, `${DB_PATHS.LEADS}/${id}`);
            await remove(leadRef);
            
            // Update analytics
            await firebaseDB.updateAnalytics();
            
            console.log('Lead deleted from Firebase:', id);
            return true;
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    },

    // Agent Operations
    getAgents: async () => {
        try {
            const agentsRef = ref(database, DB_PATHS.AGENTS);
            const snapshot = await get(agentsRef);
            
            if (snapshot.exists()) {
                return Object.values(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error('Error getting agents:', error);
            return [];
        }
    },

    // Analytics Operations
    getAnalytics: async () => {
        try {
            const analyticsRef = ref(database, DB_PATHS.ANALYTICS);
            const snapshot = await get(analyticsRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error('Error getting analytics:', error);
            return null;
        }
    },

    updateAnalytics: async () => {
        try {
            const leads = await firebaseDB.getLeads();
            const agents = await firebaseDB.getAgents();
            
            const today = new Date().toLocaleDateString('en-US');
            const totalLeads = leads.length;
            const newToday = leads.filter(lead => lead.createdDate === today).length;
            const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
            const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';
            
            const totalRevenue = leads.reduce((sum, lead) => sum + (parseFloat(lead.budget) || 0), 0);
            
            // Find top destination
            const destinationCount = {};
            leads.forEach(lead => {
                if (lead.destination) {
                    destinationCount[lead.destination] = (destinationCount[lead.destination] || 0) + 1;
                }
            });
            
            const topDestination = Object.entries(destinationCount)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
            
            const analyticsData = {
                totalLeads,
                newToday,
                conversionRate,
                totalRevenue: '$' + totalRevenue.toFixed(2),
                topDestination,
                bestAgent: agents[0]?.name || 'N/A',
                lastUpdated: new Date().toISOString()
            };
            
            const analyticsRef = ref(database, DB_PATHS.ANALYTICS);
            await set(analyticsRef, analyticsData);
            
            return analyticsData;
        } catch (error) {
            console.error('Error updating analytics:', error);
            throw error;
        }
    },

    // Settings Operations
    getSettings: async () => {
        try {
            const settingsRef = ref(database, DB_PATHS.SETTINGS);
            const snapshot = await get(settingsRef);
            
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error('Error getting settings:', error);
            return null;
        }
    },

    updateSettings: async (updates) => {
        try {
            const settingsRef = ref(database, DB_PATHS.SETTINGS);
            const snapshot = await get(settingsRef);
            
            if (snapshot.exists()) {
                const currentSettings = snapshot.val();
                const updatedSettings = { ...currentSettings, ...updates };
                await set(settingsRef, updatedSettings);
                return updatedSettings;
            }
            return updates;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // Real-time Listeners
    setupLeadsListener: (callback) => {
        const leadsRef = ref(database, DB_PATHS.LEADS);
        
        onValue(leadsRef, (snapshot) => {
            if (snapshot.exists()) {
                const leads = snapshot.val();
                const leadsArray = Object.keys(leads).map(key => ({
                    ...leads[key],
                    firebaseKey: key
                }));
                callback(leadsArray);
            } else {
                callback([]);
            }
        });
    },

    setupAnalyticsListener: (callback) => {
        const analyticsRef = ref(database, DB_PATHS.ANALYTICS);
        
        onValue(analyticsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });
    }
};

// UI Components
const UI = {
    // Initialize
    init: async function() {
        try {
            // Initialize Firebase data
            await firebaseDB.initializeFirebaseData();
            
            // Setup real-time listeners
            this.setupRealtimeListeners();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial dashboard
            await this.loadDashboard();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Travel Lead CRM initialized with Firebase');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showToast('Failed to initialize app. Check console for details.', 'error');
        }
    },
    
    // Setup real-time Firebase listeners
    setupRealtimeListeners: function() {
        // Listen for leads changes
        firebaseDB.setupLeadsListener((leads) => {
            console.log('Real-time leads update:', leads.length, 'leads');
            
            // Update UI if leads section is active
            if (document.getElementById('leadsSection').classList.contains('active')) {
                this.renderAllLeads(leads);
            }
            
            // Update dashboard if active
            if (document.getElementById('dashboardSection').classList.contains('active')) {
                this.loadRecentLeads(leads);
            }
        });
        
        // Listen for analytics changes
        firebaseDB.setupAnalyticsListener((analytics) => {
            console.log('Real-time analytics update:', analytics);
            
            // Update dashboard stats if active
            if (document.getElementById('dashboardSection').classList.contains('active') && analytics) {
                this.updateDashboardStats(analytics);
            }
        });
    },
    
    // Event Listeners
    setupEventListeners: function() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });
        
        // Add Lead Button
        document.getElementById('addLeadBtn').addEventListener('click', () => {
            this.showModal('addLeadModal');
            document.getElementById('leadForm').reset();
            delete document.getElementById('leadForm').dataset.leadId;
        });
        
        // Modal Close
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });
        
        // Lead Form Submit
        document.getElementById('leadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveLead();
        });
        
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchLeads(e.target.value);
        });
        
        // Export Button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportLeads();
        });
        
        // Settings Forms
        document.getElementById('generalSettings').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveGeneralSettings();
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });
    },
    
    // Section Navigation
    showSection: async function(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionName + 'Section').classList.add('active');
        
        // Activate corresponding nav item
        document.querySelector(`.nav-item[data-section="${sectionName}"]`).classList.add('active');
        
        // Update page title
        const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        document.getElementById('pageTitle').textContent = title;
        document.getElementById('breadcrumb').textContent = title + ' / Overview';
        
        // Load section data
        try {
            switch(sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'leads':
                    await this.loadAllLeads();
                    break;
                case 'agents':
                    await this.loadAgents();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionName}:`, error);
            this.showToast(`Failed to load ${sectionName}. Check console.`, 'error');
        }
    },
    
    // Modal Controls
    showModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },
    
    hideAllModals: function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },
    
    // Loading Screen
    hideLoadingScreen: function() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 1000);
    },
    
    // Toast Notifications
    showToast: function(message, type = 'success') {
        const toast = type === 'success' ? 'successToast' : 'errorToast';
        const toastElement = document.getElementById(toast);
        const messageElement = toastElement.querySelector('span');
        
        messageElement.textContent = message;
        toastElement.classList.add('active');
        
        setTimeout(() => {
            toastElement.classList.remove('active');
        }, 3000);
    },
    
    // Dashboard
    loadDashboard: async function() {
        try {
            // Get analytics data
            const analytics = await firebaseDB.getAnalytics();
            
            if (analytics) {
                this.updateDashboardStats(analytics);
            } else {
                // Calculate initial analytics
                const newAnalytics = await firebaseDB.updateAnalytics();
                this.updateDashboardStats(newAnalytics);
            }
            
            // Load recent leads
            const leads = await firebaseDB.getLeads();
            this.loadRecentLeads(leads.slice(0, 5));
            
            // Initialize chart
            this.initLeadsChart(leads);
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showToast('Failed to load dashboard data', 'error');
        }
    },
    
    updateDashboardStats: function(analytics) {
        // Update stats cards
        document.getElementById('totalLeads').textContent = analytics.totalLeads;
        document.getElementById('newToday').textContent = analytics.newToday;
        document.getElementById('conversionRate').textContent = analytics.conversionRate;
        document.getElementById('totalRevenue').textContent = analytics.totalRevenue;
        document.getElementById('todayCount').textContent = `${analytics.newToday} New Leads`;
    },
    
    loadRecentLeads: function(leads) {
        const tableBody = document.getElementById('recentLeadsTable');
        
        tableBody.innerHTML = '';
        
        leads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lead.firstName} ${lead.lastName}</td>
                <td>${lead.destination || 'N/A'}</td>
                <td>${lead.createdDate}</td>
                <td>$${lead.budget || '0'}</td>
                <td><span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="UI.viewLead('${lead.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="UI.editLead('${lead.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },
    
    // All Leads
    loadAllLeads: async function() {
        try {
            const leads = await firebaseDB.getLeads();
            this.renderAllLeads(leads);
        } catch (error) {
            console.error('Error loading leads:', error);
            this.showToast('Failed to load leads', 'error');
        }
    },
    
    renderAllLeads: function(leads) {
        const tableBody = document.getElementById('allLeadsTable');
        
        tableBody.innerHTML = '';
        
        leads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lead.id}</td>
                <td>${lead.firstName} ${lead.lastName}</td>
                <td>${lead.destination || 'N/A'}</td>
                <td>
                    <div>${lead.email}</div>
                    <small>${lead.phone || 'No phone'}</small>
                </td>
                <td>$${lead.budget || '0'}</td>
                <td><span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span></td>
                <td>${lead.createdDate}</td>
                <td>
                    <button class="btn-icon" onclick="UI.viewLead('${lead.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="UI.editLead('${lead.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="UI.deleteLead('${lead.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update counts
        document.getElementById('totalCount').textContent = leads.length;
        document.getElementById('showingCount').textContent = leads.length;
    },
    
    // Save Lead
    saveLead: async function() {
        try {
            const leadId = document.getElementById('leadForm').dataset.leadId;
            
            const leadData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                destination: document.getElementById('destination').value,
                travelDates: document.getElementById('travelDates').value,
                budget: parseFloat(document.getElementById('budget').value) || 0,
                travelers: parseInt(document.getElementById('travelers').value) || 1,
                tripType: document.getElementById('tripType').value,
                status: document.getElementById('status').value,
                notes: document.getElementById('notes').value,
                source: 'Website' // Default source
            };
            
            let result;
            if (leadId) {
                // Update existing lead
                result = await firebaseDB.updateLead(leadId, leadData);
                this.showToast('Lead updated successfully in Firebase!');
            } else {
                // Add new lead
                result = await firebaseDB.addLead(leadData);
                this.showToast('Lead added successfully to Firebase!');
            }
            
            this.hideAllModals();
            
            // Refresh data
            if (document.getElementById('dashboardSection').classList.contains('active')) {
                await this.loadDashboard();
            } else {
                await this.loadAllLeads();
            }
            
            return result;
        } catch (error) {
            console.error('Error saving lead:', error);
            this.showToast('Failed to save lead. Check console.', 'error');
        }
    },
    
    // Edit Lead
    editLead: async function(id) {
        try {
            const lead = await firebaseDB.getLead(id);
            if (!lead) {
                this.showToast('Lead not found', 'error');
                return;
            }
            
            // Populate form
            document.getElementById('firstName').value = lead.firstName;
            document.getElementById('lastName').value = lead.lastName;
            document.getElementById('email').value = lead.email;
            document.getElementById('phone').value = lead.phone;
            document.getElementById('destination').value = lead.destination;
            document.getElementById('travelDates').value = lead.travelDates;
            document.getElementById('budget').value = lead.budget;
            document.getElementById('travelers').value = lead.travelers;
            document.getElementById('tripType').value = lead.tripType;
            document.getElementById('status').value = lead.status;
            document.getElementById('notes').value = lead.notes;
            
            // Set lead ID for update
            document.getElementById('leadForm').dataset.leadId = id;
            
            // Show modal
            this.showModal('addLeadModal');
        } catch (error) {
            console.error('Error editing lead:', error);
            this.showToast('Failed to load lead for editing', 'error');
        }
    },
    
    // Delete Lead
    deleteLead: async function(id) {
        if (confirm('Are you sure you want to delete this lead from Firebase?')) {
            try {
                await firebaseDB.deleteLead(id);
                this.showToast('Lead deleted successfully from Firebase!');
                await this.loadAllLeads();
                await this.loadDashboard();
            } catch (error) {
                console.error('Error deleting lead:', error);
                this.showToast('Failed to delete lead', 'error');
            }
        }
    },
    
    // View Lead
    viewLead: async function(id) {
        try {
            const lead = await firebaseDB.getLead(id);
            if (lead) {
                alert(`Lead Details:
ID: ${lead.id}
Name: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Phone: ${lead.phone}
Destination: ${lead.destination}
Budget: $${lead.budget}
Status: ${lead.status}
Created: ${lead.createdDate}`);
            } else {
                this.showToast('Lead not found', 'error');
            }
        } catch (error) {
            console.error('Error viewing lead:', error);
        }
    },
    
    // Search Leads
    searchLeads: async function(query) {
        if (!query.trim()) {
            await this.loadAllLeads();
            return;
        }
        
        try {
            const leads = await firebaseDB.getLeads();
            const filtered = leads.filter(lead => 
                lead.firstName.toLowerCase().includes(query.toLowerCase()) ||
                lead.lastName.toLowerCase().includes(query.toLowerCase()) ||
                lead.email.toLowerCase().includes(query.toLowerCase()) ||
                (lead.destination && lead.destination.toLowerCase().includes(query.toLowerCase()))
            );
            
            this.renderFilteredLeads(filtered);
        } catch (error) {
            console.error('Error searching leads:', error);
        }
    },
    
    renderFilteredLeads: function(leads) {
        const tableBody = document.getElementById('allLeadsTable');
        tableBody.innerHTML = '';
        
        leads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${lead.id}</td>
                <td>${lead.firstName} ${lead.lastName}</td>
                <td>${lead.destination || 'N/A'}</td>
                <td>${lead.email}<br><small>${lead.phone || ''}</small></td>
                <td>$${lead.budget || '0'}</td>
                <td><span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span></td>
                <td>${lead.createdDate}</td>
                <td>
                    <button class="btn-icon" onclick="UI.editLead('${lead.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="UI.deleteLead('${lead.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        document.getElementById('showingCount').textContent = leads.length;
    },
    
    // Export Leads
    exportLeads: async function() {
        try {
            const leads = await firebaseDB.getLeads();
            const csvContent = [
                ['ID', 'Name', 'Email', 'Phone', 'Destination', 'Budget', 'Status', 'Created Date'].join(','),
                ...leads.map(lead => [
                    lead.id,
                    `"${lead.firstName} ${lead.lastName}"`,
                    lead.email,
                    lead.phone,
                    lead.destination,
                    lead.budget,
                    lead.status,
                    lead.createdDate
                ].join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showToast('Leads exported successfully!');
        } catch (error) {
            console.error('Error exporting leads:', error);
            this.showToast('Failed to export leads', 'error');
        }
    },
    
    // Agents
    loadAgents: async function() {
        try {
            const agents = await firebaseDB.getAgents();
            const grid = document.getElementById('agentsGrid');
            
            grid.innerHTML = '';
            
            agents.forEach(agent => {
                const card = document.createElement('div');
                card.className = 'agent-card';
                card.innerHTML = `
                    <div class="agent-avatar">
                        ${agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-email">${agent.email}</div>
                    <div class="agent-phone">${agent.phone}</div>
                    <div class="agent-stats">
                        <div>
                            <div class="stat-number">${agent.assignedLeads}</div>
                            <div class="stat-label">Leads</div>
                        </div>
                        <div>
                            <div class="stat-number">${agent.performanceScore}%</div>
                            <div class="stat-label">Performance</div>
                        </div>
                    </div>
                    <button class="btn btn-outline" style="margin-top: 16px; width: 100%;">
                        <i class="fas fa-envelope"></i> Contact
                    </button>
                `;
                grid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading agents:', error);
            this.showToast('Failed to load agents', 'error');
        }
    },
    
    // Analytics Charts
    initLeadsChart: function(leads) {
        const ctx = document.getElementById('leadsChart');
        if (!ctx) return;
        
        const chartCtx = ctx.getContext('2d');
        
        // Group leads by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = monthNames.slice(currentMonth - 5, currentMonth + 1);
        
        // Count leads per month (simplified - in real app, group by actual dates)
        const monthlyCounts = last6Months.map(() => Math.floor(Math.random() * 20) + 5);
        
        const chartData = {
            labels: last6Months,
            datasets: [{
                label: 'New Leads',
                data: monthlyCounts,
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        };
        
        // Destroy existing chart if any
        if (window.leadsChart) {
            window.leadsChart.destroy();
        }
        
        window.leadsChart = new Chart(chartCtx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5
                        }
                    }
                }
            }
        });
    },
    
    // Analytics Page
    loadAnalytics: async function() {
        try {
            const analytics = await firebaseDB.getAnalytics();
            if (analytics) {
                // Update analytics page UI
                document.getElementById('analyticsTotalLeads').textContent = analytics.totalLeads;
                document.getElementById('analyticsConversionRate').textContent = analytics.conversionRate;
                document.getElementById('analyticsTotalRevenue').textContent = analytics.totalRevenue;
                document.getElementById('analyticsTopDestination').textContent = analytics.topDestination;
                document.getElementById('analyticsBestAgent').textContent = analytics.bestAgent;
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showToast('Failed to load analytics', 'error');
        }
    },
    
    // Settings
    loadSettings: async function() {
        try {
            const settings = await firebaseDB.getSettings();
            if (settings) {
                document.getElementById('companyName').value = settings.companyName;
                document.getElementById('currency').value = settings.currency;
                document.getElementById('timezone').value = settings.timezone;
                document.getElementById('notificationEmail').value = settings.adminEmail;
                document.getElementById('emailNotifications').checked = settings.emailNotifications;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showToast('Failed to load settings', 'error');
        }
    },
    
    saveGeneralSettings: async function() {
        try {
            const settings = {
                companyName: document.getElementById('companyName').value,
                currency: document.getElementById('currency').value,
                timezone: document.getElementById('timezone').value,
                adminEmail: document.getElementById('notificationEmail').value,
                emailNotifications: document.getElementById('emailNotifications').checked
            };
            
            await firebaseDB.updateSettings(settings);
            this.showToast('Settings saved successfully to Firebase!');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add button icon styles
    const style = document.createElement('style');
    style.textContent = `
        .btn-icon {
            background: none;
            border: none;
            color: var(--gray-600);
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: all 0.2s;
            margin: 0 2px;
        }
        
        .btn-icon:hover {
            background: var(--gray-200);
            color: var(--gray-900);
        }
        
        .btn-icon.btn-danger:hover {
            background: var(--danger);
            color: white;
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: var(--gray-600);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    UI.init();
});

// Make UI globally available for onclick handlers
window.UI = UI;