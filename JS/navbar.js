import { createIcons, icons } from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

const navbarHTML = `
    <link rel="stylesheet" href="../CSS/navbar.css">
    <section class="navbar-section">
        <header class="navbar-header glassmorphism-nav">
            <nav class="navbar-Nav">
                <div class="navbar-container">
                    <div id="logo-div">
                        <a href="/products.html">
                            <img id="logo-Img" src="../images/logo-no-background.png" alt="Logo" style="height: 45px; object-fit: contain;">
                        </a>
                    </div>
                    <div id="search-Div" style="display: none;">
                        <form action="" id="formNavbar">
                            <input type="search" placeholder="Search appliances..." id="inputSearchProd">
                        </form>
                    </div>
                    <div id="user-credits">
                        <div id="user-profile" class="nav-icon" title="Profile" style="display:flex; align-items:center; gap: 5px; font-weight: 600; font-size: 14px;"> 
                            <i data-lucide="user"></i> <span id="username-display"></span> 
                        </div>
                        <i id="orders-Icon" data-lucide="package" class="nav-icon" title="My Orders"></i>
                        <div class="cart-wrapper" style="position: relative;">
                            <i id="cart-Icon" data-lucide="shopping-cart" class="nav-icon" title="Cart"></i>
                            <span id="cart-count">0</span>
                        </div>
                        <i id="logout-Icon" data-lucide="log-out" class="nav-icon" title="Logout"></i>
                    </div>
                </div>
            </nav>
        </header>
    </section>
`;

export function injectNavbar(showSearch = false) {
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    createIcons({icons});

    if(showSearch) {
        document.getElementById("search-Div").style.display = "flex";
    }

    document.getElementById("orders-Icon").onclick = () => window.location.href = "/orders.html";
    document.getElementById("cart-Icon").onclick = () => window.location.href = "/addToCart.html";
    
    document.getElementById("logout-Icon").onclick = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = "/";
        } catch(e) {
            console.error("Logout failed", e);
        }
    };
    
    updateGlobalCartBadge();
    fetchUserProfile();
}

async function fetchUserProfile() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            const data = await response.json();
            document.getElementById("username-display").innerText = "Hi, " + data.user.name;
        }
    } catch(err) {
        console.error("Failed to fetch user");
    }
}

async function updateGlobalCartBadge() {
    const badge = document.getElementById("cart-count");
    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            const cart = await response.json();
            if(cart.length > 0){
                badge.style.display = "flex";
                badge.innerText = cart.reduce((total, item) => total + item.quantity, 0);
            } else {
                badge.style.display = "none";
            }
        }
    } catch {}
}

window.updateGlobalCartBadge = updateGlobalCartBadge;
