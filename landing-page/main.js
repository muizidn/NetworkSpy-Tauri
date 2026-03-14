// Intersection Observer for reveal animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
});

// Add some CSS dynamically for the active state of reveal
const style = document.createElement('style');
style.textContent = `
    .reveal {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.8s cubic-bezier(0.165, 0.84, 0.44, 1), transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    .reveal-active {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Sticky header shadow on scroll
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
        header.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});
