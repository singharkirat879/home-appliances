document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("product-detail-container");
    
    // 1. Extract Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        window.location.href = "/products.html";
        return;
    }

    try {
        // 2. Fetch Product Data
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error("Product not found");
        const product = await response.json();

        // 3. Render Product Info
        renderProduct(product);

    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>Oops! Product not found.</h3>
                <p>We couldn't find the appliance you were looking for.</p>
                <a href="/products.html" class="btn btn-primary mt-3">Back to Products</a>
            </div>
        `;
    }
});

function renderProduct(product) {
    const container = document.getElementById("product-detail-container");
    
    // Logic for discount percentage
    const discountPrice = product.discount || product.price;
    const currentPrice = product.price;
    const discountPercentage = Math.round(((discountPrice - currentPrice) / discountPrice) * 100);

    // Parse specifications
    let specificationsHTML = "";
    if (product.specifications) {
        const specs = typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications;
        for (const [key, value] of Object.entries(specs)) {
            specificationsHTML += `
                <tr>
                    <td class="specs-key">${key}</td>
                    <td>${value}</td>
                </tr>
            `;
        }
    }

    container.innerHTML = `
        <div class="col-md-6 detail-img-container">
            <img src="${product.image || product.images}" class="detail-img" alt="${product.name}">
        </div>
        <div class="col-md-6 product-info-section">
            <p class="product-brand">${product.specifications?.brand || "Premium Appliance"}</p>
            <h1 class="product-title">${product.name}</h1>
            
            <div class="price-box">
                <span class="current-price">₹${parseFloat(product.price).toFixed(2)}</span>
                ${product.discount > product.price ? `
                    <span class="original-price">₹${parseFloat(product.discount).toFixed(2)}</span>
                    <span class="discount-badge">${discountPercentage}% OFF</span>
                ` : ""}
            </div>

            <p class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                ${product.stock > 0 ? `● In Stock (${product.stock} units left)` : '● Out of Stock'}
            </p>

            <div class="description-section">
                <p class="section-title">Description</p>
                <p class="text-muted">${product.description}</p>
            </div>

            ${specificationsHTML ? `
                <div class="specs-section mt-4">
                    <p class="section-title">Specifications</p>
                    <table class="specs-table">
                        <tbody>${specificationsHTML}</tbody>
                    </table>
                </div>
            ` : ""}

            <div class="action-buttons">
                <button id="detail-add-cart" class="btn-add-cart">Add to Cart</button>
                <button id="detail-buy-now" class="btn-buy-now">Buy Now</button>
            </div>
        </div>
    `;

    // 4. Attach Action Listeners
    document.getElementById("detail-add-cart").addEventListener("click", () => handleAddToCart(product));
    document.getElementById("detail-buy-now").addEventListener("click", () => {
        window.location.href = `checkout.html?buyNow=${product.id}`;
    });
}

async function handleAddToCart(product) {
    const btn = document.getElementById("detail-add-cart");
    btn.innerText = "Adding...";
    btn.disabled = true;

    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id })
        });
        
        if (response.ok) {
            btn.innerText = "Added to Cart!";
            if(window.updateGlobalCartBadge) window.updateGlobalCartBadge();
            setTimeout(() => {
                btn.innerText = "Add to Cart";
                btn.disabled = false;
            }, 2000);
        } else {
            alert("Failed to add to cart. Please log in.");
            btn.innerText = "Add to Cart";
            btn.disabled = false;
        }
    } catch(err) {
        console.error(err);
        btn.innerText = "Add to Cart";
        btn.disabled = false;
    }
}
