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
    
    // Disable button until price loads
    confirmBtn.disabled = true;

    try {
        const res = await fetch("/api/cart");
        if (!res.ok) {
            window.location.href = "/products";
            return;
        }

        const cartProducts = await res.json();
        if (cartProducts.length === 0) {
            window.location.href = "/products"; // No preview if empty
            return;
        }

        itemsPreview.innerHTML = ""; // Clear loader
        let total = 0;

        cartProducts.forEach(item => {
            const itemTotal = parseFloat(item.price) * item.quantity;
            total += itemTotal;

            const row = document.createElement("div");
            row.className = "item-row";
            
            row.innerHTML = `
                <div class="item-details">
                    <img src="${item.image}" class="item-img" alt="Product Image">
                    <div>
                        <p class="item-name">${item.name}</p>
                        <p class="item-qty">Qty: ${item.quantity}</p>
                    </div>
                </div>
                <div class="item-price">₹${itemTotal.toFixed(2)}</div>
            `;
            
            itemsPreview.appendChild(row);
        });

        // Update Summary
        subtotalEl.innerText = `₹${total.toFixed(2)}`;
        totalEl.innerText = `₹${total.toFixed(2)}`;
        confirmBtn.disabled = false; // Re-enable

    } catch (err) {
        itemsPreview.innerHTML = "<p>Error loading cart preview.</p>";
    }

    // Handle Confirm Order
    confirmBtn.addEventListener("click", async () => {
        confirmBtn.innerText = "Processing...";
        confirmBtn.disabled = true;

        try {
            const checkoutRes = await fetch("/api/orders/checkout", {
                method: "POST"
            });
            
            if (checkoutRes.ok) {
                // Show success overlay modal
                document.getElementById("success-overlay").classList.remove("hidden");
                // Wait 2.5 seconds then throw them back to products to shop anew!
                setTimeout(() => {
                    window.location.href = "/products"
                }, 2500)
            } else {
                const data = await checkoutRes.json();
                alert(data.error || "Failed to process order!");
                confirmBtn.innerText = "Confirm Purchase";
                confirmBtn.disabled = false;
            }
        } catch (err) {
            alert("Network error.");
            confirmBtn.innerText = "Confirm Purchase";
            confirmBtn.disabled = false;
        }
    });

});
