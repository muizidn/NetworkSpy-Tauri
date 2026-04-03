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

// Installation Logic
const origin = window.location.origin;
const commands = {
    unix: `curl -fsSL ${origin}/install.sh | bash`,
    win: `iwr -useb ${origin}/install.ps1 | iex`
};

const installCommand = document.getElementById('install-command');
const copyBtn = document.getElementById('copy-command');
const tabs = document.querySelectorAll('.os-tab');

function setOS(os) {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-os="${os}"]`)?.classList.add('active');
    if (installCommand) installCommand.textContent = commands[os];
}

// Detect OS
const userAgent = window.navigator.userAgent.toLowerCase();
if (userAgent.indexOf('win') !== -1) {
    setOS('win');
} else {
    setOS('unix');
}

// OS Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setOS(tab.dataset.os);
    });
});

// Copy to Clipboard
copyBtn?.addEventListener('click', async () => {
    const text = installCommand.textContent.trim();
    try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('success');
        copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        
        setTimeout(() => {
            copyBtn.classList.remove('success');
            copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
});
