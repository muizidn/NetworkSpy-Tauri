// Intersection Observer for reveal animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Add a slight stagger delay if data-delay is present
            const delay = entry.target.dataset.delay;
            if (delay) {
                entry.target.style.transitionDelay = delay;
            }
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
});

// Header scroll effect
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.style.background = 'rgba(15, 23, 42, 0.8)';
        header.style.top = '0';
        header.style.width = '100%';
        header.style.borderRadius = '0';
    } else {
        header.style.background = 'rgba(15, 23, 42, 0.1)';
        header.style.top = '1rem';
        header.style.width = '90%';
        header.style.borderRadius = '999px';
    }
});
