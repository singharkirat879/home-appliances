import { createIcons, icons} from "https://cdn.jsdelivr.net/npm/lucide@latest/+esm";

    // Set up icons in your navbar
    document.getElementById("user-credits").innerHTML = `
        <i id="cart-Icon" data-lucide="shopping-cart"></i>
         <span id="cart-count" 
          style="position: absolute; top: 8px; right:107px; background: black; color: white; font-size: 12px; padding: 1px 5px; border-radius: 50%; display: none;">
        0</span>
        <i data-lucide="log-out"></i>
    `;

    createIcons({icons}); 

let allProds = [];
let cartLogo = document.getElementById("cart-Icon")
cartLogo.onclick = () => {
    window.location.href = "addToCart.html"
}

async function fetchProducts() {
    try{
    const products = await fetch('../products.json')
    const res = await products.json()
    allProds = res.categories
    console.log(allProds)
    displayProducts(res.categories)
    addtoCartListener()
}

catch(error){
    console.log(error, 'Error');
}
}


const productPage = document.getElementById("Products")


function displayProducts(categories){
    productPage.innerHTML = "";

    
    for(let i = 0 ; i<categories.length; i++){
        
    categories[i].products.forEach(function(elem){ 
            
    const container = document.createElement("div")
    container.classList.add("prodContainer")
    container.setAttribute("data-category", categories[i].id.toLowerCase());
    container.setAttribute("data-id", elem.id)
    console.log(elem.id)
            
    
    const prodImage  = document.createElement("img")
    prodImage.setAttribute("src", elem.images)
    prodImage.className = "prodImage"

    const prodName = document.createElement("p")
    prodName.className = "prodName"
    prodName.innerText = elem.specifications.brand + '  ' + elem.name
    
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

    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const isinCart = cart.find(p => p.id === elem.id)

    if(isinCart){
        cartBtn.innerText = "Remove from Cart"
    }

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


    buttonsDiv.append(cartBtn)
    container.append(prodImage, prodName,prodDesc ,priceContainer, rating, buttonsDiv, prodTags) // Append grouped container
    productPage.append(container)

    container.onclick = () => {
        localStorage.setItem("product", JSON.stringify(elem))
        window.location.href="google.com"
    }
})
}
updateCartBadge()
}
document.getElementById("formNavbar").addEventListener("keyup", searchProd)
document.getElementById("formNavbar").addEventListener("submit", searchProd)

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

function categoryFilter(e){
    const selectedCategory = e.target.dataset.id
    console.log(selectedCategory)
    const prodContainers = document.querySelectorAll(".prodContainer")
        // console.log(prodContainers)
            
        prodContainers.forEach((product)=>{
            let productCategory = product.dataset.category
            // console.log(productCategory)

            if(selectedCategory==="all" || productCategory === selectedCategory){
                product.style.display = "block"
            }
            else{
                product.style.display = "none"
            }


        })
}

document.querySelectorAll("button").forEach((btn)=>{
    btn.addEventListener("click", categoryFilter)
})




document.querySelectorAll('input[name="choice"]').forEach(function(radio){
    radio.addEventListener('change', handlePriceSort)
})

function handlePriceSort(event) {
    const sortType = event.target.value;
    const prodCat = [...allProds]; // clone
    console.log(prodCat)
  
    for (let i = 0; i < prodCat.length; i++) {
        if (sortType === "lowToHigh") {
        prodCat[i].products.sort((a, b) => a.price - b.price);
      } 
      
      else if (sortType === "highToLow") {
        prodCat[i].products.sort((a, b) => b.price - a.price);
    }
    const prices = prodCat[i].products.map(prod => prod.price);
    console.log(`Category: ${prodCat[i].name}`, prices);
}

    displayProducts(prodCat);
}

console.log(allProds)
function addtoCartListener() {
    const addtoCartBtns = document.querySelectorAll(".card-buy-btn")
    
    addtoCartBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation()
            const prodCard = e.target.closest('.prodContainer')
            const prodId = prodCard.dataset.id
            const catId = prodCard.dataset.category
            
            const category = allProds.find(cat => cat.id === catId)
            const product = category.products.find(prod => prod.id === prodId)
            addToCart(product, e)
        })
    })
  }
  
  function addToCart(product, e) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
  
    const alreadyInCart = cart.find(p => p.id === product.id);
  
    if (alreadyInCart) {
      cart = cart.filter(p => p.id !== product.id);
      e.target.innerText = "Add to Cart";
      alert(`${product.name} removed from cart!`);
    }
     else {
      cart.push(product);
      alert(`${product.name} added to cart!`);
      e.target.innerText = "Remove from Cart";
    }
  
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
  }
  

function updateCartBadge(){
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const badge = document.getElementById("cart-count")

    if(cart.length > 0){
        badge.style.display = "block"
        badge.innerText = cart.length
    }
    else{
        badge.style.display = "none"
    }

}

fetchProducts();