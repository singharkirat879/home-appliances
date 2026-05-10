import { createIcons, icons } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

document.addEventListener("DOMContentLoaded", () => {
    // Create Lucide Icons
    createIcons({ icons });

    const loginScreen = document.getElementById("admin-login-screen");
    const dashboardScreen = document.getElementById("admin-dashboard-screen");
    
    // Login Form Elements
    const loginForm = document.getElementById("admin-login-form");
    const usernameInput = document.getElementById("admin-username");
    const passwordInput = document.getElementById("admin-password");
    const loginError = document.getElementById("login-error");

    // Dashboard Elements
    const productsTableBody = document.getElementById("products-table-body");
    const logoutBtn = document.getElementById("logout-btn");
    const addProductBtn = document.getElementById("add-product-btn");

    // Modal Elements
    const modal = document.getElementById("product-modal");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const productForm = document.getElementById("product-form");
    const modalTitle = document.getElementById("modal-title");

    let isEditMode = false;
    let productsList = [];

    // Check Authentication Status on Load
    checkAuthStatus();

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/admin/status');
            const data = await response.json();
            if (data.isAdmin) {
                showDashboard();
            } else {
                showLogin();
            }
        } catch (error) {
            showLogin();
        }
    }

    function showLogin() {
        loginScreen.style.display = "flex";
        dashboardScreen.style.display = "none";
    }

    function showDashboard() {
        loginScreen.style.display = "none";
        dashboardScreen.style.display = "flex";
        fetchProducts();
    }

    // Handle Login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.style.display = "none";
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: usernameInput.value, 
                    password: passwordInput.value 
                })
            });
            
            if (response.ok) {
                showDashboard();
            } else {
                const data = await response.json();
                loginError.textContent = data.error || "Login failed";
                loginError.style.display = "block";
            }
        } catch (error) {
            loginError.textContent = "Server error";
            loginError.style.display = "block";
        }
    });

    // Handle Logout
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch('/api/admin/logout', { method: 'POST' });
        showLogin();
    });

    // Fetch Products
    async function fetchProducts() {
        try {
            const response = await fetch('/api/admin/products');
            if (response.ok) {
                productsList = await response.json();
                renderProducts();
            } else {
                if(response.status === 401) showLogin();
            }
        } catch (error) {
            console.error("Error fetching products", error);
        }
    }

    // Render Products Table
    function renderProducts() {
        productsTableBody.innerHTML = "";
        productsList.forEach(product => {
            // safely parse images
            let imageUrl = "../images/placeholder.jpg";
            try {
                if (typeof product.image === "string") {
                    const parsed = JSON.parse(product.image);
                    if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
                    else if (typeof parsed === "string") imageUrl = parsed;
                } else if (Array.isArray(product.image) && product.image.length > 0) {
                    imageUrl = product.image[0];
                }
            } catch (e) {
                // if it's just a raw URL string
                if (product.image && !product.image.startsWith("[")) {
                    imageUrl = product.image;
                }
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${product.id}</td>
                <td><img src="${imageUrl}" class="prod-img-thumb" onerror="this.src='../images/placeholder.jpg'"></td>
                <td><strong>${product.name}</strong></td>
                <td style="text-transform: capitalize;">${product.category}</td>
                <td>₹${product.price}</td>
                <td>${product.stock}</td>
                <td class="action-btns">
                    <button class="edit-btn" data-id="${product.id}" title="Edit"><i data-lucide="edit"></i></button>
                    <button class="delete-btn" data-id="${product.id}" title="Delete"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            productsTableBody.appendChild(tr);
        });
        createIcons({ icons });

        // Attach event listeners to buttons
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => openEditModal(btn.getAttribute("data-id")));
        });
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-id")));
        });
    }

    // Modal Logic
    addProductBtn.addEventListener("click", () => {
        isEditMode = false;
        modalTitle.textContent = "Add Product";
        productForm.reset();
        document.getElementById("prod-id").value = "";
        modal.style.display = "flex";
    });

    closeModalBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    function openEditModal(id) {
        const product = productsList.find(p => p.id === id);
        if (!product) return;

        isEditMode = true;
        modalTitle.textContent = "Edit Product";
        
        document.getElementById("prod-id").value = product.id;
        document.getElementById("prod-name").value = product.name;
        document.getElementById("prod-category").value = product.category;
        document.getElementById("prod-price").value = product.price;
        document.getElementById("prod-discount").value = product.discount || 0;
        document.getElementById("prod-stock").value = product.stock || 0;
        document.getElementById("prod-rating").value = product.rating || 0;
        
        // Handle image value display (preserve plain strings, stringify objects/arrays)
        let imgVal = product.image;
        if (typeof imgVal === 'object' && imgVal !== null) {
            imgVal = JSON.stringify(imgVal);
        }
        document.getElementById("prod-image").value = imgVal || '';
        
        document.getElementById("prod-desc").value = product.description;

        modal.style.display = "flex";
    }

    // Add or Edit Product Submit
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById("prod-name").value,
            category: document.getElementById("prod-category").value,
            price: parseFloat(document.getElementById("prod-price").value),
            discount: parseFloat(document.getElementById("prod-discount").value),
            stock: parseInt(document.getElementById("prod-stock").value),
            rating: parseFloat(document.getElementById("prod-rating").value),
            image: document.getElementById("prod-image").value,
            description: document.getElementById("prod-desc").value,
            specifications: '{}',
            tags: '[]'
        };

        const id = document.getElementById("prod-id").value;
        const url = isEditMode ? `/api/admin/products/${id}` : '/api/admin/products';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                modal.style.display = "none";
                fetchProducts();
                window.showAlert("Success", "Operation successful!");
            } else {
                window.showAlert("Error", "Failed to save product.");
            }
        } catch (error) {
            console.error(error);
            window.showAlert("Error", "Error saving product.");
        }
    });

    // Delete Product
    async function deleteProduct(id) {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    fetchProducts();
                } else {
                    alert("Failed to delete product.");
                }
            } catch (error) {
                console.error(error);
                alert("Error deleting product.");
            }
        }
    }
});
