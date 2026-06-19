/* HEADER & NAVIGATION */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
const closeMenu = document.getElementById('closeMenu');
const navLinks = document.querySelectorAll('.nav-link-mobile');

hamburger.addEventListener('click', () => {
    navMobile.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    navMobile.classList.remove('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMobile.classList.remove('active');
    });
});

/* SECTION DETECTION FOR ACTIVE NAV LINKS */
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

/* READ MORE */
const readMoreBtn = document.getElementById('readMoreBtn');
const readMoreContent = document.getElementById('readMoreContent');

if (readMoreBtn && readMoreContent) {
    readMoreBtn.addEventListener('click', () => {
        readMoreContent.classList.toggle('expanded');
        readMoreBtn.textContent = readMoreContent.classList.contains('expanded') 
            ? 'Read Less' 
            : 'Read More';
    });
}

/* FAQ ACCORDION */
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

/* MODE CARDS - MOBILE ACCORDION */
const modeCards = document.querySelectorAll('.mode-card');

modeCards.forEach(card => {
    card.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            this.classList.toggle('expanded');
        }
    });
});

/* BLOG CAROUSEL */
const carouselContainer = document.getElementById('carouselContainer');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');

if (carouselContainer && carouselPrev && carouselNext) {
    function scrollCarousel(direction) {
        const isMobile = window.innerWidth <= 768;
        let scrollDistance;

        if (isMobile) {
            scrollDistance = carouselContainer.offsetWidth;
        } else {
            scrollDistance = 304;
        }

        const newScrollLeft = direction === 'next' 
            ? carouselContainer.scrollLeft + scrollDistance
            : carouselContainer.scrollLeft - scrollDistance;

        carouselContainer.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    }

    carouselNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollCarousel('next');
    });

    carouselPrev.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollCarousel('prev');
    });

    /* TOUCH/SWIPE */
    let touchStartX = 0;
    let touchEndX = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
    }, false);

    carouselContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const swipeThreshold = 50;
        const difference = touchStartX - touchEndX;

        if (Math.abs(difference) > swipeThreshold) {
            if (difference > 0) {
                scrollCarousel('next');
            } else {
                scrollCarousel('prev');
            }
        }
    }
}

/* INQUIRY FORM */
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
                b.classList.remove('active');
            });
        } else if (selectType === 'mode') {
            selectedMode = value;
            document.querySelectorAll('[data-select="mode"]').forEach(b => {
                b.classList.remove('active');
            });
        }

        btn.classList.add('active');
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

/* UTILITY FUNCTIONS */
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = 120;
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

window.scrollToSection = scrollToSection;
