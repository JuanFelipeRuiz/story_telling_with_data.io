let modalOverlay = null;
let modalContent = null;

function toggleBlaualgenImage() {
  if (!modalOverlay) {
    createModal();
  }
  
  const modalImg = modalContent.querySelector('img');
  modalImg.src = 'images/plakat_verhaltensempfehlungen_blaualgen.jpeg';
  modalImg.alt = 'Plakat Verhaltensempfehlungen Blaualgen';
  
  showModal();
}

function createModal() {
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'blaualgen-modal-overlay';
  
  modalContent = document.createElement('div');
  modalContent.className = 'blaualgen-modal-content';
  
  const modalImg = document.createElement('img');
  modalImg.alt = 'Plakat Verhaltensempfehlungen Blaualgen';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'blaualgen-modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close modal');
  closeBtn.addEventListener('click', hideModal);
  
  modalContent.appendChild(modalImg);
  modalContent.appendChild(closeBtn);
  modalOverlay.appendChild(modalContent);
  
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      hideModal();
    }
  });
  
  document.body.appendChild(modalOverlay);
}

function showModal() {
  if (modalOverlay) {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const images = document.querySelectorAll('.blaualgen-image');
  images.forEach((img) => {
    img.addEventListener('click', toggleBlaualgenImage);
  });
});


