// Admin Panel JavaScript
// Simple password-based authentication for non-technical users

class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.artifacts = [];
        this.changes = [];
        this.adminPassword = 'admin123'; // Change this to your desired password
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }
    
    bindEvents() {
        // Login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Admin panel buttons
        document.getElementById('addNewBtn').addEventListener('click', () => this.showAddForm());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportChanges());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }
    
    checkAuthStatus() {
        // Check if user is already logged in (from localStorage)
        const authToken = localStorage.getItem('adminAuth');
        if (authToken && authToken === this.adminPassword) {
            this.isAuthenticated = true;
            this.showAdminPanel();
        }
    }
    
    login() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            this.isAuthenticated = true;
            localStorage.setItem('adminAuth', password);
            this.showAdminPanel();
            this.showMessage('Login successful!', 'success');
            document.getElementById('adminPassword').value = '';
        } else {
            this.showMessage('Invalid password. Please try again.', 'error');
        }
    }
    
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('adminAuth');
        this.hideAdminPanel();
        this.showMessage('Logged out successfully.', 'success');
    }
    
    showAdminPanel() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        this.loadArtifacts();
    }
    
    hideAdminPanel() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    }
    
    async loadArtifacts() {
        try {
            const response = await fetch('results.json');
            this.artifacts = await response.json();
            this.renderArtifactList();
        } catch (error) {
            console.error('Error loading artifacts:', error);
            this.showMessage('Error loading artifacts. Please refresh the page.', 'error');
        }
    }
    
    renderArtifactList() {
        const container = document.getElementById('artifactList');
        
        if (this.artifacts.length === 0) {
            container.innerHTML = '<p>No artifacts found.</p>';
            return;
        }
        
        let html = '<div style="margin-bottom: 1rem;"><strong>Total Artifacts: ' + this.artifacts.length + '</strong></div>';
        
        this.artifacts.forEach((artifact, index) => {
            html += this.createArtifactCard(artifact, index);
        });
        
        container.innerHTML = html;
        
        // Bind edit and delete events
        this.bindArtifactEvents();
    }
    
    createArtifactCard(artifact, index) {
        const hasThumbnail = this.checkThumbnailExists(artifact.id);
        const thumbnailClass = hasThumbnail ? 'has-thumbnail' : 'no-thumbnail';
        
        return `
            <div class="artifact-card ${thumbnailClass}" data-index="${index}">
                <div class="artifact-header">
                    <h3>ID: ${artifact.id}</h3>
                    <div class="artifact-actions">
                        <button class="edit-btn" data-index="${index}">✏️ Edit</button>
                        <button class="delete-btn" data-index="${index}">🗑️ Delete</button>
                    </div>
                </div>
                
                <div class="artifact-content">
                    <div class="artifact-thumbnail">
                        ${hasThumbnail ? 
                            `<img src="thumbnails/${artifact.id}.jpg" alt="Thumbnail" style="max-width: 100px; height: auto;">` : 
                            '<span class="no-thumb">No thumbnail</span>'
                        }
                    </div>
                    
                    <div class="artifact-details">
                        <p><strong>Title:</strong> ${artifact.title || 'No title'}</p>
                        <p><strong>Type:</strong> ${artifact.type || 'No type'}</p>
                        <p><strong>Period:</strong> ${artifact.period || 'No period'}</p>
                        <p><strong>Location:</strong> ${artifact.location || 'No location'}</p>
                        <p><strong>Description:</strong> ${artifact.description || 'No description'}</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    checkThumbnailExists(id) {
        // This is a simple check - in a real implementation, you might want to verify the file exists
        return true; // Assume all have thumbnails for now
    }
    
    bindArtifactEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.showEditForm(index);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.confirmDelete(index);
            });
        });
    }
    
    showAddForm() {
        this.showArtifactForm(null, 'Add New Artifact');
    }
    
    showEditForm(index) {
        const artifact = this.artifacts[index];
        this.showArtifactForm(artifact, `Edit Artifact ID: ${artifact.id}`);
    }
    
    showArtifactForm(artifact, title) {
        const isEdit = artifact !== null;
        const formData = artifact || {
            id: this.getNextId(),
            title: '',
            type: '',
            period: '',
            location: '',
            description: ''
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                
                <form class="artifact-form">
                    <div class="form-group">
                        <label for="formId">ID:</label>
                        <input type="number" id="formId" value="${formData.id}" ${isEdit ? 'readonly' : ''} required>
                    </div>
                    
                    <div class="form-group">
                        <label for="formTitle">Title:</label>
                        <input type="text" id="formTitle" value="${formData.title || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="formType">Type:</label>
                        <input type="text" id="formType" value="${formData.type || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="formPeriod">Period:</label>
                        <select id="formPeriod" required>
                            <option value="">Select Period</option>
                            <option value="18th Century or before" ${formData.period === '18th Century or before' ? 'selected' : ''}>18th Century or before</option>
                            <option value="19th Century" ${formData.period === '19th Century' ? 'selected' : ''}>19th Century</option>
                            <option value="20th Century" ${formData.period === '20th Century' ? 'selected' : ''}>20th Century</option>
                            <option value="21st Century" ${formData.period === '21st Century' ? 'selected' : ''}>21st Century</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="formLocation">Location:</label>
                        <input type="text" id="formLocation" value="${formData.location || ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="formDescription">Description:</label>
                        <textarea id="formDescription" rows="4" required>${formData.description || ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="admin-btn">${isEdit ? 'Update' : 'Create'}</button>
                        <button type="button" class="admin-btn" style="background: #666;">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind modal events
        this.bindModalEvents(modal, isEdit, artifact);
    }
    
    bindModalEvents(modal, isEdit, originalArtifact) {
        const form = modal.querySelector('.artifact-form');
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('button[type="button"]');
        
        // Close modal
        closeBtn.addEventListener('click', () => this.closeModal(modal));
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleArtifactSubmit(modal, isEdit, originalArtifact);
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }
    
    handleArtifactSubmit(modal, isEdit, originalArtifact) {
        const formData = {
            id: parseInt(document.getElementById('formId').value),
            title: document.getElementById('formTitle').value.trim(),
            type: document.getElementById('formType').value.trim(),
            period: document.getElementById('formPeriod').value,
            location: document.getElementById('formLocation').value.trim(),
            description: document.getElementById('formDescription').value.trim()
        };
        
        // Validation
        if (!formData.title || !formData.type || !formData.period || !formData.location || !formData.description) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        if (isEdit) {
            // Update existing artifact
            const index = this.artifacts.findIndex(a => a.id === originalArtifact.id);
            if (index !== -1) {
                this.artifacts[index] = { ...originalArtifact, ...formData };
                this.changes.push({
                    type: 'edit',
                    artifact: this.artifacts[index],
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            // Add new artifact
            this.artifacts.push(formData);
            this.changes.push({
                type: 'add',
                artifact: formData,
                timestamp: new Date().toISOString()
            });
        }
        
        this.closeModal(modal);
        this.renderArtifactList();
        this.showMessage(`Artifact ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
    }
    
    confirmDelete(index) {
        const artifact = this.artifacts[index];
        if (confirm(`Are you sure you want to delete artifact ID: ${artifact.id}?\n\nTitle: ${artifact.title}\n\nThis action cannot be undone.`)) {
            this.artifacts.splice(index, 1);
            this.changes.push({
                type: 'delete',
                artifact: artifact,
                timestamp: new Date().toISOString()
            });
            
            this.renderArtifactList();
            this.showMessage('Artifact deleted successfully!', 'success');
        }
    }
    
    getNextId() {
        if (this.artifacts.length === 0) return 1;
        const maxId = Math.max(...this.artifacts.map(a => a.id));
        return maxId + 1;
    }
    
    closeModal(modal) {
        document.body.removeChild(modal);
    }
    
    exportChanges() {
        if (this.changes.length === 0) {
            this.showMessage('No changes to export.', 'error');
            return;
        }
        
        // Create export data
        const exportData = {
            artifacts: this.artifacts,
            changes: this.changes,
            exportDate: new Date().toISOString(),
            totalArtifacts: this.artifacts.length,
            totalChanges: this.changes.length
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artifacts_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Export completed successfully!', 'success');
    }
    
    showMessage(message, type) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (type === 'error') {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            successDiv.style.display = 'none';
        } else {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            errorDiv.style.display = 'none';
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
