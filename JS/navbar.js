import { createIcons, icons } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

const navbarHTML = `
    <link rel="stylesheet" href="../CSS/navbar.css?v=1.1">
    <section class="navbar-section">
        <header class="navbar-header glassmorphism-nav">
            <nav class="navbar-Nav">
                <div class="navbar-container">
                    <div id="logo-div">
                        <a href="/">
                            <img id="logo-Img" src="../images/logo-no-background.png" alt="Logo" style="height: 45px; object-fit: contain;">
                        </a>
                    </div>
                    <div id="search-Div" style="display: none;">
                        <form action="" id="formNavbar">
                            <input type="search" placeholder="Search appliances..." id="inputSearchProd">
                        </form>
                    </div>
                    <div id="user-credits">
                        <div id="user-profile" class="nav-icon" data-tooltip="Profile" style="display:flex; align-items:center; gap: 5px; font-weight: 600; font-size: 14px;"> 
                            <i data-lucide="user"></i> <span id="username-display"></span> 
                        </div>
                        <i id="orders-Icon" data-lucide="package" class="nav-icon" data-tooltip="View Orders"></i>
                        <div class="cart-wrapper" style="position: relative;">
                            <i id="cart-Icon" data-lucide="shopping-cart" class="nav-icon" data-tooltip="Cart"></i>
                            <span id="cart-count">0</span>
                        </div>
                        <i id="logout-Icon" data-lucide="log-out" class="nav-icon" data-tooltip="Logout" style="display: none;"></i>
                    </div>
                </div>
            </nav>
        </header>
    </section>
    
    <!-- Custom Modal Structure -->
    <div id="custom-modal" class="modal-overlay hidden">
        <div class="modal-content glass-card">
            <h3 id="modal-title">Notification</h3>
            <p id="modal-message"></p>
            <button id="modal-close-btn" class="cta-btn glowing">OK</button>
        </div>
    </div>
`;

export function injectNavbar(showSearch = false, showCart = true) {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    createIcons({ icons });

    const logoLink = document.querySelector("#logo-div a");
    if (logoLink) {
        logoLink.href = '/';
    }

    if (showSearch) {
        document.getElementById("search-Div").style.display = "flex";
    }

    if (!showCart) {
        const cartWrapper = document.querySelector(".cart-wrapper");
        if (cartWrapper) cartWrapper.style.display = "none";
        const ordersIcon = document.getElementById("orders-Icon");
        if (ordersIcon) ordersIcon.style.display = "none";
    }


    // Custom Tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "nav-tooltip";
    document.body.appendChild(tooltip);

    const userCredits = document.getElementById("user-credits");
    if (userCredits) {
        userCredits.addEventListener("mouseover", (e) => {
            const el = e.target.closest('[data-tooltip]');
            if (el) {
                tooltip.textContent = el.getAttribute("data-tooltip");
                tooltip.classList.add("show");
                const rect = el.getBoundingClientRect();
                tooltip.style.top = (rect.bottom + 10) + "px";
                tooltip.style.left = (rect.left + rect.width / 2) + "px";
            }
        });

        userCredits.addEventListener("mouseout", (e) => {
            const el = e.target.closest('[data-tooltip]');
            if (el) {
                tooltip.classList.remove("show");
            }
        });

        userCredits.addEventListener("click", async (e) => {
            const icon = e.target.closest('.nav-icon');
            if (!icon) return;

            if (icon.id === "orders-Icon") window.location.href = "/orders.html";
            else if (icon.id === "cart-Icon" || icon.closest('.cart-wrapper')) window.location.href = "/addToCart.html";
            else if (icon.id === "logout-Icon") {
                try {
                    const res = await fetch('/api/auth/logout', { method: 'POST' });
                    if (res.ok) {
                        window.showAlert("Success", "Logged out successfully!", () => {
                            window.location.href = "/";
                        });
                    }
                } catch (err) {
                    console.error("Logout failed", err);
                }
            }
        });
    }

    updateGlobalCartBadge();
    fetchUserProfile();
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            document.getElementById("username-display").innerText = "Hi, " + data.user.name;
            document.getElementById("logout-Icon").style.display = "inline-block";
            // If they click profile when logged in, maybe nothing or go to profile page.
        } else {
            document.getElementById("username-display").innerText = "Login";
            document.getElementById("user-profile").style.cursor = "pointer";
            document.getElementById("user-profile").onclick = () => window.location.href = "/auth.html";
        }
    } catch (err) {
        console.error("Failed to fetch user");
        document.getElementById("username-display").innerText = "Login";
        document.getElementById("user-profile").style.cursor = "pointer";
        document.getElementById("user-profile").onclick = () => window.location.href = "/auth.html";
    }
}

async function updateGlobalCartBadge() {
    const badge = document.getElementById("cart-count");
    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            const cart = await response.json();
            if (cart.length > 0) {
                badge.style.display = "flex";
                badge.innerText = cart.reduce((total, item) => total + item.quantity, 0);
            } else {
                badge.style.display = "none";
            }
        }
    } catch { }
}

window.updateGlobalCartBadge = updateGlobalCartBadge;

// Global Alert Replacement
window.showAlert = function (title, message, callback) {
    const modal = document.getElementById("custom-modal");
    const titleEl = document.getElementById("modal-title");
    const messageEl = document.getElementById("modal-message");
    const closeBtn = document.getElementById("modal-close-btn");

    if (!modal) {
        alert(message); // Fallback
        if (callback) callback();
        return;
    }

    titleEl.innerText = title;
    messageEl.innerText = message;
    modal.classList.remove("hidden");

    const closeHandler = () => {
        modal.classList.add("hidden");
        closeBtn.removeEventListener("click", closeHandler);
        if (callback) callback();
    };

    closeBtn.addEventListener("click", closeHandler);
};
