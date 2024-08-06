import axios from 'axios';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
// import Swiper and modules styles
import 'swiper/css';
import 'swiper/css/pagination';

import './main.scss';

document.addEventListener('DOMContentLoaded', () => {
  // инициализация слайдера разделов каталога
  const swiper = new Swiper('.swiper', {
    loop: true,
    modules: [Navigation, Pagination],
    pagination: {
      el: '.swiper-pagination',
    },
    navigation: {
      nextEl: '.swiper-button-next',
    },
    scrollbar: {
      el: '.swiper-scrollbar',
    },
  });

  const dropdownButton = document.getElementById('sort-btn');
  const dropdownContent = document.querySelector('.sorting-dropdown__content');
  const overlay = document.querySelector('.overlay');
  const productContainer = document.querySelector('.products__container');
  const productsAmountSpan = document.getElementById('products-amount');
  const cartContainer = document.querySelector('.cart-popup__items');
  const cartPopup = document.getElementById('cart-popup');
  const filtersPopup = document.getElementById('filters-popup');
  const openFiltersBtn = document.getElementById('open-filters-btn');
  const cartButton = document.querySelector('.header__cart-btn');
  const cartCloseButton = document.querySelector('.cart-popup__close');
  const cartCountElement = document.getElementById('open-cart-count');
  const clearCartButton = document.getElementById('clear-cart');
  const itemsAmountSpan = document.getElementById('cart-amount');
  const cartSumSpan = document.getElementById('cart-sum');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuCloseBtn = document.querySelector('.mobile-menu__close');
  const mobileMenuPopup = document.getElementById('mobile-menu-popup');

  let startY = 0;
  let endY = 0;

  let products = [];
  let cart = [];
  const removedItems = new Map();

  // Обработка открытия и закрытия дропдауна
  dropdownButton.addEventListener('click', (event) => {
    event.preventDefault();
    const isVisible = dropdownContent.classList.toggle('show');
    overlay.style.display = isVisible ? 'block' : 'none';
  });

  // Закрытие дропдауна при клике вне его
  window.addEventListener('click', (event) => {
    if (
      !event.target.matches('#sort-btn') &&
      !event.target.matches('.sorting-dropdown__type')
    ) {
      if (dropdownContent.classList.contains('show')) {
        dropdownContent.classList.remove('show');
        overlay.style.display = 'none';
      }
    }
  });

  // Загрузка продуктов с сортировкой
  const loadProducts = (sortKey = 'priceHigh') => {
    axios
      .get('https://66a6f1b823b29e17a1a3c654.mockapi.io/products')
      .then((response) => {
        products = response.data;
        // Фильтрация продуктов
        const filters = {
          new:
            document.getElementById('new').checked ||
            document.getElementById('new-mobile').checked,
          inStock:
            document.getElementById('in-stock').checked ||
            document.getElementById('in-stock-mobile').checked,
          contract:
            document.getElementById('contract').checked ||
            document.getElementById('contract-mobile').checked,
          exclusive:
            document.getElementById('exclusive').checked ||
            document.getElementById('exclusive-mobile').checked,
          sale:
            document.getElementById('sale').checked ||
            document.getElementById('sale-mobile').checked,
        };

        products = products.filter((product) => {
          return (
            (!filters.new || product.new) &&
            (!filters.inStock || product.inStock) &&
            (!filters.contract || product.contract) &&
            (!filters.exclusive || product.exclusive) &&
            (!filters.sale || product.sale)
          );
        });

        // Сортировка продуктов
        if (sortKey === 'priceHigh') {
          products.sort((a, b) => b.price - a.price);
        } else if (sortKey === 'priceLow') {
          products.sort((a, b) => a.price - b.price);
        } else if (sortKey === 'popular') {
          products.sort((a, b) => b.popularity - a.popularity);
        } else if (sortKey === 'new') {
          products.sort(
            (a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)
          );
        }

        // Отображение продуктов
        productsAmountSpan.textContent = products.length + ' ';
        productContainer.innerHTML = '';
        products.forEach((product) => {
          const productElement = document.createElement('div');
          productElement.className = 'product';

          const productImageWrapper = document.createElement('div');
          productImageWrapper.classList.add('product__image-wrapper');

          const productImage = document.createElement('img');
          productImage.classList.add('product__image');
          productImage.src = product.imageUrl;
          productImage.alt = product.name;

          const productHoverPic = document.createElement('div');
          productHoverPic.classList.add('product__hover-pic');

          const productName = document.createElement('h2');
          productName.classList.add('product__name');
          productName.textContent = product.name;

          const productBottomPanel = document.createElement('div');
          productBottomPanel.classList.add('product__bottom-panel');

          const productPrice = document.createElement('p');
          productPrice.classList.add('product__price');
          productPrice.textContent = product.price + ' ₽';

          const addProductBtn = document.createElement('button');
          addProductBtn.setAttribute('data-id', product.id);
          addProductBtn.classList.add('product__add-btn');
          addProductBtn.textContent = '+';

          const quantityControl = document.createElement('div');
          quantityControl.className = 'quantity-control';
          quantityControl.style.display = 'none';

          const quantitySpan = document.createElement('span');
          quantitySpan.className = 'quantity-span';

          const minusButton = document.createElement('button');
          minusButton.className = 'quantity-button';
          minusButton.textContent = '-';
          minusButton.disabled = true;

          const plusButton = document.createElement('button');
          plusButton.className = 'quantity-button';
          plusButton.textContent = '+';
          plusButton.disabled = true;

          quantityControl.appendChild(minusButton);
          quantityControl.appendChild(quantitySpan);
          quantityControl.appendChild(plusButton);

          productElement.appendChild(productHoverPic);
          productImageWrapper.appendChild(productImage);
          productElement.appendChild(productImageWrapper);
          productElement.appendChild(productName);
          productBottomPanel.appendChild(productPrice);
          productBottomPanel.appendChild(addProductBtn);
          productBottomPanel.appendChild(quantityControl);
          productElement.appendChild(productBottomPanel);

          productContainer.appendChild(productElement);

          // обработчики событий для кнопок изменения количества товара в корзине
          minusButton.addEventListener('click', () =>
            updateQuantity(product.id, -1)
          );
          plusButton.addEventListener('click', () =>
            updateQuantity(product.id, 1)
          );

          addProductBtn.addEventListener('click', addToCart);
        });
        // отображение правильных кнопок у товара при изменении сортировки
        if (cart.length > 0) {
          cart.forEach((item) => {
            updateProductControls(item.id);
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  };
  // Функция для добавления товара в корзину
  const addToCart = (event) => {
    const productId = event.target.getAttribute('data-id');
    const product = products.find((item) => item.id === productId);

    if (product) {
      const cartItem = cart.find((item) => item.id === productId);
      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      updateCartDisplay();
      updateProductControls(productId);
    }
  };
  // изменение количества товара в корзине
  const updateQuantity = (productId, change) => {
    const cartItem = cart.find((item) => item.id === productId);
    if (cartItem) {
      cartItem.quantity += change;
      if (cartItem.quantity <= 0) {
        cartItem.quantity = 1;
      }
      updateCartDisplay();
      updateProductControls(productId);
    }
  };

  // отображение количества товаров в попапе корзины
  const updateItemsAmount = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) {
      return count + ' товар';
    } else if (
      [2, 3, 4].includes(count % 10) &&
      ![12, 13, 14].includes(count % 100)
    ) {
      return count + ' товара';
    } else {
      return count + ' товаров';
    }
  };
  // обновление отображения корзины при изменении товаров
  const updateCartDisplay = () => {
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
      cartContainer.textContent = '';
      cartCountElement.textContent = '0';
      cartSumSpan.textContent = '0';
      itemsAmountSpan.textContent = 'Нет товаров';
      return;
    }
    let totalItems = 0;
    let totalSum = 0;
    cart.forEach((item) => {
      totalItems += item.quantity;
      totalSum += item.quantity * Number(item.price);
      const cartItemElement = document.createElement('div');
      cartItemElement.className = 'cart-item';
      cartItemElement.setAttribute('data-id', item.id);

      const cartItemImage = document.createElement('img');
      cartItemImage.className = 'cart-item__image';
      cartItemImage.src = item.imageUrl;

      const cartItemInfo = document.createElement('div');
      cartItemInfo.className = 'cart-item__info';

      const cartItemName = document.createElement('h3');
      cartItemName.textContent = item.name;

      const quantityControl = document.createElement('div');
      quantityControl.className = 'quantity-control';

      const minusButton = document.createElement('button');
      minusButton.className = 'quantity-button';
      minusButton.textContent = '-';
      minusButton.addEventListener('click', () => updateQuantity(item.id, -1));

      const quantitySpan = document.createElement('span');
      quantitySpan.className = 'quantity-span';
      quantitySpan.textContent = item.quantity;

      const plusButton = document.createElement('button');
      plusButton.className = 'quantity-button';
      plusButton.textContent = '+';
      plusButton.addEventListener('click', () => updateQuantity(item.id, 1));

      quantityControl.appendChild(minusButton);
      quantityControl.appendChild(quantitySpan);
      quantityControl.appendChild(plusButton);

      const cartItemPrice = document.createElement('p');
      cartItemPrice.textContent = `${item.price} ₽`;

      const removeButton = document.createElement('button');
      removeButton.className = 'remove-button';
      removeButton.addEventListener('click', () => removeFromCart(item.id));

      cartItemElement.appendChild(cartItemImage);
      cartItemInfo.appendChild(cartItemName);
      cartItemInfo.appendChild(cartItemPrice);
      cartItemElement.appendChild(cartItemInfo);
      cartItemElement.appendChild(quantityControl);
      cartItemElement.appendChild(removeButton);

      cartContainer.appendChild(cartItemElement);

      cartCountElement.textContent = totalItems;
      itemsAmountSpan.textContent = updateItemsAmount(totalItems);
      cartSumSpan.textContent = totalSum.toLocaleString();
    });
  };
  // удаление товаров из корзины
  const removeFromCart = (productId) => {
    const cartItem = cart.find((item) => item.id === productId);
    if (cartItem) {
      const cartItemElement = document.querySelector(
        `.cart-item[data-id="${productId}"]`
      );
      cartItemElement.classList.add('removed');
      cartItemElement.querySelector('.remove-button').style.display = 'none';

      const undoButton = document.createElement('button');
      undoButton.className = 'undo-button';
      undoButton.addEventListener('click', () => undoRemoveFromCart(productId));

      cartItemElement.appendChild(undoButton);

      // временно добавляем товар в removedItems, чтобы пользователь мог восстановить его
      removedItems.set(productId, cartItem);
    }
    // удаление товара из корзины окончательно по прошествии 2 секунд
    setTimeout(() => {
      finalizeRemovals();
    }, 2000);
  };
  // отмена удаления товара из корзины
  const undoRemoveFromCart = (productId) => {
    const cartItemElement = document.querySelector(
      `.cart-item[data-id="${productId}"]`
    );
    if (cartItemElement) {
      cartItemElement.classList.remove('removed');
      cartItemElement.querySelector('.remove-button').style.display =
        'inline-block';
      const undoButton = cartItemElement.querySelector('.undo-button');
      cartItemElement.removeChild(undoButton);
      removedItems.delete(productId);
    }
  };
  // обновление отображения кнопок уменьшения/увеличения количества товара в корзине
  const updateProductControls = (productId) => {
    const productElement = document.querySelector(
      `.product__add-btn[data-id="${productId}"]`
    );
    if (!productElement) return;

    const quantityControl = productElement.nextElementSibling;
    const cartItem = cart.find((item) => item.id === productId);

    if (cartItem) {
      const quantitySpan = quantityControl.querySelector('.quantity-span');
      quantitySpan.textContent = cartItem.quantity;

      const minusButton = quantityControl.querySelector(
        '.quantity-button:first-child'
      );
      const plusButton = quantityControl.querySelector(
        '.quantity-button:last-child'
      );

      minusButton.disabled = false;
      plusButton.disabled = false;

      productElement.style.display = 'none';
      quantityControl.style.display = 'flex';
    } else {
      productElement.style.display = '';
      quantityControl.style.display = 'none';
    }
  };

  // Обработка открытия корзины
  cartButton.addEventListener('click', (event) => {
    event.preventDefault();
    cartPopup.classList.add('show');
    overlay.classList.add('show');
  });

  // Обработка закрытия корзины
  cartCloseButton.addEventListener('click', (event) => {
    event.preventDefault();
    finalizeRemovals();
    cartPopup.classList.remove('show');
    overlay.classList.remove('show');
  });

  // Обработка открытия мобильных фильтров
  openFiltersBtn.addEventListener('click', (event) => {
    event.preventDefault();
    filtersPopup.classList.add('show');
    overlay.classList.add('show');
  });

  // закрытие мобильных фильтров свайпом вниз
  filtersPopup.addEventListener('touchstart', (event) => {
    startY = event.touches[0].clientY;
  });
  filtersPopup.addEventListener('touchmove', (event) => {
    endY = event.touches[0].clientY;
  });
  filtersPopup.addEventListener('touchend', () => {
    if (endY > startY + 100) {
      filtersPopup.classList.remove('show');
      overlay.style.display = 'none';
    }
    startY = 0;
    endY = 0;
  });

  // Обработка открытия попапа мобильного меню
  mobileMenuBtn.addEventListener('click', (event) => {
    event.preventDefault();
    mobileMenuPopup.classList.add('show');
    overlay.classList.add('show');
  });

  // Обработка закрытия попапа мобильного меню
  mobileMenuCloseBtn.addEventListener('click', (event) => {
    event.preventDefault();
    mobileMenuPopup.classList.remove('show');
    overlay.classList.remove('show');
  });

  // Закрытие попапов при клике на затемнение
  overlay.addEventListener('click', () => {
    finalizeRemovals();
    cartPopup.classList.remove('show');
    filtersPopup.classList.remove('show');
    mobileMenuPopup.classList.remove('show');
    overlay.classList.remove('show');
  });
  // окончательное удаление товара из корзины
  const finalizeRemovals = () => {
    removedItems.forEach((_, productId) => {
      const index = cart.findIndex((item) => item.id === productId);
      if (index !== -1) {
        cart.splice(index, 1);
      }
      updateProductControls(productId);
    });
    removedItems.clear();
    updateCartDisplay();
  };

  // очистка корзины
  clearCartButton.addEventListener('click', (event) => {
    event.preventDefault();
    cart.forEach((item) => {
      removeFromCart(item.id);
      updateProductControls(item.id);
    });
    finalizeRemovals();
    updateCartDisplay();
  });

  // Обработка выбора сортировки
  dropdownContent.addEventListener('click', (event) => {
    if (event.target.classList.contains('sorting-dropdown__type')) {
      const sortKey = event.target.getAttribute('data-sort');
      dropdownButton.textContent = event.target.textContent;
      document
        .querySelector('.sorting-dropdown__type.selected')
        ?.classList.remove('selected');

      event.target.classList.add('selected');

      loadProducts(sortKey);
      dropdownContent.classList.remove('show');
      overlay.style.display = 'none';
    }
  });

  // Обработка изменения состояния чекбоксов
  const checkboxes = document.querySelectorAll('.checkbox__input');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      loadProducts();
    });
  });

  // Загрузка продуктов при первом запуске
  loadProducts();
  document.querySelector('[data-sort="priceHigh"]').classList.add('selected');
  dropdownButton.textContent = document.querySelector(
    '[data-sort="priceHigh"]'
  ).textContent;
});
