// Database - Using localStorage for now (will replace with Netlify Functions)
const DB_NAME = 'travelleadcrm_db';
const API_BASE = ''; // Will be Netlify Functions URL

// Initialize Database
function initializeDatabase() {
    if (!localStorage.getItem(DB_NAME)) {
        const initialData = {
            leads: [
                {
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
                    createdDate: '2024-01-29',
                    lastUpdated: '2024-01-29T10:00:00Z'
                }
            ],
            agents: [
                {
                    id: 'AGT001',
                    name: 'Sarah Johnson',
                    email: 'sarah@agency.com',
                    phone: '9876543210',
                    status: 'Active',
                    assignedLeads: 12,
                    performanceScore: 85,
                    joinDate: '2023-01-15'
                }
            ],
            analytics: {
                totalLeads: 1,
                newToday: 1,
                conversionRate: '0%',
                totalRevenue: '$1500',
                topDestination: 'Annapurna',
                bestAgent: 'Sarah Johnson'
            },
            settings: {
                companyName: 'TravelLeadCRM',
                defaultStatus: 'New',
                currency: 'USD',
                timezone: 'UTC+5:45',
                leadPrefix: 'LEAD',
                pageSize: 50,
                adminEmail: 'admin@travelleadcrm.com',
                emailNotifications: true
            }
        };
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
    return JSON.parse(localStorage.getItem(DB_NAME));
}

// Database Operations
const db = {
    get: () => JSON.parse(localStorage.getItem(DB_NAME)),
    save: (data) => localStorage.setItem(DB_NAME, JSON.stringify(data)),
    
    // Lead Operations
    getLeads: () => db.get().leads,
    getLead: (id) => db.get().leads.find(lead => lead.id === id),
    addLead: (lead) => {
        const data = db.get();
        data.leads.unshift(lead);
        db.save(data);
        db.updateAnalytics();
        return lead;
    },
    updateLead: (id, updates) => {
        const data = db.get();
        const index = data.leads.findIndex(lead => lead.id === id);
        if (index !== -1) {
            data.leads[index] = { ...data.leads[index], ...updates, lastUpdated: new Date().toISOString() };
            db.save(data);
            db.updateAnalytics();
            return data.leads[index];
        }
        return null;
    },
    deleteLead: (id) => {
        const data = db.get();
        data.leads = data.leads.filter(lead => lead.id !== id);
        db.save(data);
        db.updateAnalytics();
    },
    
    // Agent Operations
    getAgents: () => db.get().agents,
    addAgent: (agent) => {
        const data = db.get();
        data.agents.push(agent);
        db.save(data);
        return agent;
    },
    
    // Analytics
    updateAnalytics: () => {
        const data = db.get();
        const leads = data.leads;
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
        
        data.analytics = {
            totalLeads,
            newToday,
            conversionRate,
            totalRevenue: '$' + totalRevenue.toFixed(2),
            topDestination,
            bestAgent: data.agents[0]?.name || 'N/A'
        };
        
        db.save(data);
    },
    
    // Settings
    getSettings: () => db.get().settings,
    updateSettings: (updates) => {
        const data = db.get();
        data.settings = { ...data.settings, ...updates };
        db.save(data);
        return data.settings;
    }
};

// UI Components
const UI = {
    // Initialize
    init: function() {
        initializeDatabase();
        this.setupEventListeners();
        this.loadDashboard();
        this.hideLoadingScreen();
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
        });
        
        // Modal Close
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });
        
        // Lead Form Submit
        document.getElementById('leadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveLead();
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
        document.getElementById('generalSettings').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGeneralSettings();
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
    showSection: function(sectionName) {
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
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'leads':
                this.loadAllLeads();
                break;
            case 'agents':
                this.loadAgents();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'settings':
                this.loadSettings();
                break;
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
    loadDashboard: function() {
        const analytics = db.get().analytics;
        
        // Update stats
        document.getElementById('totalLeads').textContent = analytics.totalLeads;
        document.getElementById('newToday').textContent = analytics.newToday;
        document.getElementById('conversionRate').textContent = analytics.conversionRate;
        document.getElementById('totalRevenue').textContent = analytics.totalRevenue;
        document.getElementById('todayCount').textContent = `${analytics.newToday} New Leads`;
        
        // Load recent leads
        this.loadRecentLeads();
        
        // Initialize chart
        this.initLeadsChart();
    },
    
    loadRecentLeads: function() {
        const leads = db.getLeads().slice(0, 5);
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
    loadAllLeads: function() {
        const leads = db.getLeads();
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
    saveLead: function() {
        const leadId = document.getElementById('leadForm').dataset.leadId;
        
        const leadData = {
            id: leadId || 'LEAD' + Date.now().toString().slice(-6),
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
            createdDate: leadId ? db.getLead(leadId).createdDate : new Date().toLocaleDateString('en-US'),
            lastUpdated: new Date().toISOString()
        };
        
        if (leadId) {
            // Update existing lead
            db.updateLead(leadId, leadData);
            this.showToast('Lead updated successfully!');
        } else {
            // Add new lead
            db.addLead(leadData);
            this.showToast('Lead added successfully!');
        }
        
        this.hideAllModals();
        
        // Refresh data
        if (document.getElementById('dashboardSection').classList.contains('active')) {
            this.loadDashboard();
        } else {
            this.loadAllLeads();
        }
    },
    
    // Edit Lead
    editLead: function(id) {
        const lead = db.getLead(id);
        if (!lead) return;
        
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
    },
    
    // Delete Lead
    deleteLead: function(id) {
        if (confirm('Are you sure you want to delete this lead?')) {
            db.deleteLead(id);
            this.showToast('Lead deleted successfully!');
            this.loadAllLeads();
            this.loadDashboard();
        }
    },
    
    // View Lead (placeholder)
    viewLead: function(id) {
        alert(`View lead ${id} - Details will be shown in a detailed view modal`);
    },
    
    // Search Leads
    searchLeads: function(query) {
        if (!query.trim()) {
            this.loadAllLeads();
            return;
        }
        
        const leads = db.getLeads();
        const filtered = leads.filter(lead => 
            lead.firstName.toLowerCase().includes(query.toLowerCase()) ||
            lead.lastName.toLowerCase().includes(query.toLowerCase()) ||
            lead.email.toLowerCase().includes(query.toLowerCase()) ||
            lead.destination.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderFilteredLeads(filtered);
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
    exportLeads: function() {
        const leads = db.getLeads();
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
    },
    
    // Agents
    loadAgents: function() {
        const agents = db.getAgents();
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
    },
    
    // Analytics Charts
    initLeadsChart: function() {
        const ctx = document.getElementById('leadsChart').getContext('2d');
        const leads = db.getLeads();
        
        // Sample data - in real app, group by date
        const chartData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'New Leads',
                data: [12, 19, 8, 15, 12, 18],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        };
        
        new Chart(ctx, {
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
    
    // Settings
    loadSettings: function() {
        const settings = db.getSettings();
        
        document.getElementById('companyName').value = settings.companyName;
        document.getElementById('currency').value = settings.currency;
        document.getElementById('timezone').value = settings.timezone;
        document.getElementById('notificationEmail').value = settings.adminEmail;
        document.getElementById('emailNotifications').checked = settings.emailNotifications;
    },
    
    saveGeneralSettings: function() {
        const settings = {
            companyName: document.getElementById('companyName').value,
            currency: document.getElementById('currency').value,
            timezone: document.getElementById('timezone').value,
            adminEmail: document.getElementById('notificationEmail').value,
            emailNotifications: document.getElementById('emailNotifications').checked
        };
        
        db.updateSettings(settings);
        this.showToast('Settings saved successfully!');
    }
};

// Button Icons
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
        }
        
        .btn-icon:hover {
            background: var(--gray-200);
            color: var(--gray-900);
        }
        
        .btn-icon.btn-danger:hover {
            background: var(--danger);
            color: white;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    UI.init();
});