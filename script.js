// script.js - Travel Lead CRM with Firebase (ES Modules)

// Firebase ES Module imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, setDoc, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfHChZp3QeSYi7pOCZ8-p2G63hIxs68rU",
    authDomain: "travelleadcrm.firebaseapp.com",
    databaseURL: "https://travelleadcrm-default-rtdb.firebaseio.com",
    projectId: "travelleadcrm",
    storageBucket: "travelleadcrm.firebasestorage.app",
    messagingSenderId: "55869821135",
    appId: "1:55869821135:web:41b4742971ec0d20f767ba",
    measurementId: "G-WPQS7BKV0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore collection names
const COLLECTIONS = {
    LEADS: 'leads',
    AGENTS: 'agents',
    ANALYTICS: 'analytics',
    SETTINGS: 'settings'
};

// Firebase Database Operations
const firebaseDB = {
    // Generate unique ID
    generateId: () => 'LEAD' + Date.now().toString().slice(-6),

    // Initialize Firebase data structure
    initializeFirebaseData: async () => {
        try {
            const leadsCollection = collection(db, COLLECTIONS.LEADS);
            const leadsSnapshot = await getDocs(leadsCollection);

            if (leadsSnapshot.empty) {
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
                await setDoc(doc(db, COLLECTIONS.LEADS, 'LEAD001'), initialLead);
                await setDoc(doc(db, COLLECTIONS.AGENTS, 'AGT001'), initialAgent);
                await setDoc(doc(db, COLLECTIONS.SETTINGS, 'main'), initialSettings);

                console.log('Firestore initialized with demo data');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error initializing Firestore:', error);
            throw error;
        }
    },

    // Lead Operations
    getLeads: async () => {
        try {
            const leadsCollection = collection(db, COLLECTIONS.LEADS);
            const leadsSnapshot = await getDocs(leadsCollection);

            const leads = [];
            leadsSnapshot.forEach((doc) => {
                leads.push({
                    ...doc.data(),
                    firebaseKey: doc.id
                });
            });

            return leads;
        } catch (error) {
            console.error('Error getting leads:', error);
            return [];
        }
    },

    getLead: async (id) => {
        try {
            const leadDoc = doc(db, COLLECTIONS.LEADS, id);
            const leadSnapshot = await getDoc(leadDoc);

            if (leadSnapshot.exists()) {
                return { ...leadSnapshot.data(), firebaseKey: id };
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

            const leadDoc = doc(db, COLLECTIONS.LEADS, leadId);
            await setDoc(leadDoc, leadWithId);

            // Update analytics
            await firebaseDB.updateAnalytics();

            console.log('Lead added to Firestore:', leadId);
            return leadWithId;
        } catch (error) {
            console.error('Error adding lead:', error);
            throw error;
        }
    },

    updateLead: async (id, updates) => {
        try {
            const leadDoc = doc(db, COLLECTIONS.LEADS, id);
            const leadSnapshot = await getDoc(leadDoc);

            if (leadSnapshot.exists()) {
                const currentData = leadSnapshot.data();
                const updatedData = {
                    ...currentData,
                    ...updates,
                    lastUpdated: new Date().toISOString()
                };

                await updateDoc(leadDoc, updatedData);

                // Update analytics
                await firebaseDB.updateAnalytics();

                console.log('Lead updated in Firestore:', id);
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
            const leadDoc = doc(db, COLLECTIONS.LEADS, id);
            await deleteDoc(leadDoc);

            // Update analytics
            await firebaseDB.updateAnalytics();

            console.log('Lead deleted from Firestore:', id);
            return true;
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    },

    // Agent Operations
    getAgents: async () => {
        try {
            const agentsCollection = collection(db, COLLECTIONS.AGENTS);
            const agentsSnapshot = await getDocs(agentsCollection);

            const agents = [];
            agentsSnapshot.forEach((doc) => {
                agents.push(doc.data());
            });

            return agents;
        } catch (error) {
            console.error('Error getting agents:', error);
            return [];
        }
    },

    // Analytics Operations
    getAnalytics: async () => {
        try {
            const analyticsDoc = doc(db, COLLECTIONS.ANALYTICS, 'main');
            const analyticsSnapshot = await getDoc(analyticsDoc);

            if (analyticsSnapshot.exists()) {
                return analyticsSnapshot.data();
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

            const analyticsDoc = doc(db, COLLECTIONS.ANALYTICS, 'main');
            await setDoc(analyticsDoc, analyticsData);

            return analyticsData;
        } catch (error) {
            console.error('Error updating analytics:', error);
            throw error;
        }
    },

    // Settings Operations
    getSettings: async () => {
        try {
            const settingsDoc = doc(db, COLLECTIONS.SETTINGS, 'main');
            const settingsSnapshot = await getDoc(settingsDoc);

            if (settingsSnapshot.exists()) {
                return settingsSnapshot.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting settings:', error);
            return null;
        }
    },

    updateSettings: async (updates) => {
        try {
            const settingsDoc = doc(db, COLLECTIONS.SETTINGS, 'main');
            const settingsSnapshot = await getDoc(settingsDoc);

            if (settingsSnapshot.exists()) {
                const currentSettings = settingsSnapshot.data();
                const updatedSettings = { ...currentSettings, ...updates };
                await updateDoc(settingsDoc, updatedSettings);
                return updatedSettings;
            } else {
                await setDoc(settingsDoc, updates);
                return updates;
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // Real-time Listeners
    setupLeadsListener: (callback) => {
        const leadsCollection = collection(db, COLLECTIONS.LEADS);

        return onSnapshot(leadsCollection, (snapshot) => {
            const leads = [];
            snapshot.forEach((doc) => {
                leads.push({
                    ...doc.data(),
                    firebaseKey: doc.id
                });
            });
            callback(leads);
        });
    },

    setupAnalyticsListener: (callback) => {
        const analyticsDoc = doc(db, COLLECTIONS.ANALYTICS, 'main');

        return onSnapshot(analyticsDoc, (docSnapshot) => {
            if (docSnapshot.exists()) {
                callback(docSnapshot.data());
            }
        });
    }
};

// UI Components
const UI = {
    // Initialize
    init: async function() {
        try {
            console.log('Initializing TravelLeadCRM...');
            
            // Check if Firebase is loaded
            if (!db) {
                throw new Error('Firestore not loaded. Check CDN scripts.');
            }
            
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
            this.showToast('App loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            
            // Show user-friendly error on loading screen
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div style="text-align: center; padding: 40px; max-width: 500px; margin: 0 auto;">
                        <div style="color: #dc2626; margin-bottom: 20px; font-size: 48px;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 style="color: #dc2626; margin-bottom: 16px;">Connection Error</h3>
                        <p style="margin-bottom: 20px;">Cannot connect to Firestore database. Please check:</p>
                        <div style="text-align: left; background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                            <p><strong>1. Internet connection</strong></p>
                            <p><strong>2. Firebase configuration</strong> (check index.html)</p>
                            <p><strong>3. Open browser console (F12) for details</strong></p>
                        </div>
                        <button onclick="location.reload()" class="btn" style="margin-top: 10px;">
                            <i class="fas fa-redo"></i> Retry Connection
                        </button>
                        <button onclick="window.open('https://console.firebase.google.com/', '_blank')" class="btn btn-outline" style="margin-top: 10px; margin-left: 10px;">
                            <i class="fas fa-external-link-alt"></i> Open Firebase Console
                        </button>
                    </div>
                `;
            }
            
            this.showToast('Failed to initialize app. Check console.', 'error');
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
        const addLeadBtn = document.getElementById('addLeadBtn');
        if (addLeadBtn) {
            addLeadBtn.addEventListener('click', () => {
                this.showModal('addLeadModal');
                document.getElementById('leadForm').reset();
                delete document.getElementById('leadForm').dataset.leadId;
            });
        }
        
        // Modal Close
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });
        
        // Lead Form Submit
        const leadForm = document.getElementById('leadForm');
        if (leadForm) {
            leadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveLead();
            });
        }
        
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchLeads(e.target.value);
            });
        }
        
        // Export Button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportLeads();
            });
        }
        
        // Settings Forms
        const settingsForm = document.getElementById('generalSettings');
        if (settingsForm) {
            settingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveGeneralSettings();
            });
        }
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });
        
        // Test Connection Button (for debugging)
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '<i class="fas fa-bug"></i>';
        testBtn.className = 'btn-icon';
        testBtn.style.position = 'fixed';
        testBtn.style.bottom = '20px';
        testBtn.style.right = '20px';
        testBtn.style.zIndex = '1000';
        testBtn.title = 'Test Firebase Connection';
        testBtn.onclick = () => this.testFirebaseConnection();
        document.body.appendChild(testBtn);
    },
    
    // Test Firebase Connection
    testFirebaseConnection: async function() {
        try {
            this.showToast('Testing Firestore connection...', 'success');

            // Test read
            const leads = await firebaseDB.getLeads();
            console.log('Firestore test - Leads count:', leads.length);

            // Test write to a test collection
            const testDoc = doc(db, 'test', 'connection');
            await setDoc(testDoc, {
                test: 'success',
                timestamp: new Date().toISOString()
            });

            this.showToast(`Firestore connection successful! ${leads.length} leads loaded.`, 'success');

        } catch (error) {
            console.error('Firestore test failed:', error);
            this.showToast('Firestore connection failed: ' + error.message, 'error');
        }
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
        const sectionElement = document.getElementById(sectionName + 'Section');
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // Activate corresponding nav item
        const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update page title
        const title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        const pageTitle = document.getElementById('pageTitle');
        const breadcrumb = document.getElementById('breadcrumb');
        
        if (pageTitle) pageTitle.textContent = title;
        if (breadcrumb) breadcrumb.textContent = title + ' / Overview';
        
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
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    hideAllModals: function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },
    
    // Loading Screen
    hideLoadingScreen: function() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1000);
    },
    
    // Toast Notifications
    showToast: function(message, type = 'success') {
        const toast = type === 'success' ? 'successToast' : 'errorToast';
        const toastElement = document.getElementById(toast);
        
        if (!toastElement) {
            console.warn('Toast element not found:', toast);
            return;
        }
        
        const messageElement = toastElement.querySelector('span');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        
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
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        updateElement('totalLeads', analytics.totalLeads);
        updateElement('newToday', analytics.newToday);
        updateElement('conversionRate', analytics.conversionRate);
        updateElement('totalRevenue', analytics.totalRevenue);
        
        const todayCount = document.getElementById('todayCount');
        if (todayCount) {
            todayCount.textContent = `${analytics.newToday} New Leads`;
        }
    },
    
    loadRecentLeads: function(leads) {
        const tableBody = document.getElementById('recentLeadsTable');
        if (!tableBody) return;
        
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
        if (!tableBody) return;
        
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
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        updateElement('totalCount', leads.length);
        updateElement('showingCount', leads.length);
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
            if (document.getElementById('dashboardSection')?.classList.contains('active')) {
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
                // Create a modal to show lead details
                const modalHTML = `
                    <div class="modal active" id="viewLeadModal">
                        <div class="modal-content" style="max-width: 600px;">
                            <div class="modal-header">
                                <h3>Lead Details: ${lead.firstName} ${lead.lastName}</h3>
                                <button class="close-modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="lead-details-grid">
                                    <div><strong>ID:</strong> ${lead.id}</div>
                                    <div><strong>Email:</strong> ${lead.email}</div>
                                    <div><strong>Phone:</strong> ${lead.phone || 'N/A'}</div>
                                    <div><strong>Destination:</strong> ${lead.destination || 'N/A'}</div>
                                    <div><strong>Travel Dates:</strong> ${lead.travelDates || 'N/A'}</div>
                                    <div><strong>Budget:</strong> $${lead.budget || '0'}</div>
                                    <div><strong>Travelers:</strong> ${lead.travelers || '1'}</div>
                                    <div><strong>Trip Type:</strong> ${lead.tripType || 'N/A'}</div>
                                    <div><strong>Status:</strong> <span class="status-badge status-${lead.status.toLowerCase()}">${lead.status}</span></div>
                                    <div><strong>Source:</strong> ${lead.source || 'Website'}</div>
                                    <div><strong>Created Date:</strong> ${lead.createdDate}</div>
                                    <div><strong>Last Updated:</strong> ${new Date(lead.lastUpdated).toLocaleString()}</div>
                                </div>
                                ${lead.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong><p style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-top: 8px;">${lead.notes}</p></div>` : ''}
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-outline" onclick="UI.hideAllModals()">Close</button>
                                <button class="btn" onclick="UI.editLead('${id}')">Edit Lead</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add modal to page
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Add close event
                modalContainer.querySelector('.close-modal').addEventListener('click', () => {
                    modalContainer.remove();
                });
                
                // Close when clicking outside
                modalContainer.querySelector('.modal').addEventListener('click', (e) => {
                    if (e.target === modalContainer.querySelector('.modal')) {
                        modalContainer.remove();
                    }
                });
            } else {
                this.showToast('Lead not found', 'error');
            }
        } catch (error) {
            console.error('Error viewing lead:', error);
            this.showToast('Failed to load lead details', 'error');
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
        if (!tableBody) return;
        
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
        
        const showingCount = document.getElementById('showingCount');
        if (showingCount) showingCount.textContent = leads.length;
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
            
            if (!grid) return;
            
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
        
        // Destroy existing chart if any
        if (window.leadsChartInstance) {
            window.leadsChartInstance.destroy();
        }
        
        const chartCtx = ctx.getContext('2d');
        
        // Group leads by month (simplified)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = monthNames.slice(currentMonth - 5, currentMonth + 1);
        
        // Count leads per month (in a real app, you'd group by actual created dates)
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
        
        window.leadsChartInstance = new Chart(chartCtx, {
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
                const updateElement = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value;
                };
                
                updateElement('analyticsTotalLeads', analytics.totalLeads);
                updateElement('analyticsConversionRate', analytics.conversionRate);
                updateElement('analyticsTotalRevenue', analytics.totalRevenue);
                updateElement('analyticsTopDestination', analytics.topDestination);
                updateElement('analyticsBestAgent', analytics.bestAgent);
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
            background: white;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
        }
        
        .lead-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 16px;
        }
        
        .lead-details-grid > div {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the app
    UI.init();
});

// Make UI globally available for onclick handlers
window.UI = UI;
window.firebaseDB = firebaseDB; // Optional: for debugging