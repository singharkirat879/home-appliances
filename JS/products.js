import { injectNavbar } from "./navbar.js";

// Authentication Barrier - Runs immediately
async function requireAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
            // Boot out unauthenticated users
            window.location.href = '/auth.html';
        }
    } catch (err) {
        window.location.href = '/auth.html';
    }
}
requireAuth();

// Inject global navbar and show Search Bar
injectNavbar(true);

let allProds = [];
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        allProds = data;

        displayProducts(allProds);
        addtoCartListener();

    } catch (error) {
        console.log("Error fetching products:", error);
    }
}

const productPage = document.getElementById("Products")
function displayProducts(data) {
    productPage.innerHTML = "";

    console.log(data);

    data.forEach(function (elem) {

        const container = document.createElement("div")
        container.classList.add("prodContainer")
        container.setAttribute("data-category", elem.category?.toLowerCase());
        container.setAttribute("data-id", elem.id)

        const prodImage = document.createElement("img")
        prodImage.setAttribute("src", elem.image)   // ⚠️ also fix this
        prodImage.className = "prodImage"

        const prodName = document.createElement("p")
        prodName.className = "prodName"
        prodName.innerText = (elem.specifications?.brand || "") + ' ' + elem.name

        const prodDesc = document.createElement("p")
        prodDesc.className = "prodDesc"
        prodDesc.innerText = elem.description

        const discountPercentage = Math.round(((elem.discount - elem.price) / elem.price) * 100);

        const priceContainer = document.createElement("div")
        priceContainer.className = "priceContainer"

        const discountTag = document.createElement("span");
        discountTag.className = "discountTag";
        discountTag.innerText = `-${discountPercentage}%`;
        discountTag.style.fontWeight = "bold";

        const discountRate = document.createElement("p")
        discountRate.className = "discountRate"
        discountRate.innerText = "₹" + elem.discount

        const price = document.createElement("span")
        price.className = "prodPrice"
        price.innerText = "₹" + elem.price

        priceContainer.append(price, discountRate, discountTag)

        const rating = document.createElement("p")
        rating.className = "prodRating"
        rating.innerText = "⭐" + elem.rating + "/5"

        const buttonsDiv = document.createElement("div")
        buttonsDiv.className = "buttonsDiv"

        const cartBtn = document.createElement("button")
        cartBtn.className = "card-buy-btn"
        cartBtn.innerText = "Add to Cart"

        const buyNowBtn = document.createElement("button")
        buyNowBtn.className = "card-buy-now-btn"
        buyNowBtn.innerText = "Buy Now"

        container.addEventListener("mouseout", () => {
            prodName.style.color = "black"
            prodName.style.transform = 'scale(1)'
            prodName.style.zIndex = '0'
        })

        container.addEventListener("mouseover", () => {
            prodName.style.color = "#ff5722"
            prodName.style.transform = 'scale(1.05)'
            prodName.style.zIndex = '10'
        })

        const prodTags = document.createElement("p")
        prodTags.innerText = elem.tags
        prodTags.className = "prodTags"


        buttonsDiv.append(cartBtn, buyNowBtn)
        container.append(prodImage, prodName, prodDesc, priceContainer, rating, buttonsDiv, prodTags) // Append grouped container
        productPage.append(container)

        container.onclick = () => {
            // Redirect to product detail page with the product ID
            window.location.href = `product_detail.html?id=${elem.id}`;
        }
    })
}
// Wait for navbar injection before targeting the search bar
setTimeout(() => {
    document.getElementById("formNavbar").addEventListener("keyup", searchProd)
    document.getElementById("formNavbar").addEventListener("submit", searchProd)
}, 100);

function searchProd(e) {
    e.preventDefault();
    const searchedProd = document.getElementById("inputSearchProd").value.toUpperCase();
    const searchedProdName = document.getElementsByClassName("prodName");

    const productPage = document.getElementById("Products")

    const existingMsg = document.getElementById("noProdMsg");
    if (existingMsg) existingMsg.remove();

    let foundAtLeastOne = false;


    for (let i = 0; i < searchedProdName.length; i++) {
        let eachProd = searchedProdName[i];

        let prodContainer = eachProd.closest(".prodContainer");
        if (!prodContainer) continue;

        let eachProdTag = prodContainer.querySelector(".prodTags");

        let tagsText = eachProdTag ? eachProdTag.innerText.toUpperCase() : "";

        let prodNameText = eachProd.innerText.toUpperCase();


        if (prodNameText.includes(searchedProd) || tagsText.includes(searchedProd)) {
            prodContainer.style.display = "";
            foundAtLeastOne = true
        } else {
            prodContainer.style.display = "none";
        }

    }
    if (!foundAtLeastOne) {
        const noProdsFound = document.createElement("h1");
        noProdsFound.innerText = "We looked everywhere, but couldn’t find what you were searching for 😔";
        noProdsFound.id = "noProdMsg";
        noProdsFound.style.textAlign = "center";
        noProdsFound.style.color = "black";
        noProdsFound.style.marginTop = "10%"
        productPage.append(noProdsFound);
    }
}

function categoryFilter(e) {
    const selectedCategory = e.target.dataset.id
    console.log(selectedCategory)
    const prodContainers = document.querySelectorAll(".prodContainer")
    // console.log(prodContainers)

    prodContainers.forEach((product) => {
        let productCategory = product.dataset.category
        // console.log(productCategory)

        if (selectedCategory === "all" || productCategory === selectedCategory) {
            product.style.display = "block"
        }
        else {
            product.style.display = "none"
        }


    })
}

document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", categoryFilter)
})




document.querySelectorAll('input[name="choice"]').forEach(function (radio) {
    radio.addEventListener('change', handleSort)
})

document.getElementById('inStockCheck').addEventListener('change', handleSort)

function handleSort(event) {
    let sortedProds = [...allProds]; // clone

    // Find active radio
    const activeRadio = document.querySelector('input[name="choice"]:checked');
    const sortType = activeRadio ? activeRadio.value : null;

    if (sortType === "lowToHigh") {
        sortedProds.sort((a, b) => a.price - b.price);
    }
    else if (sortType === "highToLow") {
        sortedProds.sort((a, b) => b.price - a.price);
    }
    else if (sortType === "highestRating") {
        sortedProds.sort((a, b) => b.rating - a.rating);
    }

    const inStockOnly = document.getElementById('inStockCheck').checked;
    if (inStockOnly) {
        sortedProds = sortedProds.filter(prod => prod.stock > 0);
    }

    displayProducts(sortedProds);
}

console.log(allProds)
function addtoCartListener() {
    const addtoCartBtns = document.querySelectorAll(".card-buy-btn")

    addtoCartBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation()
            const prodCard = e.target.closest('.prodContainer')
            const prodId = prodCard.dataset.id

            const product = allProds.find(prod => String(prod.id) === String(prodId))
            if (product) addToCart(product, e)
        })
    })

    const buyNowBtns = document.querySelectorAll(".card-buy-now-btn")
    buyNowBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation()
            const prodCard = e.target.closest('.prodContainer')
            const prodId = prodCard.dataset.id
            window.location.href = `checkout.html?buyNow=${prodId}`;
        })
    })
}

async function addToCart(product, e) {
    e.target.innerText = "Adding...";
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id })
        });
        if (response.ok) {
            e.target.innerText = "Added!";
            window.updateGlobalCartBadge(); // Call the global function
            setTimeout(() => e.target.innerText = "Add to Cart", 2000);
        } else {
            alert("Failed to add to cart");
            e.target.innerText = "Add to Cart";
        }
    } catch (err) {
        console.error(err);
        e.target.innerText = "Add to Cart";
    }
}

function clearAllFilters() {
    // 1. Reset text inputs (Search Bar)
    const searchInput = document.getElementById("inputSearchProd");
    if (searchInput) searchInput.value = "";

    // 2. Clear radio buttons (Sort)
    document.querySelectorAll('input[name="choice"]').forEach(radio => radio.checked = false);

    // 3. Uncheck stock checkbox
    const stockCheck = document.getElementById('inStockCheck');
    if (stockCheck) stockCheck.checked = false;

    // 4. Remove 'No Products' message if any
    const existingMsg = document.getElementById("noProdMsg");
    if (existingMsg) existingMsg.remove();

    // 5. Show all products (reset category filter)
    const prodContainers = document.querySelectorAll(".prodContainer");
    prodContainers.forEach(product => product.style.display = "flex");

    // 6. Re-display all products in original state
    displayProducts(allProds);
    addtoCartListener();
    
    console.log("Filters cleared!");
}

// Add event listener for Clear Filters button with safety check
const clearBtn = document.getElementById("clearFiltersBtn");
if (clearBtn) clearBtn.addEventListener("click", clearAllFilters);

fetchProducts();