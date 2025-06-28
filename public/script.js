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
    console.log('DOM loaded, initializing application...');
    initializeEventListeners();
    initializeImageUploads();
    initializeSearchAndFilter();
    checkAuthStatus();
    addTestButton();
});

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    
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
    
    console.log('Event listeners initialized');
}

// Re-initialize pigeon management buttons after main app is shown
function initializePigeonButtons() {
    console.log('Initializing pigeon management buttons...');
    
    // Pigeon management buttons
    const savePigeonBtn = document.getElementById('savePigeonBtn');
    if (savePigeonBtn) {
        console.log('Found savePigeonBtn, adding event listener');
        savePigeonBtn.addEventListener('click', savePigeon);
    } else {
        console.log('savePigeonBtn not found');
    }
    
    const editPigeonBtn = document.getElementById('editPigeonBtn');
    if (editPigeonBtn) {
        console.log('Found editPigeonBtn, adding event listener');
        editPigeonBtn.addEventListener('click', editCurrentPigeon);
    } else {
        console.log('editPigeonBtn not found');
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
    console.log('=== IMAGE UPLOAD HANDLER ===');
    console.log('Event:', event);
    console.log('Preview ID:', previewId);
    
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    
    console.log('File:', file);
    console.log('Preview element:', preview);
    
    if (file && file.type.startsWith('image/')) {
        console.log('✅ Valid image file detected:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image size must be less than 5MB', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('✅ File read successfully, length:', e.target.result.length);
            console.log('Preview data:', e.target.result.substring(0, 50) + '...');
            
            preview.innerHTML = `
                <div class="image-container">
                    <img src="${e.target.result}" class="image-preview" alt="Preview">
                    <button type="button" class="remove-image" onclick="removeImage('${event.target.id}', '${previewId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            console.log('✅ Preview updated');
        };
        
        reader.onerror = function(error) {
            console.error('❌ Error reading file:', error);
            showAlert('Error reading image file', 'danger');
        };
        
        reader.readAsDataURL(file);
    } else {
        console.log('❌ Invalid file or no file selected');
        if (file) {
            console.log('File type:', file.type);
            showAlert('Please select a valid image file', 'warning');
        }
        event.target.value = '';
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
    initializePigeonButtons();
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
                    `<img src="${pigeon.pigeonImage}" class="pigeon-image" alt="${pigeon.name}">` : 
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
                                ${pigeon.fatherImage ? `<img src="${pigeon.fatherImage}" class="family-image me-2" alt="Father">` : ''}
                                Father: ${pigeon.fatherName || 'Unknown'}
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-female me-2"></i>
                                ${pigeon.motherImage ? `<img src="${pigeon.motherImage}" class="family-image me-2" alt="Mother">` : ''}
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
    try {
        if (isLoading) return; // Prevent multiple submissions

        // Get basic form data
        const name = document.getElementById('pigeonName').value.trim();
        if (!name) {
            showAlert('Please fill in the pigeon name', 'warning');
            return;
        }

        setLoadingState(true);
        const token = localStorage.getItem('authToken');

        // Convert images to base64 directly in frontend
        const imageData = {
            pigeonImage: '',
            fatherImage: '',
            motherImage: ''
        };

        const imageInputs = [
            { id: 'pigeonImageInput', field: 'pigeonImage' },
            { id: 'fatherImageInput', field: 'fatherImage' },
            { id: 'motherImageInput', field: 'motherImage' }
        ];

        console.log('=== IMAGE UPLOAD DEBUG ===');
        
        for (const input of imageInputs) {
            const fileInput = document.getElementById(input.id);
            console.log(`Checking ${input.id}:`, fileInput);
            
            if (fileInput && fileInput.files[0]) {
                const file = fileInput.files[0];
                console.log(`File found for ${input.field}:`, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified
                });
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    console.error(`Invalid file type for ${input.field}:`, file.type);
                    showAlert(`Please select a valid image file for ${input.field}`, 'warning');
                    continue;
                }
                
                // Convert file to base64
                try {
                    const base64 = await fileToBase64(file);
                    console.log(`${input.field} base64 length:`, base64.length);
                    console.log(`${input.field} base64 preview:`, base64.substring(0, 50) + '...');
                    imageData[input.field] = base64;
                    console.log(`${input.field} converted successfully`);
                } catch (error) {
                    console.error(`Error converting ${input.field}:`, error);
                    showAlert(`Failed to process ${input.field}`, 'warning');
                }
            } else {
                console.log(`No file selected for ${input.field}`);
            }
        }

        console.log('Final image data:', {
            hasPigeonImage: !!imageData.pigeonImage,
            hasFatherImage: !!imageData.fatherImage,
            hasMotherImage: !!imageData.motherImage
        });

        // Create pigeon with image data
        const pigeonData = {
            name: name,
            ringNumber: document.getElementById('ringNumber').value.trim(),
            dateOfBirth: document.getElementById('dateOfBirth').value,
            color: document.getElementById('color').value.trim(),
            sex: document.getElementById('sex').value,
            strain: document.getElementById('strain').value.trim(),
            breeder: document.getElementById('breeder').value.trim(),
            notes: document.getElementById('notes').value.trim(),
            fatherName: document.getElementById('fatherName').value.trim(),
            motherName: document.getElementById('motherName').value.trim(),
            pigeonImage: imageData.pigeonImage,
            fatherImage: imageData.fatherImage,
            motherImage: imageData.motherImage
        };

        console.log('Creating pigeon with data:', {
            name: pigeonData.name,
            hasPigeonImage: !!pigeonData.pigeonImage,
            hasFatherImage: !!pigeonData.fatherImage,
            hasMotherImage: !!pigeonData.motherImage
        });

        const url = editingPigeonId 
            ? `${API_BASE_URL}/pigeons/${editingPigeonId}`
            : `${API_BASE_URL}/pigeons`;
        
        const method = editingPigeonId ? 'PUT' : 'POST';

        const savedPigeon = await apiFetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pigeonData)
        });
        
        console.log('Pigeon saved successfully:', savedPigeon);
        console.log('Saved pigeon images:', {
            hasPigeonImage: !!savedPigeon.pigeonImage,
            hasFatherImage: !!savedPigeon.fatherImage,
            hasMotherImage: !!savedPigeon.motherImage
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
        console.error('Error saving pigeon:', error);
        showAlert(error.message || 'Network error. Please try again.', 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
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
    
    console.log('Processing image inputs...');
    imageInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        console.log(`Checking ${inputId}:`, input);
        if (input && input.files[0]) {
            console.log(`Adding file for ${inputId}:`, input.files[0].name, input.files[0].size, input.files[0].type);
            formData.append(input.name, input.files[0]);
        } else {
            console.log(`No file for ${inputId}`);
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
    
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
    }
    
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
                    `<img src="${pigeon.pigeonImage}" class="pigeon-main-image" alt="${pigeon.name}">` : 
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
                            `<img src="${pigeon.fatherImage}" class="family-member-image" alt="Father">` : 
                            '<div class="family-member-image bg-light d-flex align-items-center justify-content-center"><i class="fas fa-male text-muted"></i></div>'
                        }
                        <div class="family-member-info">
                            <div class="family-member-name">${pigeon.fatherName || 'Unknown'}</div>
                            <div class="family-member-role">Father</div>
                        </div>
                    </div>
                    <div class="family-member">
                        ${pigeon.motherImage ? 
                            `<img src="${pigeon.motherImage}" class="family-member-image" alt="Mother">` : 
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
                                    `<img src="${pedigree.greatGreatGrandfather.image}" class="pedigree-image-enhanced" alt="GGG Father">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGreatGrandfather ? pedigree.greatGreatGrandfather.name : 'Unknown'}</div>
                            </div>
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Great-Grandmother</strong>
                                ${pedigree.greatGreatGrandmother && pedigree.greatGreatGrandmother.image ? 
                                    `<img src="${pedigree.greatGreatGrandmother.image}" class="pedigree-image-enhanced" alt="GGG Mother">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGreatGrandmother ? pedigree.greatGreatGrandmother.name : 'Unknown'}</div>
                            </div>
                        </div>
                        <div class="pedigree-level-enhanced">
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Grandfather</strong>
                                ${pedigree.greatGrandfather && pedigree.greatGrandfather.image ? 
                                    `<img src="${pedigree.greatGrandfather.image}" class="pedigree-image-enhanced" alt="GG Father">` : 
                                    '<div class="pedigree-image-enhanced bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user text-muted"></i></div>'
                                }
                                <div>${pedigree.greatGrandfather ? pedigree.greatGrandfather.name : 'Unknown'}</div>
                            </div>
                            <div class="pedigree-item-enhanced">
                                <strong>Great-Grandmother</strong>
                                ${pedigree.greatGrandmother && pedigree.greatGrandmother.image ? 
                                    `<img src="${pedigree.greatGrandmother.image}" class="pedigree-image-enhanced" alt="GG Mother">` : 
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
                `<img src="${user.profileImage}" class="rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">`;
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

// Test image upload function
function testImageUpload() {
    console.log('=== TESTING IMAGE UPLOAD ===');
    
    const imageInputs = [
        { id: 'pigeonImageInput', field: 'pigeonImage' },
        { id: 'fatherImageInput', field: 'fatherImage' },
        { id: 'motherImageInput', field: 'motherImage' }
    ];
    
    imageInputs.forEach(input => {
        const fileInput = document.getElementById(input.id);
        console.log(`\n--- Testing ${input.id} ---`);
        console.log('File input element:', fileInput);
        
        if (fileInput) {
            console.log('Files in input:', fileInput.files);
            console.log('Number of files:', fileInput.files.length);
            
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                console.log('File details:', {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: new Date(file.lastModified)
                });
                
                // Test if it's a real image
                if (file.type.startsWith('image/')) {
                    console.log('✅ Valid image file detected');
                } else {
                    console.log('❌ Not a valid image file');
                }
            } else {
                console.log('❌ No files selected');
            }
        } else {
            console.log('❌ File input element not found');
        }
    });
}

// Add test button to the page
function addTestButton() {
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Image Upload';
    testButton.className = 'btn btn-warning btn-sm';
    testButton.onclick = testImageUpload;
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    document.body.appendChild(testButton);
}

// Edit current pigeon
function editCurrentPigeon() {
    console.log('Edit pigeon button clicked');
    if (!editingPigeonId) {
        showAlert('No pigeon selected for editing', 'warning');
        return;
    }
    
    const pigeon = pigeons.find(p => p._id === editingPigeonId);
    if (!pigeon) {
        showAlert('Pigeon not found', 'error');
        return;
    }
    
    // Fill form with pigeon data
    document.getElementById('pigeonName').value = pigeon.name || '';
    document.getElementById('ringNumber').value = pigeon.ringNumber || '';
    document.getElementById('dateOfBirth').value = pigeon.dateOfBirth || '';
    document.getElementById('color').value = pigeon.color || '';
    document.getElementById('sex').value = pigeon.sex || 'Unknown';
    document.getElementById('strain').value = pigeon.strain || '';
    document.getElementById('breeder').value = pigeon.breeder || '';
    document.getElementById('notes').value = pigeon.notes || '';
    document.getElementById('fatherName').value = pigeon.fatherName || '';
    document.getElementById('motherName').value = pigeon.motherName || '';
    
    // Show images if they exist
    if (pigeon.pigeonImage) {
        document.getElementById('pigeonImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${pigeon.pigeonImage}" class="image-preview" alt="Pigeon Preview">
                <button type="button" class="remove-image" onclick="removeImage('pigeonImageInput', 'pigeonImagePreview')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    if (pigeon.fatherImage) {
        document.getElementById('fatherImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${pigeon.fatherImage}" class="image-preview" alt="Father Preview">
                <button type="button" class="remove-image" onclick="removeImage('fatherImageInput', 'fatherImagePreview')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    if (pigeon.motherImage) {
        document.getElementById('motherImagePreview').innerHTML = `
            <div class="image-container">
                <img src="${pigeon.motherImage}" class="image-preview" alt="Mother Preview">
                <button type="button" class="remove-image" onclick="removeImage('motherImageInput', 'motherImagePreview')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Pigeon';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addPigeonModal'));
    modal.show();
}

// Handle profile image upload
function handleProfileImageUpload(event) {
    console.log('=== PROFILE IMAGE UPLOAD ===');
    const file = event.target.files[0];
    const preview = document.getElementById('profileImagePreview');
    
    console.log('Profile image file:', file);
    
    if (file && file.type.startsWith('image/')) {
        console.log('✅ Valid profile image detected:', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Profile image size must be less than 5MB', 'warning');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('✅ Profile image read successfully');
            preview.src = e.target.result;
        };
        
        reader.onerror = function(error) {
            console.error('❌ Error reading profile image:', error);
            showAlert('Error reading profile image', 'danger');
        };
        
        reader.readAsDataURL(file);
    } else {
        console.log('❌ Invalid profile image file');
        if (file) {
            console.log('File type:', file.type);
            showAlert('Please select a valid image file for profile', 'warning');
        }
        event.target.value = '';
    }
}