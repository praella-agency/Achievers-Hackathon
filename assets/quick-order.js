// quickOrder Web Component Class for Quick Order
class quickOrder extends HTMLElement {
    constructor() {
      super();
      this.cachedResults = {};
      this.input = this.querySelector('input[type="search"]');
      this.searchTypeSelect = this.querySelector('[data-search-type]');
      this.quickOrderResults = this.querySelector('[data-quickorder-search]');
      this.searchTerm = '';
      this.cartElement = document.querySelector('cart-form');
  
      this.setupEventListeners();
  
      let duplicateHtml = document.querySelector('[data-duplicate]').innerHTML
  
      document.querySelector('[data-add-more]').addEventListener('click',(e)=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        document.querySelector('.quick-form .cart-items').insertAdjacentHTML("beforeend",`<div class="border-bottom border-gray-80 cart-header cart-item" data-closest-target>${duplicateHtml}</div>`)
      })
    }
  
    setupEventListeners() {
      if (this.input) {
        this.input.addEventListener('input', debounce((event) => {
          this.onChange(event);
        }, 500).bind(this));
      }
  
      this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
      this.input.addEventListener('focus', this.onFocus.bind(this));
      document.querySelectorAll('[data-qty-input]').forEach(button => button.addEventListener('change', this.manageQtyBtn.bind(this)));
      document.querySelectorAll('[data-qty-btn]').forEach(button => button.addEventListener('click', this.manageQtyBtn.bind(this)));
      document.querySelectorAll('[data-item-remove]').forEach(button => button.addEventListener('click', this.removeItem.bind(this)));
      document.querySelector('.quick-form').addEventListener('submit', this.onSubmitHandler.bind(this));
    }
  
    getQuery() {
      return this.input.value.trim();
    }
  
    onChange() {
      const newSearchTerm = this.getQuery();
      if (!newSearchTerm) {
        this.hideResults();
        return;
      }
  
      this.searchTerm = newSearchTerm;
      this.getSearchResults(this.searchTerm);
    }
  
    onFormSubmit(event) {
      event.preventDefault();
    }
  
    onFocus() {
      const currentSearchTerm = this.getQuery();
      if (!currentSearchTerm.length) return;
      if (this.searchTerm !== currentSearchTerm) {
        this.onChange();
      } else {
        this.getSearchResults(this.searchTerm);
      }
    }
  
    getSearchResults(searchTerm) {
      const queryKey = searchTerm.replace(/\s+/g, '-').toLowerCase();
      this.quickOrderResults.setAttribute('loading', true);
  
      if (this.cachedResults[queryKey]) {
        this.renderSearchResults(this.cachedResults[queryKey]);
        return;
      }
  
      const searchType = this.searchTypeSelect ? this.searchTypeSelect.value : 'sku';
      fetch(`${window.routes.predictive_searh}?q=${encodeURIComponent(searchTerm)}&resources[options][fields]=${encodeURIComponent(searchType)}&section_id=predictive-search`)
        .then(response => {
          if (!response.ok) throw new Error(response.status);
          return response.text();
        })
        .then(text => {
          const resultsMarkup = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('#shopify-section-predictive-search').innerHTML;
  
          this.cachedResults[queryKey] = resultsMarkup;
          this.renderSearchResults(resultsMarkup);
        })
        .catch(error => {
          this.quickOrderResults.setAttribute('loading', false);
          if (error?.code !== 20) console.error(error);
        });
    }
  
    renderSearchResults(resultsMarkup) {
      this.quickOrderResults.innerHTML = resultsMarkup;
      this.quickOrderResults.setAttribute('loading', false);
      this.quickOrderResults.classList.add('show-results');
  
      const addButtons = this.quickOrderResults.querySelectorAll('[add-quick-btn]');
      addButtons.forEach(btn => btn.addEventListener('click', this.onAddProductHtml.bind(this)));
    }
  
    hideResults() {
      this.quickOrderResults.classList.remove('show-results');
      this.quickOrderResults.innerHTML = '';
    }
  
    onAddProductHtml(event) {
      event.preventDefault();
  
      const btn = event.currentTarget;
      const prodHTML = btn.closest('[data-add-product]');
      const title = prodHTML.querySelector('.item--title')?.textContent.trim();
  
      const existingTitles = Array.from(document.querySelectorAll('.quick-form .cart-items .card-title')).map(el => el.textContent.trim());
      if (existingTitles.includes(title)) {
        window.notificationEle.updateNotification('Already Added!', 'This product is already in your list.', {
          type: 'error',
          timeout: 3000
        });
        return;
      }
  
      const productID = prodHTML.getAttribute('data-add-product');
      const productTitle = prodHTML.querySelector('.item--title')?.innerHTML.trim();
      const productLink = prodHTML.querySelector('.item--title')?.getAttribute('href');
      const productSKU = prodHTML.querySelector('.prod-sku')?.innerHTML.trim();
      const productPrice = prodHTML.querySelector('.actual-price')?.innerHTML.trim();
  
      const itemHTML = `
          <div class="row align-items-center">
            <div class="col-12 col-md-auto col1 cart-product-img mb-3 mb-md-0">
              <div class="align-items-center d-flex no-gutter row">
                <div class="cart-item-text col-12">
                  <a href="${productLink}" class="card-title fw-semibold lh-1_4 text-capitalize d-block mb-1">${productTitle}</a>
                  <p class="fs-xs fw-medium lh-1_2 ls-4 mb-0 text-gray-600 text-uppercase">${productSKU}</p>
                </div>
              </div>
            </div>
            <div class="col-3 col-md-auto pe-0 pe-md-3 col2 fs-md fw-semibold lh-1_4" data-price>${productPrice}</div>
            <div class="col-4 col-md-auto col3 quantity-box pe-md-5 pe-lg-12">
              <div class="d-flex align-items-center justify-content-between">
                <div class="quantity-wrapper h-100" data-qty-container>
                  <div class="border border-gray-80 h-100 input-group rounded-1 updatecart">
                    <a href="#" class="input-group-text min-h-100 border-0" rel="nofollow" data-for="decrease" data-qty-btn>
                      <span class="btn-decrease d-flex h-100 align-items-center ps-lg-3 ps-2">
                        <svg aria-hidden="true" style="width:10px;height:5px;"><use href="#icon-minus"></use></svg>
                      </span>
                    </a>
                    <input type="number" name="updates[]" value="1" min="1" step="1" class="quantity form-control border-0 text-center fs-base px-1 py-2" data-qty-input>
                    <a href="#" class="input-group-text min-h-100 border-0" rel="nofollow" data-for="increase" data-qty-btn>
                      <span class="btn-increase d-flex h-100 align-items-center pe-lg-3 pe-2">
                        <svg aria-hidden="true" style="width:10px;height:10px;"><use href="#icon-plus"></use></svg>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div class="align-items-center col-5 ps-0 ps-md-3 col-md-auto col4 d-flex flex-wrap fs-md fw-semibold justify-content-between lh-1_4 pe-lg-4" data-total-price>
              ${productPrice}
              <a class="my-0 text-gray-600 ms-xl-6 ms-2" href="#" title="Remove" aria-label="Remove" data-item-remove>
                <svg aria-hidden="true" style="width:21px;height:21px;"><use href="#icon-delete"></use></svg>
              </a>
            </div>
            <input name="id" value="${productID}" type="hidden" />
          </div>`;
  
      // const container = document.querySelector('.quick-form .cart-items');
      // container.insertAdjacentHTML('beforeend', itemHTML);
  
      const container = event.target.closest('[data-closest-target]');
      container.innerHTML = itemHTML;
  
      this.input.value = '';
      this.hideResults();
  
      container.querySelectorAll('[data-qty-input]').forEach(button => button.addEventListener('change', this.manageQtyBtn.bind(this)));
      container.querySelectorAll('[data-qty-btn]').forEach(button => button.addEventListener('click', this.manageQtyBtn.bind(this)));
      container.querySelectorAll('[data-item-remove]').forEach(button => button.addEventListener('click', this.removeItem.bind(this)));
      
      this.updateOrderTotal();
    }
  
    manageQtyBtn(event) {
      event.preventDefault();
      const btn = event.currentTarget;
      const action = btn.dataset.for;
      const input = btn.closest('[data-qty-container]').querySelector('[data-qty-input]');
      let value = parseInt(input.value) || 1;
    
      if (action === 'increase') {
        value += 1;
        input.value = value;
      } else if (action === 'decrease') {
        if (value > 1) {
          value -= 1;
          input.value = value;
        } else {
          const itemToRemove = btn.closest('[data-closest-target]').querySelector('[data-item-remove]');
          if (itemToRemove) {
            itemToRemove.click();
          }
          return;
        }
      }
    
      const priceContainer = btn.closest('[data-closest-target]');
      const unitPriceEl = priceContainer.querySelector('[data-price]');
      const totalPriceEl = priceContainer.querySelector('[data-total-price]');
    
      if (unitPriceEl && totalPriceEl) {
        const unitPrice = this.parseMoney(unitPriceEl.textContent);
        const newTotal = unitPrice * value;
        totalPriceEl.childNodes[0].nodeValue = this.formatMoney(newTotal);
      }
    
      this.updateOrderTotal();
    }
  
    updateOrderTotal() {
      const totalEl = document.querySelector('[data-total-order]');
      let total = 0;
    
      document.querySelectorAll('.cart-item').forEach(item => {
        const totalPriceEl = item.querySelector('[data-total-price]');
        if (totalPriceEl) {
          const price = this.parseMoney(totalPriceEl.textContent);
          total += price;
        }
      });
    
      if (totalEl) {
        totalEl.textContent = this.formatMoney(total);
      }
    }
  
    parseMoney(value) {
      return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
    }
    
    formatMoney(amount) {
      return `$${amount.toFixed(2)}`;
    }
  
    removeItem(event) {
      event.preventDefault();
      const item = event.currentTarget.closest('[data-closest-target]');
      item.remove();
      if (document.querySelector('[data-closest-target]') == null) {
        let duplicateHtml = document.querySelector('[data-duplicate]').innerHTML;
        document.querySelector('.quick-form .cart-items').insertAdjacentHTML("beforeend",`<div class="border-bottom border-gray-80 cart-header cart-item" data-closest-target>${duplicateHtml}</div>`);
      }
      
      this.updateOrderTotal();
    }
  
    onSubmitHandler(evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    
      const form = evt.currentTarget;
      const submitButton = form.querySelector('[type="submit"]');
      const cartItems = form.querySelectorAll('.cart-item');
      const addItems = [];
    
      cartItems.forEach(item => {
        const idInput = item.querySelector('input[name="id"]');
        const qtyInput = item.querySelector('[data-qty-input]');
    
        if (idInput && qtyInput) {
          addItems.push({
            id: idInput.value,
            quantity: parseInt(qtyInput.value) || 1
          });
        }
      });
    
      if (addItems.length === 0) {
        window.notificationEle.updateNotification('Product Missing', 'Please select products.', {
          type: 'error',
          timeout: 5000
        });
        return false;
      }
    
      submitButton.setAttribute('disabled', true);
      submitButton.classList.add('loading');
  
      let cartSectionID = 'component-cart-drawer';
      if(window.globalSpace.template == 'cart'){
        cartSectionID = document.getElementById('cart--items')?.dataset.id || 'template-cart';
      }
    
      const body = JSON.stringify({ items: addItems, sections: `${cartSectionID},header` });
    
      fetch(`${routes.cart_add_url}`, { ...fetchConfig(), body })
        .then(response => response.json())
        .then(res => {
          const dataJSON = typeof res === 'object' ? res : JSON.parse(res);
    
          if (dataJSON.errors) {
            window.notificationEle.updateNotification('Add to Cart', dataJSON.errors, {
              type: 'error',
              timeout: 5000
            });
            return;
          }
          
          // Open cart drawer or redirect
          if(this.cartElement){
            this.cartElement?._updateCart(dataJSON.sections, submitButton);
          }else{
            window.location.href = window.routes.cart_fetch_url;
          }
        })
        .catch(e => {
          window.notificationEle.updateNotification('Error', e?.message || 'Something went wrong.', {
            type: 'error',
            timeout: 5000
          });
          console.error(e);
        })
        .finally(() => {
          submitButton.classList.remove('loading');
          submitButton.removeAttribute('disabled');
        });
    }
  
  }
  
  customElements.define('quick-order', quickOrder);
  