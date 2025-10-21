/* main.js
   Handles:
   - Rendering products (shop, featured)
   - Cart (localStorage)
   - Auth (localStorage)
   - Admin demo (hardcoded password)
   - Product detail rendering
   - Checkout flow (demo)
*/

/* ---------- Utilities ---------- */
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const formatUSD = v => '$' + v.toFixed(2);
const uuid = () => 'xxxx-xxxx-xxxx'.replace(/[x]/g, ()=> (Math.random()*16|0).toString(16));

/* Persisted keys */
const CART_KEY = 'ut_cart_v1';
const USERS_KEY = 'ut_users_v1';
const ORDERS_KEY = 'ut_orders_v1';
const PRODUCTS_KEY = 'ut_products_v1'; // used by admin to save edits

/* Init products into localStorage if not present (simulate backend) */
function initProducts(){
  if(!localStorage.getItem(PRODUCTS_KEY)){
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(PRODUCTS));
  }
}
initProducts();

function getProducts(){
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
}

/* Cart operations */
function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }
function addToCart(productId, qty=1, size=null, color=null){
  const cart = getCart();
  const existing = cart.find(i => i.productId===productId && i.size===size && i.color===color);
  if(existing){ existing.qty += qty; } else {
    cart.push({ productId, qty, size, color, addedAt: Date.now() });
  }
  saveCart(cart);
  showSuccess("Added to cart");
}
function removeFromCart(index){
  const cart = getCart(); cart.splice(index,1); saveCart(cart);
}
function updateQtyInCart(index, qty){
  const cart = getCart(); if(cart[index]) cart[index].qty = Math.max(1, qty); saveCart(cart);
}

/* Auth (very simple demo) */
function getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUser(user){
  const users = getUsers(); users.push(user); localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function findUserByEmail(email){ return getUsers().find(u=>u.email===email); }
function loginUser(email,password){
  const u = findUserByEmail(email);
  if(u && u.password === password){ localStorage.setItem('ut_session', JSON.stringify({ email })); showSuccess('Logged in'); return true; }
  return false;
}
function logoutUser(){ localStorage.removeItem('ut_session'); showSuccess('Logged out'); }

/* Orders */
function getOrders(){ return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
function saveOrder(order){ const o = getOrders(); o.push(order); localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }

/* ---------- Common UI ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Fill current year
  qsa('#curYear,#curYear2,#curYear3,#curYear4,#curYear5,#curYear6,#curYear7,#curYear8').forEach(el => { if(el) el.textContent = new Date().getFullYear(); });

  // Wire up dark mode toggle
  const darkToggle = qs('#darkToggle');
  const currentTheme = localStorage.getItem('ut_theme') || 'light';
  applyTheme(currentTheme);
  if(darkToggle){ darkToggle.checked = (currentTheme==='dark'); darkToggle.addEventListener('change', (e)=> applyTheme(e.target.checked ? 'dark' : 'light')); }

  // Shared auth modal buttons
  const loginBtn = qs('#loginBtn'); if(loginBtn) loginBtn.addEventListener('click', ()=> showAuthModal());
  qs('#showRegister')?.addEventListener('click',(e)=>{ e.preventDefault(); toggleAuthForms('register'); });
  qs('#showLogin')?.addEventListener('click',(e)=>{ e.preventDefault(); toggleAuthForms('login'); });

  // Newsletter forms (demo)
  qsa('#newsletterForm,#footerNewsletter').forEach(f => {
    if(!f) return;
    f.addEventListener('submit', (ev)=>{ ev.preventDefault(); showSuccess('Thanks for subscribing!'); f.reset(); });
  });

  // Login/Register handling
  qs('#loginForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = qs('#loginEmail').value.trim(), password = qs('#loginPassword').value;
    if(loginUser(email,password)) { qs('#authModal') && bootstrap.Modal.getInstance(qs('#authModal'))?.hide(); } else showAuthMessage('Invalid credentials', true);
  });
  qs('#registerForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = qs('#regName').value.trim(), email = qs('#regEmail').value.trim(), password = qs('#regPassword').value;
    if(findUserByEmail(email)){ showAuthMessage('Email already registered', true); return; }
    saveUser({ name, email, password, createdAt: Date.now() });
    showAuthMessage('Account created. You can log in now.');
    toggleAuthForms('login');
  });

  // Render featured
  renderFeatured();

  // Route based rendering
  const page = document.body.dataset.page;
  if(page === 'shop') { setupShop(); }
  if(page === 'product') { renderProductPage(); }
  if(page === 'cart') { renderCartPage(); }
  if(page === 'checkout') { setupCheckout(); }
  if(page === 'account') { renderAccount(); }
  if(page === 'admin') { renderAdmin(); }

  // Apply stored cart badge
  updateCartBadge();
});

/* Theme */
function applyTheme(theme){
  document.body.classList.toggle('dark-mode', theme==='dark');
  document.body.classList.toggle('light-mode', theme!=='dark');
  localStorage.setItem('ut_theme', theme);
}

/* Auth modal helpers */
function showAuthModal(){ 
  // clone modal into DOM (index.html already includes it); show via bootstrap
  const modalEl = qs('#authModal');
  if(modalEl){
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  } else {
    // fallback: open a simple prompt (very rare)
    alert('Login/Register modal is not loaded on this page.');
  }
}
function toggleAuthForms(which){
  if(which==='register'){ qs('#registerForm').classList.remove('d-none'); qs('#loginForm').classList.add('d-none'); }
  else { qs('#registerForm').classList.add('d-none'); qs('#loginForm').classList.remove('d-none'); }
}
function showAuthMessage(msg, isError=false){
  const el = qs('#authMsg');
  if(el){ el.textContent = msg; el.style.color = isError ? 'crimson' : 'green'; }
}

/* Show success utility */
function showSuccess(msg){
  const el = qs('#successModal');
  if(el){
    qs('#successTitle').textContent = 'Success';
    qs('#successMsg').textContent = msg;
    bootstrap.Modal.getOrCreateInstance(el).show();
  } else {
    alert(msg);
  }
}

/* Cart badge */
function updateCartBadge(){
  const cart = getCart();
  qsa('#cart-badge').forEach(b => { if(b) b.textContent = cart.reduce((s,i)=>s+i.qty,0); });
}

/* ---------- Featured products (home) ---------- */
function renderFeatured(){
  const container = qs('#featuredGrid');
  if(!container) return;
  const prods = getProducts().filter(p=>p.bestseller).slice(0,6);
  container.innerHTML = prods.map(p => `
    <div class="col-6 col-md-3">
      <div class="card product-card h-100">
        <img loading="lazy" src="${p.image}" alt="${p.name}" class="card-img-top">
        <div class="card-body">
          <h6 class="card-title">${p.name}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <strong>${formatUSD(p.price)}</strong>
            <button class="btn btn-sm btn-outline-primary" onclick="location.href='product.html?id=${p.id}'">View</button>
          </div>
          <button class="btn btn-sm btn-accent w-100 mt-2" onclick="addToCart(${p.id},1,null,null)">Add to Cart</button>
        </div>
      </div>
    </div>`).join('');
}

/* ---------- Shop ---------- */
function setupShop(){
  const products = getProducts();
  const perPage = 10;
  let state = {
    page: 1, q:'', priceMin:20, priceMax:60, size:'', colors:[], category:'', sort:'new'
  };

  const grid = qs('#productsGrid'), resultsCount = qs('#resultsCount'), pagination = qs('#pagination');
  const render = ()=>{
    let list = products.slice();
    // filters
    if(state.q) list = list.filter(p => p.name.toLowerCase().includes(state.q) || p.description.toLowerCase().includes(state.q));
    list = list.filter(p => p.price >= (state.priceMin || 0) && p.price <= (state.priceMax || Infinity));
    if(state.size) list = list.filter(p => p.sizes.includes(state.size));
    if(state.colors.length) list = list.filter(p => state.colors.some(c => p.colors.includes(c)));
    if(state.category) list = list.filter(p => p.category === state.category);
    // sort
    if(state.sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
    else if(state.sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
    else if(state.sort === 'bestseller') list.sort((a,b)=> (b.bestseller?1:0) - (a.bestseller?1:0));
    else list.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    // pagination
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * perPage;
    const pageItems = list.slice(start, start + perPage);

    grid.innerHTML = pageItems.map(p => `
      <div class="col-6 col-md-4">
        <div class="card product-card h-100">
          <img loading="lazy" src="${p.image}" alt="${p.name}" class="card-img-top">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title">${p.name}</h6>
            <p class="small text-muted mb-2">${p.description.substring(0,60)}...</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <strong>${formatUSD(p.price)}</strong>
              <div>
                <button class="btn btn-sm btn-outline-primary" onclick="location.href='product.html?id=${p.id}'" aria-label="View ${p.name}">View</button>
                <button class="btn btn-sm btn-accent" onclick="addToCart(${p.id},1,null,null)">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    // results count/pagination UI
    resultsCount.textContent = `${total} result${total!==1?'s':''}`;
    renderPagination(totalPages);
  };

  function renderPagination(totalPages){
    const paginationHtml = Array.from({length: totalPages}, (_,i)=>`<li class="page-item ${state.page===i+1?'active':''}"><a class="page-link" href="#" data-page="${i+1}">${i+1}</a></li>`).join('');
    pagination.innerHTML = paginationHtml;
    qsa('#pagination a').forEach(a => a.addEventListener('click', (e)=>{ e.preventDefault(); state.page = Number(e.target.dataset.page); render(); }));
  }

  // Wire filter controls
  qs('#searchInput')?.addEventListener('input', e => { state.q = e.target.value.toLowerCase(); state.page = 1; render(); });
  qs('#priceMin')?.addEventListener('change', e => { state.priceMin = Number(e.target.value) || 0; render(); });
  qs('#priceMax')?.addEventListener('change', e => { state.priceMax = Number(e.target.value) || Infinity; render(); });
  qs('#sizeFilter')?.addEventListener('change', e => { state.size = e.target.value; render(); });
  qsa('.color-filter').forEach(cb => cb.addEventListener('change', ()=>{ state.colors = qsa('.color-filter:checked').map(i=>i.value); render(); }));
  qs('#categoryFilter')?.addEventListener('change', e => { state.category = e.target.value; render(); });
  qs('#sortSelect')?.addEventListener('change', e => { state.sort = e.target.value; render(); });
  qs('#clearFilters')?.addEventListener('click', ()=> { state = { page:1, q:'', priceMin:20, priceMax:60, size:'', colors:[], category:'', sort:'new' }; qsa('input,select').forEach(i=>i.value=''); qsa('.color-filter').forEach(i=>i.checked=false); render(); });

  // initialize from URL params (category)
  const params = new URLSearchParams(location.search);
  if(params.get('cat')) { qs('#categoryFilter').value = params.get('cat'); state.category = params.get('cat'); }

  render();
}

/* ---------- Product page ---------- */
function renderProductPage(){
  const container = qs('#productContent');
  if(!container) return;
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id')) || 1;
  const product = getProducts().find(p=>p.id===id);
  if(!product){ container.innerHTML = '<p>Product not found.</p>'; return; }

  container.innerHTML = `
    <div class="col-md-6">
      <img src="${product.image}" alt="${product.name}" class="img-fluid mb-2 main-img" loading="lazy">
      <div class="d-flex gap-2">
        ${[0,1,2].map(i=>`<img src="${product.image}" class="thumb img-thumbnail" style="width:80px;height:80px;object-fit:cover" loading="lazy">`).join('')}
      </div>
    </div>
    <div class="col-md-6">
      <h2>${product.name}</h2>
      <p class="small text-muted">${product.sku}</p>
      <h4>${formatUSD(product.price)}</h4>
      <p>${product.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ut sapien vitae lectus.</p>
      <div class="mb-2">
        <label class="form-label">Size</label>
        <div>${product.sizes.map(s=>`<div class="form-check form-check-inline"><input class="form-check-input" name="size" type="radio" value="${s}" id="size-${s}"><label class="form-check-label" for="size-${s}">${s}</label></div>`).join('')}</div>
      </div>
      <div class="mb-2">
        <label class="form-label">Color</label>
        <div>${product.colors.map(c=>`<button class="btn btn-outline-secondary btn-sm me-1 color-swatch" data-color="${c}" aria-label="${c}">${c}</button>`).join('')}</div>
      </div>
      <div class="mb-2 d-flex gap-2 align-items-center">
        <label class="form-label mb-0">Qty</label>
        <input type="number" id="prodQty" value="1" min="1" class="form-control w-25">
        <button id="addToCartBtn" class="btn btn-accent">Add to Cart</button>
      </div>
      <div id="productStock" class="small text-muted">${product.stock} in stock</div>
    </div>

    <div class="col-12 mt-4">
      <h5>Related Products</h5>
      <div id="relatedGrid" class="row g-3"></div>
      <h5 class="mt-4">Reviews</h5>
      <div id="reviewsList"></div>
      <form id="reviewForm" class="mt-2">
        <div class="mb-2"><label class="form-label">Your review</label><textarea id="reviewText" class="form-control" required></textarea></div>
        <div class="mb-2"><label class="form-label">Rating</label><select id="reviewRating" class="form-select"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
        <button class="btn btn-accent">Submit Review</button>
      </form>
    </div>
  `;

  // interactions
  let selectedColor = product.colors[0];
  qsa('.color-swatch').forEach(btn => btn.addEventListener('click', ()=> {
    qsa('.color-swatch').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); selectedColor = btn.dataset.color;
  }));
  qs('#addToCartBtn').addEventListener('click', ()=>{
    const size = qsa('input[name="size"]:checked')[0]?.value || product.sizes[0];
    const qty = Number(qs('#prodQty').value) || 1;
    if(product.stock < qty){ alert('Not enough stock'); return; }
    addToCart(product.id, qty, size, selectedColor);
  });

  // related products
  const related = getProducts().filter(p=>p.category === product.category && p.id !== product.id).slice(0,4);
  qs('#relatedGrid').innerHTML = related.map(p => `
    <div class="col-6 col-md-3">
      <div class="card h-100">
        <img src="${p.image}" alt="${p.name}" class="card-img-top" loading="lazy">
        <div class="card-body">
          <h6 class="card-title small">${p.name}</h6>
          <div class="d-flex justify-content-between">
            <strong>${formatUSD(p.price)}</strong>
            <button class="btn btn-sm btn-outline-primary" onclick="location.href='product.html?id=${p.id}'">View</button>
          </div>
        </div>
      </div>
    </div>`).join('');

  // reviews stored in localStorage keyed by product id
  const reviewsKey = `ut_reviews_${product.id}`;
  function renderReviews(){
    const reviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
    qs('#reviewsList').innerHTML = reviews.map(r => `<div class="border p-2 mb-2"><strong>${r.rating}★</strong> - <p class="mb-0">${r.text}</p></div>`).join('') || '<p class="small text-muted">No reviews yet.</p>';
  }
  qs('#reviewForm').addEventListener('submit', e=>{
    e.preventDefault();
    const text = qs('#reviewText').value.trim(), rating = Number(qs('#reviewRating').value);
    if(!text) return;
    const arr = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
    arr.unshift({ text, rating, createdAt: Date.now() });
    localStorage.setItem(reviewsKey, JSON.stringify(arr));
    renderReviews(); qs('#reviewForm').reset();
  });
  renderReviews();
}

/* ---------- Cart page ---------- */
function renderCartPage(){
  const cartList = qs('#cartList'), summarySubtotal = qs('#summarySubtotal'), summaryTax = qs('#summaryTax'), summaryTotal = qs('#summaryTotal');
  const summaryShipping = 5.00; const TAX_RATE = 0.085;

  function render(){
    const cart = getCart();
    if(!cart.length){ qs('#emptyCart').classList.remove('d-none'); qs('#cartArea').classList.add('d-none'); return; }
    qs('#emptyCart').classList.add('d-none'); qs('#cartArea').classList.remove('d-none');

    const products = getProducts();
    let subtotal = 0;
    cartList.innerHTML = cart.map((item, idx) => {
      const product = products.find(p=>p.id===item.productId) || {};
      const subtotalItem = (product.price || 0) * item.qty;
      subtotal += subtotalItem;
      return `<div class="list-group-item d-flex align-items-center">
        <img src="${product.image}" alt="${product.name}" style="width:80px;height:80px;object-fit:cover" class="me-3">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between">
            <div>
              <strong>${product.name}</strong>
              <div class="small text-muted">${item.size || ''} ${item.color? ' • ' + item.color : ''}</div>
            </div>
            <div class="text-end">
              <div>${formatUSD(product.price || 0)}</div>
              <div class="small text-muted">Subtotal ${formatUSD(subtotalItem)}</div>
            </div>
          </div>
          <div class="mt-2 d-flex gap-2 align-items-center">
            <input type="number" class="form-control w-25 qtyInput" data-idx="${idx}" value="${item.qty}" min="1">
            <button class="btn btn-outline-danger btn-sm removeBtn" data-idx="${idx}">Remove</button>
          </div>
        </div>
      </div>`;
    }).join('');

    // summary
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax + summaryShipping;
    summarySubtotal.textContent = formatUSD(subtotal);
    summaryTax.textContent = formatUSD(tax);
    summaryTotal.textContent = formatUSD(total);

    qsa('.removeBtn').forEach(b => b.addEventListener('click', ()=> { removeFromCart(Number(b.dataset.idx)); render(); }));
    qsa('.qtyInput').forEach(inp => inp.addEventListener('change', ()=> { updateQtyInCart(Number(inp.dataset.idx), Number(inp.value)); render(); }));
  }

  qs('#applyPromo')?.addEventListener('click', ()=> {
    const code = qs('#promoCode').value.trim().toUpperCase();
    if(code === 'WELCOME'){ // 10% off demo
      const cart = getCart(); // apply discount by temporarily adjusting price in UI (not modifying product)
      alert('Promo applied: 10% off (demo)');
      // For demo, apply discount via storing a flag in sessionStorage
      sessionStorage.setItem('promo','WELCOME');
    } else { alert('Invalid promo'); }
    render();
  });

  qs('#checkoutBtn')?.addEventListener('click', ()=> {
    const session = JSON.parse(localStorage.getItem('ut_session') || 'null');
    if(!session){ // require login
      if(confirm('Please log in to checkout. Open login modal?')) showAuthModal();
      return;
    }
    location.href = 'checkout.html';
  });

  render();
}

/* ---------- Checkout flow ---------- */
function setupCheckout(){
  const step1 = qs('#step1'), step2 = qs('#step2'), step3 = qs('#step3');
  const toPayment = qs('#toPayment'), toReview = qs('#toReview'), backToPayment = qs('#backToPayment'), placeOrderBtn = qs('#placeOrder');
  const checkoutSummary = qs('#checkoutSummary');

  function showStep(n){
    step1.classList.toggle('d-none', n!==1);
    step2.classList.toggle('d-none', n!==2);
    step3.classList.toggle('d-none', n!==3);
  }

  toPayment.addEventListener('click', ()=> {
    // Basic validation
    const name = qs('#shipName').value.trim(), email = qs('#shipEmail').value.trim(), addr = qs('#shipAddress').value.trim();
    if(!name || !email || !addr){ alert('Please fill shipping fields'); return; }
    showStep(2);
  });

  toReview.addEventListener('click', ()=> {
    // Validate card fields (demo)
    const cName = qs('#cardName').value.trim(), cNum = qs('#cardNumber').value.trim();
    if(!cName || !cNum){ alert('Please enter card details (demo)'); return; }
    // Render order summary
    const cart = getCart(); const products = getProducts();
    let subtotal = 0;
    const itemsHtml = cart.map(i => {
      const p = products.find(x => x.id===i.productId);
      const s = (p?.price || 0) * i.qty; subtotal += s;
      return `<div>${i.qty}× ${p.name} — ${formatUSD(s)}</div>`;
    }).join('');
    const shipping = 5.00; const tax = subtotal * 0.085; const total = subtotal + shipping + tax;
    checkoutSummary.innerHTML = `${itemsHtml}<hr>Subtotal: ${formatUSD(subtotal)}<br>Shipping: ${formatUSD(shipping)}<br>Tax: ${formatUSD(tax)}<br><strong>Total: ${formatUSD(total)}</strong>`;
    showStep(3);
  });

  backToPayment.addEventListener('click', ()=> showStep(2));

  qs('#checkoutForm').addEventListener('submit', (e)=> {
    e.preventDefault();
    // Create order
    const orderId = uuid();
    const order = {
      id: orderId, createdAt: Date.now(), items: getCart(), shipping: { name: qs('#shipName').value, email: qs('#shipEmail').value, address: qs('#shipAddress').value },
    };
    saveOrder(order);
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    // Show modal with ID
    const orderModal = new bootstrap.Modal(qs('#orderModal'));
    qs('#orderInfo').textContent = `Order ID: ${orderId}. A confirmation email (demo) sent to ${order.shipping.email}.`;
    orderModal.show();
  });
}

/* ---------- Account ---------- */
function renderAccount(){
  const area = qs('#accountArea');
  const session = JSON.parse(localStorage.getItem('ut_session') || 'null');
  if(!session){ area.innerHTML = `<p>Please <a href="#" id="openLogin">log in</a> to view your account.</p>`; qs('#openLogin')?.addEventListener('click', (e)=>{ e.preventDefault(); showAuthModal(); }); return; }
  const users = getUsers();
  const me = users.find(u=>u.email === session.email);
  const orders = getOrders().filter(o => o.shipping?.email === session.email);
  area.innerHTML = `
    <div class="card p-3 mb-3">
      <h5>Welcome, ${me?.name || me?.email}</h5>
      <p class="small">Member since ${new Date(me?.createdAt).toLocaleDateString()}</p>
    </div>
    <div class="card p-3">
      <h5>Order History</h5>
      ${orders.length ? `<ul>${orders.map(o=>`<li>${o.id} — ${new Date(o.createdAt).toLocaleString()}</li>`).join('')}</ul>` : '<p class="small text-muted">No orders yet.</p>'}
    </div>
  `;
}

/* ---------- Admin ---------- */
function renderAdmin(){
  // Simple password prompt
  const pass = prompt('Admin password (demo):');
  if(pass !== 'admin123'){ document.querySelector('.admin-panel').innerHTML = '<p>Access denied.</p>'; return; }

  const products = getProducts();
  const users = getUsers();
  const orders = getOrders();

  const adminContent = qs('#adminContent');
  adminContent.innerHTML = `
    <div class="mb-3">
      <button id="addProductBtn" class="btn btn-accent">Add Product</button>
      <button id="logoutAdmin" class="btn btn-outline-secondary">Logout Admin</button>
    </div>

    <h5>Products</h5>
    <table class="table">
      <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
      <tbody>
        ${products.map(p=>`<tr><td>${p.id}</td><td>${p.name}</td><td>${formatUSD(p.price)}</td><td>${p.stock}</td><td><button class="btn btn-sm btn-outline-primary editProduct" data-id="${p.id}">Edit</button> <button class="btn btn-sm btn-outline-danger delProduct" data-id="${p.id}">Delete</button></td></tr>`).join('')}
      </tbody>
    </table>

    <h5>Orders</h5>
    <table class="table">
      <thead><tr><th>Order ID</th><th>Date</th><th>Items</th></tr></thead>
      <tbody>
        ${orders.map(o=>`<tr><td>${o.id}</td><td>${new Date(o.createdAt).toLocaleString()}</td><td>${o.items.length}</td></tr>`).join('')}
      </tbody>
    </table>

    <h5>Users</h5>
    <ul>${users.map(u=>`<li>${u.email} (${u.name})</li>`).join('')}</ul>
  `;

  qs('#logoutAdmin').addEventListener('click', ()=> { location.href = 'index.html'; });

  // Add product demo -> show a prompt to add
  qs('#addProductBtn').addEventListener('click', ()=> {
    const name = prompt('Product name:'); if(!name) return;
    const price = Number(prompt('Price:', '29.99')) || 29.99;
    const productsArr = getProducts();
    const newP = { id: Date.now(), sku:'UT-'+Date.now(), name, price, image:'assets/images/placeholder1.jpg', category:'men', colors:['black'], sizes:['S','M','L'], description:'Admin created', stock:20, createdAt: new Date().toISOString() };
    productsArr.push(newP);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsArr));
    alert('Product added (demo). Reloading.');
    location.reload();
  });

  // Delete product
  qsa('.delProduct').forEach(b => b.addEventListener('click', ()=> {
    const id = Number(b.dataset.id);
    if(!confirm('Delete product?')) return;
    const arr = getProducts().filter(p=>p.id!==id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr));
    location.reload();
  }));
}

/* ---------- Security & Notes (in comments) ----------
  - In production:
    * Serve site over HTTPS.
    * Never store passwords in localStorage or plaintext. Use hashed passwords on server.
    * Use a server-side API (Node/Express, Firebase, etc.) for product data, auth, and orders.
    * Integrate Stripe or other payment gateway using server-side secret keys; use client tokens (Stripe Elements) for secure card entry.
    * Validate all inputs server-side and client-side.
    * Implement CSRF protection, rate limits, and proper CORS.
----------------------------------------------------- */
