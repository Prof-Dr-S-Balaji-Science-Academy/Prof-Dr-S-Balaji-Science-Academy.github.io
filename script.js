/* ===== HEADER & NAVIGATION ===== */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
const closeMenu = document.getElementById('closeMenu');
const navLinks = document.querySelectorAll('.nav-link-mobile');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMobile.classList.add('active');
    });
}

if (closeMenu) {
    closeMenu.addEventListener('click', () => {
        navMobile.classList.remove('active');
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMobile.classList.remove('active');
    });
});

/* ===== READ MORE BUTTON ===== */
const readMoreBtn = document.getElementById('readMoreBtn');
const readMoreContent = document.getElementById('readMoreContent');

if (readMoreBtn && readMoreContent) {
    readMoreBtn.addEventListener('click', () => {
        readMoreContent.classList.toggle('show');
        readMoreBtn.textContent = readMoreContent.classList.contains('show') 
            ? 'Read Less' 
            : 'Read More';
    });
}

/* ===== FAQ ACCORDION ===== */
const faqQuestions = document.querySelectorAll('.faq-question');
const faqFilters = document.querySelectorAll('.faq-filter-btn');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

faqFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-filter');
        
        faqFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.add('hidden');
        });
        
        document.querySelectorAll(`.faq-item[data-category="${category}"]`).forEach(item => {
            item.classList.remove('hidden');
        });
    });
});

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById('contactForm');
const formBtns = document.querySelectorAll('.form-btn');
const submitBtn = document.getElementById('submitBtn');

let selectedBoard = null;
let selectedMode = null;

formBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const selectType = btn.getAttribute('data-select');
        const value = btn.getAttribute('data-value');

        if (selectType === 'board') {
            selectedBoard = value;
            document.querySelectorAll('[data-select="board"]').forEach(b => {
                b.classList.remove('selected');
            });
        } else if (selectType === 'mode') {
            selectedMode = value;
            document.querySelectorAll('[data-select="mode"]').forEach(b => {
                b.classList.remove('selected');
            });
        }

        btn.classList.add('selected');
        checkFormComplete();
    });
});

function checkFormComplete() {
    if (selectedBoard && selectedMode) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!selectedBoard || !selectedMode) return;

        const messages = {
            'cbse-classroom': 'I am interested in the Class 12 CBSE Classroom batch',
            'cbse-online': 'I am interested in the Class 12 CBSE Online batch',
            'cbse-hybrid': 'I am interested in the Class 12 CBSE Hybrid batch',
            'tnboard-classroom': 'I am interested in the Class 12 TN State Board Classroom batch',
            'tnboard-online': 'I am interested in the Class 12 TN State Board Online batch',
            'tnboard-hybrid': 'I am interested in the Class 12 TN State Board Hybrid batch'
        };

        const messageKey = `${selectedBoard}-${selectedMode}`;
        const message = messages[messageKey] || 'Hi, I am interested in your classes';
        const whatsappLink = `https://wa.me/919787692116?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappLink, '_blank');
    });
}
