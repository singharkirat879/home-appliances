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
    
    console.log("Checkout initial load - BuyNowId:", buyNowId);

    // Disable button until price loads
    confirmBtn.disabled = true;

    async function loadCheckoutItems() {
        try {
            let products = [];
            let isBuyNow = false;

            if (buyNowId) {
                console.log("Entering Buy Now Mode for ID:", buyNowId);
                // Fetch single product for Buy Now
                const res = await fetch(`/api/products/${buyNowId}`);
                if (res.ok) {
                    const product = await res.json();
                    console.log("Fetched single product details:", product);
                    products = [{ ...product, quantity: 1 }];
                    isBuyNow = true;
                } else {
                    console.error("Failed to fetch single product for Buy Now. Status:", res.status);
                    window.location.href = "/products.html";
                    return;
                }
            } else {
                console.log("Entering normal Cart Mode");
                // Normal Cart Checkout
                const res = await fetch("/api/cart");
                if (!res.ok) {
                    console.error("Failed to fetch cart. Status:", res.status);
                    window.location.href = "/products.html";
                    return;
                }
                products = await res.json();
                console.log("Fetched cart products:", products.length);
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

                const row = document.createElement("div");
                row.className = "item-row";
                row.innerHTML = `
                    <div class="item-details">
                        <img src="${item.image || item.images}" class="item-img" alt="Product Image">
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

    // Handle Confirm Order
    confirmBtn.addEventListener("click", async () => {
        confirmBtn.innerText = "Processing...";
        confirmBtn.disabled = true;

        const endpoint = isBuyNowMode ? "/api/orders/buy-now" : "/api/orders/checkout";
        const postData = isBuyNowMode ? { productId: buyNowId } : {};

        console.log("Confirming order. Endpoint:", endpoint, "Mode:", isBuyNowMode ? "BuyNow" : "Cart");

        try {
            const checkoutRes = await fetch(endpoint, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: isBuyNowMode ? JSON.stringify(postData) : null
            });
            
            if (checkoutRes.ok) {
                console.log("Order success!");
                document.getElementById("success-overlay").classList.remove("hidden");
                setTimeout(() => {
                    window.location.href = "/products.html"
                }, 2500)
            } else {
                const data = await checkoutRes.json();
                console.error("Order failed:", data);
                alert(data.error || "Failed to process order!");
                confirmBtn.innerText = "Confirm Purchase";
                confirmBtn.disabled = false;
            }
        } catch (err) {
            console.error("Network error during order confirmation:", err);
            alert("Network error.");
            confirmBtn.innerText = "Confirm Purchase";
            confirmBtn.disabled = false;
        }
    });

});
