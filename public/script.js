// Global variables
let currentUser = null;
let pigeons = [];
let editingPigeonId = null;
let filteredPigeons = [];
let isLoading = false;

// API Base URL - Environment-based configuration
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction 
    ? '/api'  // Vercel deployment - same domain
    : 'http://localhost:3000/api';
const IMAGE_BASE_URL = isProduction 
    ? '/api'  // Vercel deployment - same domain
    : 'http://localhost:3000';

// Enhanced fetch wrapper with better error handling and retry logic
async function apiFetch(url, options = {}, retries = 1) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    // Don't set Content-Type for FormData
    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
    }

    const finalOptions = { ...defaultOptions, ...options };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, finalOptions);
            
            // Handle different response types
            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                return data;
            } else {
                // Handle non-JSON responses (like file uploads)
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            }
        } catch (error) {
            // If this is the last attempt, throw the error
            if (attempt === retries) {
                throw error;
            }
            
            // Wait before retrying (reduced backoff)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}

// Show/hide loading state
function setLoadingState(loading) {
    isLoading = loading;
    const saveBtn = document.getElementById('savePigeonBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    if (saveBtn) {
        saveBtn.disabled = loading;
        saveBtn.innerHTML = loading ? 
            '<span class="loading-spinner"></span> Saving...' : 
            '<i class="fas fa-save me-2"></i>Save Pigeon';
    }
    
    if (saveProfileBtn) {
        saveProfileBtn.disabled = loading;
        saveProfileBtn.innerHTML = loading ? 
            '<span class="loading-spinner"></span> Saving...' : 
            'Save Changes';
    }
}

// DOM Elements
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userProfileImage = document.getElementById('userProfileImage');
const pigeonsGrid = document.getElementById('pigeonsGrid');
const savePigeonBtn = document.getElementById('savePigeonBtn');
const editPigeonBtn = document.getElementById('editPigeonBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Search and filter elements
const searchInput = document.getElementById('searchInput');
const colorFilter = document.getElementById('colorFilter');
const sexFilter = document.getElementById('sexFilter');
const sortBy = document.getElementById('sortBy');
const clearFilters = document.getElementById('clearFilters');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeImageUploads();
    initializeSearchAndFilter();
    checkAuthStatus();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Authentication form switches
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Form submissions
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignup);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Pigeon management
    if (savePigeonBtn) {
        savePigeonBtn.addEventListener('click', savePigeon);
    }
    if (editPigeonBtn) {
        editPigeonBtn.addEventListener('click', editCurrentPigeon);
    }

    // Profile management
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    // Modal events
    const addPigeonModal = document.getElementById('addPigeonModal');
    if (addPigeonModal) {
        addPigeonModal.addEventListener('hidden.bs.modal', resetPigeonForm);
    }

    // Profile image upload
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', handleProfileImageUpload);
    }
}

// Initialize image upload functionality
function initializeImageUploads() {
    const imageInputs = [
        'pigeonImageInput', 'fatherImageInput', 'motherImageInput',
        'galleryImagesInput'
    ];

    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', function(e) {
                if (inputId === 'galleryImagesInput') {
                    handleGalleryImageUpload(e);
                } else {
                    handleImageUpload(e, inputId.replace('Input', 'Preview'));
                }
            });
        }
    });
}

// Initialize search and filter functionality
function initializeSearchAndFilter() {
    if (searchInput) {
        searchInput.addEventListener('input', filterPigeons);
    }
    if (colorFilter) {
        colorFilter.addEventListener('change', filterPigeons);
    }
    if (sexFilter) {
        sexFilter.addEventListener('change', filterPigeons);
    }
    if (sortBy) {
        sortBy.addEventListener('change', filterPigeons);
    }
    if (clearFilters) {
        clearFilters.addEventListener('click', clearAllFilters);
    }
}

// Handle image upload and preview
function handleImageUpload(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    
    if (file && file.type.startsWith('image/')) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size must be less than 5MB', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="image-container">
                    <img src="${e.target.result}" class="image-preview" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeImage('${event.target.id}', '${previewId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Handle gallery image upload
function handleGalleryImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('galleryImagesPreview');
    
    if (files && files.length > 0) {
        // Check total file size
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
            if (files[i].size > 5 * 1024 * 1024) {
                showAlert(`Image ${files[i].name} is too large. Must be less than 5MB.`, 'warning');
                event.target.value = '';
                return;
            }
        }
        
        if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
            showAlert('Total gallery size must be less than 50MB', 'warning');
            event.target.value = '';
            return;
        }
        
        let previewHTML = '';
        let processedCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewHTML += `
                        <div class="image-container d-inline-block me-2 mb-2">
                            <img src="${e.target.result}" class="image-preview" alt="Gallery Preview" style="width: 80px; height: 80px;">
                            <button type="button" class="remove-image" onclick="removeGalleryImage(${i})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    processedCount++;
                    
                    // Update preview when all images are processed
                    if (processedCount === files.length) {
                        preview.innerHTML = previewHTML;
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    }
}

// Remove image
function removeImage(inputId, previewId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).innerHTML = '';
}

// Remove gallery image
function removeGalleryImage(index) {
    const input = document.getElementById('galleryImagesInput');
    const dt = new DataTransfer();
    const { files } = input;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dt.items.add(files[i]);
        }
    }
    
    input.files = dt.files;
    handleGalleryImageUpload({ target: { files: dt.files } });
}

// Check if user is already authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        try {
            currentUser = JSON.parse(user);
            showMainApp();
            
            // Load data in parallel for faster loading
            Promise.all([
                loadPigeons(),
                loadUserProfile()
            ]).catch(error => {
                console.error('Error loading initial data:', error);
                // If there's an error, clear invalid auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                showAuthSection();
            });
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            showAuthSection();
        }
    } else {
        showAuthSection();
    }
}

// Show authentication section
function showAuthSection() {
    authSection.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// Show main application
function showMainApp() {
    authSection.classList.add('hidden');
    mainApp.classList.remove('hidden');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${currentUser.name}`;
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Show loading state
    const loginBtn = document.querySelector('#loginFormElement button[type="submit"]');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';

    try {
        const data = await apiFetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;
        
        // Show main app immediately
        showMainApp();
        
        // Load data in parallel for faster loading
        await Promise.all([
            loadPigeons(),
            loadUserProfile()
        ]);
        
        showAlert('Login successful!', 'success');
    } catch (error) {
        showAlert(error.message || 'Network error. Please try again.', 'danger');
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }

    try {
        await apiFetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });

        showAlert('Account created successfully! Please login.', 'success');
        // Switch to login form
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        const signupFormElement = document.getElementById('signupFormElement');
        
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        signupFormElement.reset();
    } catch (error) {
        showAlert(error.message || 'Network error. Please try again.', 'danger');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    currentUser = null;
    pigeons = [];
    showAuthSection();
    if (loginFormElement) {
        loginFormElement.reset();
    }
    showAlert('Logged out successfully', 'info');
}

// Load pigeons from API
async function loadPigeons() {
    try {
        const token = localStorage.getItem('authToken');
        const pigeons = await apiFetch(`${API_BASE_URL}/pigeons`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        window.pigeons = pigeons;
        filteredPigeons = [...pigeons];
        renderPigeons();
    } catch (error) {
        showAlert('Failed to load pigeons. Please refresh the page.', 'warning');
    }
}

// Filter pigeons based on search and filter criteria
function filterPigeons() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const colorFilterValue = colorFilter ? colorFilter.value : '';
    const sexFilterValue = sexFilter ? sexFilter.value : '';
    const sortByValue = sortBy ? sortBy.value : 'name';

    filteredPigeons = pigeons.filter(pigeon => {
        const matchesSearch = !searchTerm || 
            pigeon.name.toLowerCase().includes(searchTerm) ||
            (pigeon.ringNumber && pigeon.ringNumber.toLowerCase().includes(searchTerm)) ||
            (pigeon.strain && pigeon.strain.toLowerCase().includes(searchTerm));
        
        const matchesColor = !colorFilterValue || pigeon.color === colorFilterValue;
        const matchesSex = !sexFilterValue || pigeon.sex === sexFilterValue;
        
        return matchesSearch && matchesColor && matchesSex;
    });

    // Sort pigeons
    filteredPigeons.sort((a, b) => {
        switch (sortByValue) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'dateOfBirth':
                return new Date(b.dateOfBirth || 0) - new Date(a.dateOfBirth || 0);
            case 'createdAt':
                return new Date(b.createdAt) - new Date(a.createdAt);
            default:
                return 0;
        }
    });

    renderPigeons();
}

// Clear all filters
function clearAllFilters() {
    if (searchInput) searchInput.value = '';
    if (colorFilter) colorFilter.value = '';
    if (sexFilter) sexFilter.value = '';
    if (sortBy) sortBy.value = 'name';
    
    filteredPigeons = [...pigeons];
    renderPigeons();
}

// Render pigeons in the grid
function renderPigeons() {
    const pigeonsToRender = filteredPigeons.length > 0 ? filteredPigeons : pigeons;
    
    if (pigeonsToRender.length === 0) {
        pigeonsGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="card bg-white bg-opacity-90 p-5">
                    <i class="fas fa-dove fa-4x text-muted mb-3"></i>
                    <h4 class="text-muted">No pigeons yet</h4>
                    <p class="text-muted">Add your first pigeon to get started!</p>
                </div>
            </div>
        `;
        return;
    }

    pigeonsGrid.innerHTML = pigeonsToRender.map(pigeon => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card pigeon-card bg-white bg-opacity-90 h-100">
                ${pigeon.pigeonImage ? 
                    `<img src="${IMAGE_BASE_URL}${pigeon.pigeonImage}" class="pigeon-image" alt="${pigeon.name}">` : 
                    `<div class="pigeon-image bg-light d-flex align-items-center justify-content-center">
                        <i class="fas fa-dove fa-3x text-muted"></i>
                    </div>`
                }
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${pigeon.name}</h5>
                        <div class="d-flex flex-column align-items-end">
                            ${pigeon.ringNumber ? `<small class="text-muted">${pigeon.ringNumber}</small>` : ''}
                            ${pigeon.color ? `<span class="badge bg-secondary">${pigeon.color}</span>` : ''}
                        </div>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">
                            ${pigeon.sex && pigeon.sex !== 'Unknown' ? `<div class="mb-1"><i class="fas fa-${pigeon.sex === 'Male' ? 'mars' : 'venus'} me-1"></i>${pigeon.sex}</div>` : ''}
                            ${pigeon.strain ? `<div class="mb-1"><i class="fas fa-tag me-1"></i>${pigeon.strain}</div>` : ''}
                            <div class="d-flex align-items-center mb-1">
                                <i class="fas fa-male me-2"></i>
                                ${pigeon.fatherImage ? `<img src="${IMAGE_BASE_URL}${pigeon.fatherImage}" class="family-image me-2" alt="Father">` : ''}
                                Father: ${pigeon.fatherName || 'Unknown'}
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-female me-2"></i>
                                ${pigeon.motherImage ? `<img src="${IMAGE_BASE_URL}${pigeon.motherImage}" class="family-image me-2" alt="Mother">` : ''}
                                Mother: ${pigeon.motherName || 'Unknown'}
                            </div>
                        </small>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm flex-fill" onclick="viewPigeon('${pigeon._id}')">
                            <i class="fas fa-eye me-1"></i>View
                        </button>
                        <button class="btn btn-outline-secondary btn-sm flex-fill" onclick="editPigeon('${pigeon._id}')">
                            <i class="fas fa-edit me-1"></i>Edit
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deletePigeon('${pigeon._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Save pigeon (create or update)
async function savePigeon() {
    const formData = getPigeonFormData();
    
    if (!formData.get('name')) {
        showAlert('Please fill in the pigeon name', 'warning');
        return;
    }

    if (isLoading) return; // Prevent multiple submissions

    try {
        setLoadingState(true);
        const token = localStorage.getItem('authToken');
        const url = editingPigeonId 
            ? `${API_BASE_URL}/pigeons/${editingPigeonId}`
            : `${API_BASE_URL}/pigeons`;
        
        const method = editingPigeonId ? 'PUT' : 'POST';

        const savedPigeon = await apiFetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (editingPigeonId) {
            const index = pigeons.findIndex(p => p._id === editingPigeonId);
            if (index !== -1) {
                pigeons[index] = savedPigeon;
            }
        } else {
            pigeons.push(savedPigeon);
        }
        
        filteredPigeons = [...pigeons];
        renderPigeons();
        bootstrap.Modal.getInstance(document.getElementById('addPigeonModal')).hide();
        showAlert(editingPigeonId ? 'Pigeon updated successfully!' : 'Pigeon added successfully!', 'success');
        editingPigeonId = null;
    } catch (error) {
        showAlert(error.message || 'Network error. Please try again.', 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Get form data from pigeon form with images
function getPigeonFormData() {
    const formData = new FormData();
    
    // Basic information
    const name = document.getElementById('pigeonName').value.trim();
    if (!name) {
        throw new Error('Pigeon name is required');
    }
    
    formData.append('name', name);
    formData.append('ringNumber', document.getElementById('ringNumber').value.trim());
    formData.append('dateOfBirth', document.getElementById('dateOfBirth').value);
    formData.append('color', document.getElementById('color').value.trim());
    formData.append('sex', document.getElementById('sex').value);
    formData.append('strain', document.getElementById('strain').value.trim());
    formData.append('breeder', document.getElementById('breeder').value.trim());
    formData.append('notes', document.getElementById('notes').value.trim());
    formData.append('fatherName', document.getElementById('fatherName').value.trim());
    formData.append('motherName', document.getElementById('motherName').value.trim());
    
    // Images - only append if files exist
    const imageInputs = [
        'pigeonImageInput', 'fatherImageInput', 'motherImageInput'
    ];
    
    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && input.files[0]) {
            formData.append(input.name, input.files[0]);
        }
    });
    
    // Pedigree names - only append if values exist
    const pedigreeFields = ['father', 'mother'];
    pedigreeFields.forEach(field => {
        const nameInput = document.getElementById(`${field}Name`);
        if (nameInput && nameInput.value.trim()) {
            formData.append(`${field}Name`, nameInput.value.trim());
        }
    });
    
    return formData;
}

// Reset pigeon form
function resetPigeonForm() {
    document.getElementById('pigeonForm').reset();
    document.getElementById('modalTitle').textContent = 'Add New Pigeon';
    editingPigeonId = null;
    
    // Clear all image previews
    const previewIds = [
        'pigeonImagePreview', 'fatherImagePreview', 'motherImagePreview',
        'galleryImagesPreview'
    ];
    
    previewIds.forEach(previewId => {
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.innerHTML = '';
        }
    });
}

// View pigeon details
function viewPigeon(pigeonId) {
    const pigeon = pigeons.find(p => p._id === pigeonId);
    if (!pigeon) return;

    const pedigree = pigeon.pedigree || {};
    
    document.getElementById('pigeonDetails').innerHTML = `
        <!-- Main Pigeon Image -->
        <div class="row mb-4">
            <div class="col-12">
                ${pigeon.pigeonImage ? 
                    `<img src="${IMAGE_BASE_URL}${pigeon.pigeonImage}" class="pigeon-main-image" alt="${pigeon.name}">` : 
                    '<div class="pigeon-main-image-placeholder"><i class="fas fa-dove"></i></div>'
                }
            </div>
        </div>

        <!-- Basic Information -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="info-card">
                    <h6><i class="fas fa-info-circle me-2"></i>Basic Information</h6>
                    <div class="info-item">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${pigeon.name}</span>
                    </div>
                    ${pigeon.ringNumber ? `
                        <div class="info-item">
                            <span class="info-label">Ring Number:</span>
                            <span class="info-value">${pigeon.ringNumber}</span>
                        </div>
                    ` : ''}
                    ${pigeon.dateOfBirth ? `
                        <div class="info-item">
                            <span class="info-label">Date of Birth:</span>
                            <span class="info-value">${new Date(pigeon.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                    ${pigeon.color ? `
                        <div class="info-item">
                            <span class="info-label">Color:</span>
                            <span class="info-value">${pigeon.color}</span>
                        </div>
                    ` : ''}
                    ${pigeon.sex && pigeon.sex !== 'Unknown' ? `
                        <div class="info-item">
                            <span class="info-label">Sex:</span>
                            <span class="info-value">${pigeon.sex}</span>
                        </div>
                    ` : ''}
                    ${pigeon.strain ? `
                        <div class="info-item">
                            <span class="info-label">Strain:</span>
                            <span class="info-value">${pigeon.strain}</span>
                        </div>
                    ` : ''}
                    ${pigeon.breeder ? `
                        <div class="info-item">
                            <span class="info-label">Breeder:</span>
                            <span class="info-value">${pigeon.breeder}</span>
                        </div>
                    ` : ''}
                    ${pigeon.notes ? `
                        <div class="info-item">
                            <span class="info-label">Notes:</span>
                            <span class="info-value">${pigeon.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Family Information -->
            <div class="col-md-6">
                <div class="info-card">
                    <h6><i class="fas fa-users me-2"></i>Family Information</h6>
                    <div class="family-member">
                        ${pigeon.fatherImage ? 
                            `<img src="${IMAGE_BASE_URL}${pigeon.fatherImage}" class="family-member-image" alt="Father">` : 
                            '<div class="family-member-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-male text-muted"></i></div>'
                        }
                        <div class="family-member-info">
                            <div class="family-member-name">${pigeon.fatherName || 'Unknown'}</div>
                            <div class="family-member-role">Father</div>
                        </div>
                    </div>
                    <div class="family-member">
                        ${pigeon.motherImage ? 
                            `<img src="${IMAGE_BASE_URL}${pigeon.motherImage}" class="family-member-image" alt="Mother">` : 
                            '<div class="family-member-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-female text-muted"></i></div>'
                        }
                        <div class="family-member-info">
                            <div class="family-member-name">${pigeon.motherName || 'Unknown'}</div>
                            <div class="family-member-role">Mother</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pedigree Information -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="info-card">
                    <h6><i class="fas fa-sitemap me-2"></i>Pedigree Tree</h6>
                    <div class="pedigree-tree-enhanced">
                        <div class="pedigree-level-enhanced">
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Great-Grandfather</strong>
                                ${pedigree.greatGreatGrandfather && pedigree.greatGreatGrandfather.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.greatGreatGrandfather.image}" class="pedigree-image-enhanced" alt="GGG Father">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGreatGrandfather ? pedigree.greatGreatGrandfather.name : 'Unknown'}</div>
                            </div>
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Great-Grandmother</strong>
                                ${pedigree.greatGreatGrandmother && pedigree.greatGreatGrandmother.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.greatGreatGrandmother.image}" class="pedigree-image-enhanced" alt="GGG Mother">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGreatGrandmother ? pedigree.greatGreatGrandmother.name : 'Unknown'}</div>
                            </div>
                        </div>
                        <div class="pedigree-level-enhanced">
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Grandfather</strong>
                                ${pedigree.greatGrandfather && pedigree.greatGrandfather.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.greatGrandfather.image}" class="pedigree-image-enhanced" alt="GG Father">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGrandfather ? pedigree.greatGrandfather.name : 'Unknown'}</div>
                            </div>
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Grandmother</strong>
                                ${pedigree.greatGrandmother && pedigree.greatGrandmother.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.greatGrandmother.image}" class="pedigree-image-enhanced" alt="GG Mother">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGrandmother ? pedigree.greatGrandmother.name : 'Unknown'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Save profile
async function saveProfile() {
    try {
        const token = localStorage.getItem('authToken');
        
        // First, update profile information (name, email)
        const profileData = await apiFetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: document.getElementById('profileName').value.trim(),
                email: document.getElementById('profileEmail').value.trim()
            })
        });

        // Then, handle profile image upload if a file is selected
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput && profileImageInput.files[0]) {
            const imageFormData = new FormData();
            imageFormData.append('profileImage', profileImageInput.files[0]);
            
            const imageData = await apiFetch(`${API_BASE_URL}/auth/profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: imageFormData
            });
            
            // Update current user with new image data
            currentUser = { ...profileData.user, profileImage: imageData.user.profileImage };
        } else {
            currentUser = profileData.user;
        }
        
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        if (userInfo) {
            userInfo.textContent = `Welcome, ${currentUser.name}`;
        }
        
        showAlert('Profile updated successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
    } catch (error) {
        showAlert(error.message || 'Failed to update profile', 'danger');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        const user = await apiFetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileEmail').value = user.email || '';
        
        if (user.profileImage) {
            document.getElementById('profileImagePreview').innerHTML = 
                `<img src="${IMAGE_BASE_URL}${user.profileImage}" class="rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">`;
        }
    } catch (error) {
        // Silently fail - profile loading is not critical
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHTML;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}