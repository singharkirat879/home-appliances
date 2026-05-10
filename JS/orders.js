// Authentication Barrier
async function requireAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            window.location.href = '/auth.html'; 
        }
    } catch (err) {
        window.location.href = '/auth.html';
    }
}
requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("orders-container");

    try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
            container.innerHTML = "<p style='text-align:center; color: #ef4444;'>Unable to load orders.</p>";
            return;
        }

        const orders = await res.json();
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Orders Yet!</h3>
                    <p>It looks like you haven't made any purchases.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/products.html'">Start Shopping</button>
                </div>
            `;
            return;
        }

        container.innerHTML = ""; // Clear loader
        
        // Loop through each order and build the receipt
        orders.forEach(order => {
            // Format date nicely
            const dateStr = new Date(order.created_at).toLocaleDateString(undefined, { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
            });
            
            const orderBox = document.createElement("div");
            orderBox.className = "order-box";

            // 1. the Header
            const headerHtml = `
                <div class="order-header">
                    <div class="order-meta">
                        <span class="order-id">Order #${order.order_id}</span>
                        <span class="order-date">${dateStr}</span>
                    </div>
                    <div style="text-align: right;">
                        <div class="order-total">₹${parseFloat(order.total_amount).toFixed(2)}</div>
                        <div class="order-status">${order.status}</div>
                    </div>
                </div>
            `;
            
            // 2. The Items List
            let itemsHtml = '<div class="order-items-list">';
            order.items.forEach(item => {
                let itemImg = item.image;
                try {
                    if (typeof itemImg === "string" && itemImg.startsWith("[")) {
                        const parsed = JSON.parse(itemImg);
                        itemImg = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : itemImg;
                    }
                } catch (e) { }

                itemsHtml += `
                    <div class="line-item">
                        <div class="line-info">
                            <img src="${itemImg || '../images/placeholder.jpg'}" class="line-img" onerror="this.src='../images/placeholder.jpg'">
                            <div>
                                <p class="line-name">${item.name}</p>
                                <p class="line-qty">Qty: ${item.quantity}</p>
                            </div>
                        </div>
                        <div class="line-price">₹${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                `;
            });
            itemsHtml += '</div>';
            
            orderBox.innerHTML = headerHtml + itemsHtml;
            container.appendChild(orderBox);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='text-align:center;'>Network error.</p>";
    }
});
