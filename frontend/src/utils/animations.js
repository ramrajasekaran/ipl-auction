import gsap from 'gsap';

// Framer Motion Variants
export const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
        },
    },
};

export const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
        },
    },
};

export const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
};

// GSAP Animations

// Bid pulse animation
export const animateBidPulse = (element) => {
    gsap.fromTo(
        element,
        { scale: 1 },
        {
            scale: 1.15,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
        }
    );
};

// Hammer animation for SOLD/UNSOLD
export const animateHammer = (element, onComplete) => {
    const tl = gsap.timeline({ onComplete });

    tl.to(element, {
        scale: 1.2,
        rotation: -10,
        duration: 0.15,
        ease: 'power2.out',
    })
        .to(element, {
            scale: 1.3,
            rotation: 10,
            duration: 0.15,
            ease: 'power2.out',
        })
        .to(element, {
            scale: 1.2,
            rotation: -5,
            duration: 0.1,
            ease: 'power2.out',
        })
        .to(element, {
            scale: 1,
            rotation: 0,
            duration: 0.2,
            ease: 'elastic.out(1, 0.5)',
        });
};

// Countdown urgency animation
export const animateCountdownUrgent = (element) => {
    gsap.fromTo(
        element,
        { scale: 1, color: '#EF4444' },
        {
            scale: 1.1,
            color: '#DC2626',
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: 'power1.inOut',
        }
    );
};

// Stop countdown animation
export const stopCountdownAnimation = (element) => {
    gsap.killTweensOf(element);
    gsap.to(element, { scale: 1, duration: 0.2 });
};

// Glow effect animation
export const animateGlow = (element, color = '14, 165, 233') => {
    gsap.to(element, {
        boxShadow: `0 0 40px rgba(${color}, 0.8)`,
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
    });
};

// Number count-up animation
export const animateNumberCountUp = (element, from, to, duration = 1) => {
    const obj = { value: from };

    gsap.to(obj, {
        value: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
            element.textContent = Math.floor(obj.value);
        },
    });
};

// Shake animation for errors
export const animateShake = (element) => {
    gsap.fromTo(
        element,
        { x: 0 },
        {
            x: -10,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: 'power1.inOut',
        }
    );
};

// Slide in from bottom
export const animateSlideInBottom = (element, delay = 0) => {
    gsap.fromTo(
        element,
        { y: 100, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay,
            ease: 'power3.out',
        }
    );
};

// Slide in from left
export const animateSlideInLeft = (element, delay = 0) => {
    gsap.fromTo(
        element,
        { x: -100, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 0.5,
            delay,
            ease: 'power3.out',
        }
    );
};

// Slide in from right
export const animateSlideInRight = (element, delay = 0) => {
    gsap.fromTo(
        element,
        { x: 100, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            duration: 0.5,
            delay,
            ease: 'power3.out',
        }
    );
};

// Fade in
export const animateFadeIn = (element, delay = 0) => {
    gsap.fromTo(
        element,
        { opacity: 0 },
        {
            opacity: 1,
            duration: 0.5,
            delay,
            ease: 'power2.out',
        }
    );
};

// Check device performance for animation intensity
export const shouldReduceAnimations = () => {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return true;
    }

    // Check for low-end mobile devices (simple heuristic)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

    return isMobile && hasLowMemory;
};
