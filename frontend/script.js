// Global variables
let currentUser = null;
let pigeons = [];
let editingPigeonId = null;
let filteredPigeons = [];

// API Base URL - Environment-based configuration
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction 
    ? `${window.location.origin}/api`  // Use current domain for production
    : 'http://localhost:3000/api';
const IMAGE_BASE_URL = isProduction 
    ? window.location.origin  // Use current domain for production
    : 'http://localhost:3000';

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
        'gggFatherImageInput', 'gggMotherImageInput', 'ggFatherImageInput',
        'ggMotherImageInput', 'gFatherImageInput', 'gMotherImageInput',
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
        let previewHTML = '';
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
                    preview.innerHTML = previewHTML;
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
        currentUser = JSON.parse(user);
        showMainApp();
        loadPigeons();
        loadUserProfile();
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

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMainApp();
            loadPigeons();
            loadUserProfile();
            showAlert('Login successful!', 'success');
        } else {
            showAlert(data.message || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'danger');
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
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Account created successfully! Please login.', 'success');
            // Switch to login form
            const signupForm = document.getElementById('signupForm');
            const loginForm = document.getElementById('loginForm');
            const signupFormElement = document.getElementById('signupFormElement');
            
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            signupFormElement.reset();
        } else {
            showAlert(data.message || 'Signup failed', 'danger');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Network error. Please try again.', 'danger');
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
        const response = await fetch(`${API_BASE_URL}/pigeons`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            pigeons = await response.json();
            filteredPigeons = [...pigeons];
            renderPigeons();
        } else {
            console.error('Failed to load pigeons');
        }
    } catch (error) {
        console.error('Error loading pigeons:', error);
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

    try {
        const token = localStorage.getItem('authToken');
        const url = editingPigeonId 
            ? `${API_BASE_URL}/pigeons/${editingPigeonId}`
            : `${API_BASE_URL}/pigeons`;
        
        const method = editingPigeonId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const savedPigeon = await response.json();
            
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
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to save pigeon', 'danger');
        }
    } catch (error) {
        console.error('Error saving pigeon:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

// Get form data from pigeon form with images
function getPigeonFormData() {
    const formData = new FormData();
    
    // Basic information
    formData.append('name', document.getElementById('pigeonName').value);
    formData.append('ringNumber', document.getElementById('ringNumber').value);
    formData.append('dateOfBirth', document.getElementById('dateOfBirth').value);
    formData.append('color', document.getElementById('color').value);
    formData.append('sex', document.getElementById('sex').value);
    formData.append('strain', document.getElementById('strain').value);
    formData.append('breeder', document.getElementById('breeder').value);
    formData.append('notes', document.getElementById('notes').value);
    formData.append('fatherName', document.getElementById('fatherName').value);
    formData.append('motherName', document.getElementById('motherName').value);
    
    // Images
    const imageInputs = [
        'pigeonImageInput', 'fatherImageInput', 'motherImageInput',
        'gggFatherImageInput', 'gggMotherImageInput', 'ggFatherImageInput',
        'ggMotherImageInput', 'gFatherImageInput', 'gMotherImageInput'
    ];
    
    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && input.files[0]) {
            formData.append(input.name, input.files[0]);
        }
    });
    
    // Gallery images
    const galleryInput = document.getElementById('galleryImagesInput');
    if (galleryInput && galleryInput.files) {
        for (let i = 0; i < galleryInput.files.length; i++) {
            formData.append('galleryImages', galleryInput.files[i]);
        }
    }
    
    // Pedigree names
    const pedigreeFields = ['gggFather', 'gggMother', 'ggFather', 'ggMother', 'gFather', 'gMother'];
    pedigreeFields.forEach(field => {
        const nameInput = document.getElementById(`${field}Name`);
        if (nameInput && nameInput.value) {
            formData.append(`${field}Name`, nameInput.value);
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
        'gggFatherImagePreview', 'gggMotherImagePreview', 'ggFatherImagePreview',
        'ggMotherImagePreview', 'gFatherImagePreview', 'gMotherImagePreview',
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
                        <div class="pedigree-level-enhanced">
                            <div class="pedigree-item-enhanced">
                                <strong>Grandfather</strong>
                                ${pedigree.grandfather && pedigree.grandfather.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.grandfather.image}" class="pedigree-image-enhanced" alt="G Father">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.grandfather ? pedigree.grandfather.name : 'Unknown'}</div>
                            </div>
                            <div class="pedigree-item-enhanced">
                                <strong>Grandmother</strong>
                                ${pedigree.grandmother && pedigree.grandmother.image ? 
                                    `<img src="${IMAGE_BASE_URL}${pedigree.grandmother.image}" class="pedigree-image-enhanced" alt="G Mother">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.grandmother ? pedigree.grandmother.name : 'Unknown'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gallery Section -->
        ${pigeon.images && pigeon.images.length > 0 ? `
        <div class="row">
            <div class="col-12">
                <div class="gallery-section">
                    <h6><i class="fas fa-images me-2"></i>Gallery</h6>
                    <div class="gallery-grid">
                        ${pigeon.images.map(img => `
                            <div class="gallery-item">
                                <img src="${IMAGE_BASE_URL}${img}" class="gallery-image" alt="Gallery Image">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;

    // Store the pigeon ID for editing
    editPigeonBtn.onclick = () => editPigeon(pigeonId);
    
    const viewModal = new bootstrap.Modal(document.getElementById('viewPigeonModal'));
    viewModal.show();
}

// Edit pigeon
function editPigeon(pigeonId) {
    const pigeon = pigeons.find(p => p._id === pigeonId);
    if (!pigeon) return;

    editingPigeonId = pigeonId;
    document.getElementById('modalTitle').textContent = 'Edit Pigeon';
    
    // Fill form with pigeon data
    document.getElementById('pigeonName').value = pigeon.name;
    document.getElementById('ringNumber').value = pigeon.ringNumber || '';
    document.getElementById('dateOfBirth').value = pigeon.dateOfBirth ? new Date(pigeon.dateOfBirth).toISOString().split('T')[0] : '';
    document.getElementById('color').value = pigeon.color || '';
    document.getElementById('sex').value = pigeon.sex || 'Unknown';
    document.getElementById('strain').value = pigeon.strain || '';
    document.getElementById('breeder').value = pigeon.breeder || '';
    document.getElementById('notes').value = pigeon.notes || '';
    document.getElementById('fatherName').value = pigeon.fatherName || '';
    document.getElementById('motherName').value = pigeon.motherName || '';
    
    // Show existing images
    if (pigeon.pigeonImage) {
        document.getElementById('pigeonImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${IMAGE_BASE_URL}${pigeon.pigeonImage}" class="image-preview" alt="Pigeon">
            </div>
        `;
    }
    
    if (pigeon.fatherImage) {
        document.getElementById('fatherImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${IMAGE_BASE_URL}${pigeon.fatherImage}" class="image-preview" alt="Father">
            </div>
        `;
    }
    
    if (pigeon.motherImage) {
        document.getElementById('motherImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${IMAGE_BASE_URL}${pigeon.motherImage}" class="image-preview" alt="Mother">
            </div>
        `;
    }
    
    // Show existing gallery images
    if (pigeon.images && pigeon.images.length > 0) {
        const galleryPreview = document.getElementById('galleryImagesPreview');
        galleryPreview.innerHTML = pigeon.images.map(img => `
            <div class="image-container d-inline-block me-2 mb-2">
                <img src="${IMAGE_BASE_URL}${img}" class="image-preview" alt="Gallery Image" style="width: 80px; height: 80px;">
            </div>
        `).join('');
    }
    
    const pedigree = pigeon.pedigree || {};
    
    // Map frontend field names to backend field names
    const fieldMapping = {
        'gggFather': 'greatGreatGrandfather',
        'gggMother': 'greatGreatGrandmother',
        'ggFather': 'greatGrandfather',
        'ggMother': 'greatGrandmother',
        'gFather': 'grandfather',
        'gMother': 'grandmother'
    };
    
    Object.keys(fieldMapping).forEach(frontendField => {
        const backendField = fieldMapping[frontendField];
        const nameInput = document.getElementById(`${frontendField}Name`);
        const previewDiv = document.getElementById(`${frontendField}ImagePreview`);
        
        if (nameInput) {
            nameInput.value = pedigree[backendField] ? pedigree[backendField].name : '';
        }
        
        if (previewDiv && pedigree[backendField] && pedigree[backendField].image) {
            previewDiv.innerHTML = `
                <div class="image-container">
                    <img src="${IMAGE_BASE_URL}${pedigree[backendField].image}" class="image-preview" alt="${frontendField}">
                </div>
            `;
        }
    });

    // Close view modal and open edit modal
    bootstrap.Modal.getInstance(document.getElementById('viewPigeonModal')).hide();
    const editModal = new bootstrap.Modal(document.getElementById('addPigeonModal'));
    editModal.show();
}

// Edit current pigeon (from view modal)
function editCurrentPigeon() {
    if (editingPigeonId) {
        editPigeon(editingPigeonId);
    }
}

// Delete pigeon
async function deletePigeon(pigeonId) {
    if (!confirm('Are you sure you want to delete this pigeon?')) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/pigeons/${pigeonId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            pigeons = pigeons.filter(p => p._id !== pigeonId);
            filteredPigeons = filteredPigeons.filter(p => p._id !== pigeonId);
            renderPigeons();
            showAlert('Pigeon deleted successfully', 'success');
        } else {
            showAlert('Failed to delete pigeon', 'danger');
        }
    } catch (error) {
        console.error('Error deleting pigeon:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

// Handle profile image upload
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('profileImagePreview');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Save profile
async function saveProfile() {
    const formData = new FormData();
    const profileImageInput = document.getElementById('profileImageInput');
    const profileName = document.getElementById('profileName').value;
    
    if (profileImageInput && profileImageInput.files[0]) {
        formData.append('profileImage', profileImageInput.files[0]);
    }
    
    try {
        const token = localStorage.getItem('authToken');
        
        // Update profile image if provided
        if (profileImageInput && profileImageInput.files[0]) {
            const imageResponse = await fetch(`${API_BASE_URL}/auth/profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                if (userProfileImage) {
                    userProfileImage.src = `${IMAGE_BASE_URL}${imageData.profileImage}`;
                }
            }
        }
        
        // Update user info in localStorage
        if (currentUser) {
            currentUser.name = profileName;
            localStorage.setItem('user', JSON.stringify(currentUser));
            if (userInfo) {
                userInfo.textContent = `Welcome, ${currentUser.name}`;
            }
        }
        
        bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
        showAlert('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile', 'danger');
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Update profile form
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileImagePreview = document.getElementById('profileImagePreview');
            
            if (profileName) profileName.value = userData.name;
            if (profileEmail) profileEmail.value = userData.email;
            
            if (userData.profileImage && profileImagePreview) {
                profileImagePreview.src = `${IMAGE_BASE_URL}${userData.profileImage}`;
            }
            
            if (userData.profileImage && userProfileImage) {
                userProfileImage.src = `${IMAGE_BASE_URL}${userData.profileImage}`;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Show alert message
function showAlert(message, type) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
} 