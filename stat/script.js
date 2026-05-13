const products = [
    { name: "Cup1", price: 30, image: "stat/images/cup1.png" },
    { name: "Cup2", price: 36, image: "stat/images/cup2.png" },
    { name: "Cup3", price: 40, image: "stat/images/cup3.png" },
    { name: "Cup4", price: 28, image: "stat/images/cup4.png" }
];

function displayProducts(productList){
    const container = document.getElementById("productsContainer");
    container.innerHTML = "";
    productList.forEach(p => {
        container.innerHTML += `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>Price: ${p.price} SAR</p>
            <button onclick="openProduct('${p.name}', ${p.price}, '${p.image}')">Add to Cart</button>
        </div>`;
    });
}

displayProducts(products);

// ===== SEARCH =====
const searchInput = document.getElementById('searchBar');
const searchButton = document.getElementById('searchBtn');

searchButton.addEventListener('click', () => {
    const term = searchInput.value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(product => {
        const name = product.querySelector('h3').textContent.toLowerCase();
        if (name.includes(term)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
});

// ===== COMMENTS =====
async function loadComments() {
    try {
        const res = await fetch("/comments");
        const data = await res.json();
        const list = document.getElementById("commentList");
        list.innerHTML = "";
        data.forEach(c => list.innerHTML += `<p>${c.comment}</p>`);
    } catch(e) {
        console.error("Error loading comments:", e);
    }
}

window.addEventListener("load", loadComments);

document.getElementById("submitComment").addEventListener("click", async () => {
    const input = document.getElementById("commentInput");
    const value = input.value.trim();
    if(value === "") return;

    // 🔐 فحص XSS
    if(detectXSS(value)){
        alert("⚠️ Suspicious input detected!");

        // إرسال الهجوم للسيرفر للتسجيل
        await fetch("/attack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: value, type: "comment" })
        });

        return; // منع الإرسال الطبيعي
    }

    input.value = "";    
    document.getElementById("commentList").innerHTML += `<p>${value}</p>`;

    await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: value })
    });
});

// ===== PRODUCT MODAL =====
function openProduct(name, price, image){
    document.getElementById("productModal").style.display = "block";
    document.getElementById("modalTitle").innerText = name;
    document.getElementById("modalPrice").innerText = "Price: " + price + " SAR";
    document.getElementById("modalImg").src = image;
}

document.querySelector(".close").onclick = function(){
    document.getElementById("productModal").style.display = "none";
}

// ===== CUSTOMIZATION =====
async function sendCustomization(){
    const text = document.getElementById("customText").value;

    if(text.trim() === ""){
        alert("Please enter customization");
        return;
    }

    // 🔐 فحص XSS
    if(detectXSS(text)){
        alert("⚠️ Suspicious input detected!");

        await fetch("/attack", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ input: text, type: "customization" })
        });

        return;
    }

    await fetch("/customization", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ customization: text })
    });

    alert("Customization sent!");

    document.getElementById("customText").value = "";
    document.getElementById("productModal").style.display = "none";
}

// ===== XSS DETECTION =====
function detectXSS(input){
    const patterns = [
        "<script>",
        "</script>",
        "javascript:",
        "onerror=",
        "onload=",
        "alert(",
        "<img",
        "<iframe"
    ];

    for(let pattern of patterns){
        if(input.toLowerCase().includes(pattern)){
            return true;
        }
    }

    return false;
}