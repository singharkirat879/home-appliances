// Authentication Barrier
async function requireAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) window.location.href = '/auth.html'; 
    } catch (err) {
        window.location.href = '/auth.html';
    }
}
requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
    const itemsPreview = document.getElementById("order-items-preview");
    const subtotalEl = document.getElementById("subtotal-amount");
    const totalEl = document.getElementById("total-amount");
    const confirmBtn = document.getElementById("confirmPurchaseBtn");
    
    // Check for "Buy Now" mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    const buyNowId = urlParams.get("buyNow");
    

    // Disable button until price loads
    confirmBtn.disabled = true;

    async function loadCheckoutItems() {
        try {
            let products = [];
            let isBuyNow = false;

            if (buyNowId) {
                // Fetch single product for Buy Now
                const res = await fetch(`/api/products/${buyNowId}`);
                if (res.ok) {
                    const product = await res.json();
                    products = [{ ...product, quantity: 1 }];
                    isBuyNow = true;
                } else {
                    console.error("Failed to fetch single product for Buy Now. Status:", res.status);
                    window.location.href = "/products.html";
                    return;
                }
            } else {
                // Normal Cart Checkout
                const res = await fetch("/api/cart");
                if (!res.ok) {
                    console.error("Failed to fetch cart. Status:", res.status);
                    window.location.href = "/products.html";
                    return;
                }
                products = await res.json();
            }

            if (!products || products.length === 0) {
                console.error("Products list is empty, redirecting to products page.");
                window.location.href = "/products.html";
                return;
            }

            itemsPreview.innerHTML = ""; 
            let total = 0;

            products.forEach(item => {
                const itemTotal = parseFloat(item.price) * (item.quantity || 1);
                total += itemTotal;

                let displayImg = item.image || item.images;
                try {
                    if (typeof displayImg === "string" && displayImg.startsWith("[")) {
                        const parsed = JSON.parse(displayImg);
                        displayImg = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : displayImg;
                    } else if (Array.isArray(displayImg) && displayImg.length > 0) {
                        displayImg = displayImg[0];
                    }
                } catch (e) { }

                const row = document.createElement("div");
                row.className = "item-row";
                row.innerHTML = `
                    <div class="item-details">
                        <img src="${displayImg || '../images/placeholder.jpg'}" class="item-img" alt="Product Image" onerror="this.src='../images/placeholder.jpg'">
                        <div>
                            <p class="item-name">${item.name}</p>
                            <p class="item-qty">Qty: ${item.quantity || 1}</p>
                        </div>
                    </div>
                    <div class="item-price">₹${itemTotal.toFixed(2)}</div>
                `;
                itemsPreview.appendChild(row);
            });

            subtotalEl.innerText = `₹${total.toFixed(2)}`;
            totalEl.innerText = `₹${total.toFixed(2)}`;
            confirmBtn.disabled = false;

            return isBuyNow;
        } catch (err) {
            console.error("Critical error during checkout loading:", err);
            itemsPreview.innerHTML = "<p>Error loading checkout preview. Please check console.</p>";
        }
    }

    const isBuyNowMode = await loadCheckoutItems();

    // Restrict phone input to numbers only and max 10 digits
    const phoneInput = document.getElementById("phone-number");
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });
    }

    // Handle Confirm Order
    confirmBtn.addEventListener("click", async () => {
        const address = document.getElementById("shipping-address").value.trim();
        const phone = document.getElementById("phone-number").value.trim();

        if (!address || !phone) {
            window.showAlert("Missing Info", "Please fill in both your shipping address and phone number.");
            return;
        }

        // Enforce exactly 10 digits
        if (phone.length !== 10) {
            window.showAlert("Invalid Phone", "Please enter a valid 10-digit phone number.");
            return;
        }

        confirmBtn.innerText = "Processing...";
        confirmBtn.disabled = true;

        const endpoint = isBuyNowMode ? "/api/orders/buy-now" : "/api/orders/checkout";
        const postData = isBuyNowMode ? { productId: buyNowId, address, phone } : { address, phone };


        try {
            const checkoutRes = await fetch(endpoint, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: isBuyNowMode ? JSON.stringify(postData) : null
            });
            
            if (checkoutRes.ok) {
                document.getElementById("success-overlay").classList.remove("hidden");
                setTimeout(() => {
                    window.location.href = "/products.html"
                }, 2500)
            } else {
                const data = await checkoutRes.json();
                console.error("Order failed:", data);
                window.showAlert("Order Failed", data.error || "Failed to process order!");
                confirmBtn.innerText = "Confirm Purchase";
                confirmBtn.disabled = false;
            }
        } catch (err) {
            console.error("Network error during order confirmation:", err);
            window.showAlert("Error", "Network error.");
            confirmBtn.innerText = "Confirm Purchase";
            confirmBtn.disabled = false;
        }
    });

});
