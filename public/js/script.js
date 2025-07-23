document.addEventListener("DOMContentLoaded", function() {
    // Mobile Menu Toggle
    const mobileMenu = document.getElementById("mobile-menu");
    const navLinks = document.getElementById("nav-links");

    mobileMenu.addEventListener("click", function() {
        this.classList.toggle("active");
        navLinks.classList.toggle("active");
    });

    // Initialize cart count
    updateCartCount();

    // Search Toggle
    const searchLink = document.querySelector(".search-link");
    if (searchLink) {
        searchLink.addEventListener("click", function(e) {
            e.preventDefault();
            toggleSearch();
        });
    }

    // Background Image Controls
    const backgroundImg = document.getElementById('background-image');
    if (backgroundImg) {
        let isBlurred = false;
        let currentImageIndex = 0;
        const backgroundImages = [
            'images/hero-bg.jpg',
            'images/hero-bg2.jpg',
            'images/hero-bg3.jpg'
        ];
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Back to Top Button
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        });
    }

    // Initialize products and filters
    loadProducts();
    setupFilters();
});

// Global functions
function toggleSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.classList.toggle("show");
        if (searchInput.classList.contains("show")) {
            searchInput.focus();
        }
    }
}

function addToCart(productCard) {
    const productId = productCard.dataset.productId;
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    const product = {
        id: productId,
        title: productCard.querySelector(".product-title").textContent,
        price: productCard.querySelector(".product-price").textContent,
        image: productCard.querySelector(".product-image").src,
        quantity: 1
    };

    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    // Return the button for visual feedback
    return productCard.querySelector(".add-to-cart");
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const cartLink = document.getElementById("cart-link");
    if (cartLink) {
        cartLink.innerHTML = `<i class="fas fa-shopping-cart"></i> Cart (${cartCount})`;
    }
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const category = button.dataset.category;
            filterProducts(category);
        });
    });
}

function filterProducts(category) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const cardCategory = card.dataset.category || 'all';
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 50);
        } else {
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
        productGrid.innerHTML = ''; // Clear existing products
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-products">No products available at the moment.</p>';
            return;
        }
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
            productCard.dataset.category = product.category || 'all';
            
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.title}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-footer">
                        <span class="product-price">${product.price}Tk</span>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(productCard);
        });
        
        // Attach event listeners to new add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const addToCartBtn = addToCart(productCard);
                
                // Visual feedback
                const originalText = addToCartBtn.textContent;
                addToCartBtn.textContent = "Added!";
                addToCartBtn.style.backgroundColor = "#4CAF50";
                
                setTimeout(() => {
                    addToCartBtn.textContent = originalText;
                    addToCartBtn.style.backgroundColor = "";
                }, 1000);
            });
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            productGrid.innerHTML = '<p class="error-message">Error loading products. Please try again later.</p>';
        }
    }
}