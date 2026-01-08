/* ============================================
   ARRAY ARCHITECTS - MAIN JAVASCRIPT
   Clean, Modular, Laravel-Ready Code
   ============================================ */

(function() {
    'use strict';

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initNavbar();
        initSmoothScroll();
        initPortfolioFilter();
        initFormValidation();
        initModal();
        initFloatingWidget();
        initCareerApply();
    });

    // ===== NAVBAR FUNCTIONALITY =====
    function initNavbar() {
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        // Add scrolled class on scroll
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Set active nav link based on current page
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === '' && linkHref === 'index.html') ||
                (currentPage === 'index.html' && linkHref === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ===== SMOOTH SCROLL =====
    function initSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const offsetTop = target.offsetTop - 80; // Account for sticky navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // ===== PORTFOLIO FILTER =====
    function initPortfolioFilter() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        const portfolioGrid = document.getElementById('portfolioGrid');

        if (!filterButtons.length || !portfolioItems.length) return;

        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');

                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                // Filter portfolio items
                portfolioItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = 'block';
                        // Fade in animation
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });

        // Add click handler to portfolio items for modal
        portfolioItems.forEach(item => {
            item.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                const title = this.querySelector('.portfolio-overlay h4')?.textContent || 'Project Title';
                const location = this.querySelector('.portfolio-overlay p')?.textContent || 'Location';
                openProjectModal(title, location, category);
            });
        });
    }

    // ===== MODAL FUNCTIONALITY =====
    function initModal() {
        const modal = document.getElementById('projectModal');
        const modalClose = document.getElementById('modalClose');

        if (!modal) return;

        // Close modal on X click
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        // Close modal on outside click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close modal on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    }

    function openProjectModal(title, location, category) {
        const modal = document.getElementById('projectModal');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalBody) return;

        // Map project titles to images
        const projectImages = {
            'Modern Residential Complex': 'assets/images/project1.jpg',
            'Luxury Villa Design': 'assets/images/project2_1.jpg',
            'Apartment Building': 'assets/images/project2_2.jpg',
            'Corporate Headquarters': 'assets/images/project2.jpg',
            'Retail Complex': 'assets/images/banner1.jpg',
            'Boutique Hotel': 'assets/images/banner2.jpg',
            'Educational Campus': 'assets/images/banner3.jpg',
            'Medical Facility': 'assets/images/banner4.jpg',
            'Modern Office Interior': 'assets/images/project2_1.jpg',
            'Luxury Residence Interior': 'assets/images/project2_2.jpg',
            'Restaurant Design': 'assets/images/project1.jpg'
        };

        const projectImage = projectImages[title] || 'assets/images/project1.jpg';

        // Project data (in Laravel, this would come from API/database)
        const projectData = {
            title: title,
            location: location,
            category: category,
            description: `This is a detailed description of the ${title} project located in ${location}. The project showcases our expertise in ${category} design, featuring innovative solutions, sustainable practices, and exceptional attention to detail. Our team worked closely with the client to deliver a space that perfectly balances functionality, aesthetics, and sustainability.`,
            features: [
                'Modern architectural design',
                'Sustainable building practices',
                'Energy-efficient systems',
                'Premium materials and finishes',
                'Comprehensive project management',
                'Client-focused approach'
            ],
            year: '2023',
            area: '5,000 sq ft',
            status: 'Completed',
            client: 'Confidential',
            duration: '12 months'
        };

        // Build modal content
        modalBody.innerHTML = `
            <div class="project-modal-content">
                <div class="project-modal-image">
                    <img src="${projectImage}" alt="${projectData.title}">
                    <div class="project-modal-overlay"></div>
                </div>
                <div class="project-modal-header">
                    <div class="project-modal-badge">${projectData.category.charAt(0).toUpperCase() + projectData.category.slice(1)}</div>
                    <h2 class="project-modal-title">${projectData.title}</h2>
                    <p class="project-modal-location"><i class="fas fa-map-marker-alt"></i> ${projectData.location}</p>
                </div>
                <div class="project-modal-info">
                    <div class="project-info-item">
                        <div class="info-icon"><i class="fas fa-calendar"></i></div>
                        <div class="info-content">
                            <div class="info-label">Year</div>
                            <div class="info-value">${projectData.year}</div>
                        </div>
                    </div>
                    <div class="project-info-item">
                        <div class="info-icon"><i class="fas fa-ruler-combined"></i></div>
                        <div class="info-content">
                            <div class="info-label">Area</div>
                            <div class="info-value">${projectData.area}</div>
                        </div>
                    </div>
                    <div class="project-info-item">
                        <div class="info-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="info-content">
                            <div class="info-label">Status</div>
                            <div class="info-value">${projectData.status}</div>
                        </div>
                    </div>
                    <div class="project-info-item">
                        <div class="info-icon"><i class="fas fa-clock"></i></div>
                        <div class="info-content">
                            <div class="info-label">Duration</div>
                            <div class="info-value">${projectData.duration}</div>
                        </div>
                    </div>
                </div>
                <div class="project-modal-description">
                    <h4><i class="fas fa-info-circle"></i> Project Description</h4>
                    <p>${projectData.description}</p>
                </div>
                <div class="project-modal-features">
                    <h4><i class="fas fa-star"></i> Key Features</h4>
                    <div class="features-grid">
                        ${projectData.features.map(feature => `
                            <div class="feature-item">
                                <i class="fas fa-check"></i>
                                <span>${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="project-modal-actions">
                    <a href="contact.html" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        <span>Start Similar Project</span>
                    </a>
                    <button onclick="closeModal()" class="btn btn-outline">
                        <i class="fas fa-times"></i>
                        <span>Close</span>
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // Make closeModal globally available
    window.closeModal = closeModal;

    // ===== FORM VALIDATION =====
    function initFormValidation() {
        const form = document.getElementById('projectInquiryForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                // Form is valid - prepare data for submission
                const formData = collectFormData();
                
                // In Laravel, this would be sent via fetch/axios to API endpoint
                // For now, we'll simulate success
                submitForm(formData);
            }
        });

        // Real-time validation on blur
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                // Clear error on input
                if (this.classList.contains('error')) {
                    clearFieldError(this);
                }
            });
        });
    }

    function validateForm() {
        const form = document.getElementById('projectInquiryForm');
        let isValid = true;

        // Required fields
        const requiredFields = [
            { id: 'fullName', errorId: 'fullNameError', validator: validateName },
            { id: 'email', errorId: 'emailError', validator: validateEmail },
            { id: 'phone', errorId: 'phoneError', validator: validatePhone },
            { id: 'projectType', errorId: 'projectTypeError', validator: validateSelect },
            { id: 'projectLocation', errorId: 'projectLocationError', validator: validateText },
            { id: 'projectDescription', errorId: 'projectDescriptionError', validator: validateText },
            { id: 'contactMethod', errorId: 'contactMethodError', validator: validateSelect }
        ];

        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!field.validator(input)) {
                showFieldError(input, field.errorId);
                isValid = false;
            } else {
                clearFieldError(input);
            }
        });

        return isValid;
    }

    function validateField(field) {
        const fieldId = field.id;
        let isValid = false;

        switch(fieldId) {
            case 'fullName':
                isValid = validateName(field);
                if (!isValid) showFieldError(field, 'fullNameError');
                else clearFieldError(field);
                break;
            case 'email':
                isValid = validateEmail(field);
                if (!isValid) showFieldError(field, 'emailError');
                else clearFieldError(field);
                break;
            case 'phone':
                isValid = validatePhone(field);
                if (!isValid) showFieldError(field, 'phoneError');
                else clearFieldError(field);
                break;
            case 'projectType':
            case 'contactMethod':
                isValid = validateSelect(field);
                if (!isValid) showFieldError(field, fieldId + 'Error');
                else clearFieldError(field);
                break;
            case 'projectLocation':
            case 'projectDescription':
                isValid = validateText(field);
                if (!isValid) showFieldError(field, fieldId + 'Error');
                else clearFieldError(field);
                break;
        }
    }

    // Validation functions
    function validateName(field) {
        return field.value.trim().length >= 2;
    }

    function validateEmail(field) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(field.value);
    }

    function validatePhone(field) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(field.value) && field.value.trim().length >= 10;
    }

    function validateSelect(field) {
        return field.value !== '';
    }

    function validateText(field) {
        return field.value.trim().length >= 10;
    }

    function showFieldError(field, errorId) {
        field.classList.add('error');
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.classList.add('show');
        }
    }

    function clearFieldError(field) {
        field.classList.remove('error');
        const fieldId = field.id;
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    function collectFormData() {
        const form = document.getElementById('projectInquiryForm');
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            projectType: document.getElementById('projectType').value,
            projectLocation: document.getElementById('projectLocation').value.trim(),
            budget: document.getElementById('budget').value,
            projectDescription: document.getElementById('projectDescription').value.trim(),
            contactMethod: document.getElementById('contactMethod').value,
            submittedAt: new Date().toISOString()
        };

        // Laravel-ready structure
        return {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            project_type: formData.projectType,
            project_location: formData.projectLocation,
            budget_range: formData.budget,
            description: formData.projectDescription,
            preferred_contact_method: formData.contactMethod,
            created_at: formData.submittedAt
        };
    }

    function submitForm(formData) {
        // In Laravel, this would be:
        // fetch('/api/inquiries', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // })
        // .then(response => response.json())
        // .then(data => { showSuccess(); resetForm(); })
        // .catch(error => { showError(); });

        // Simulate API call
        setTimeout(() => {
            showSuccessMessage();
            resetForm();
            
            // Scroll to success message
            const successMsg = document.getElementById('successMessage');
            if (successMsg) {
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }

    function showSuccessMessage() {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.classList.add('show');
            setTimeout(() => {
                successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    function resetForm() {
        const form = document.getElementById('projectInquiryForm');
        if (form) {
            form.reset();
            // Clear all errors
            form.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });
            form.querySelectorAll('.error-message').forEach(error => {
                error.classList.remove('show');
            });
        }
    }

    // ===== FLOATING CONTACT WIDGET =====
    function initFloatingWidget() {
        const floatingWidget = document.querySelector('.floating-contact');
        if (!floatingWidget) return;

        // Show/hide on scroll (optional enhancement)
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 300) {
                floatingWidget.style.opacity = '1';
                floatingWidget.style.visibility = 'visible';
            } else {
                floatingWidget.style.opacity = '0.8';
            }
            
            lastScroll = currentScroll;
        });

        // Initial visibility
        if (window.pageYOffset > 300) {
            floatingWidget.style.opacity = '1';
            floatingWidget.style.visibility = 'visible';
        }
    }

    // ===== UTILITY FUNCTIONS =====
    
    // Debounce function for performance optimization
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll events
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Export functions for Laravel integration (if needed)
    window.ArrayArchitects = {
        validateForm: validateForm,
        collectFormData: collectFormData,
        openProjectModal: openProjectModal,
        closeModal: closeModal
    };

    // ===== CAREERS APPLY HANDLER =====
    function initCareerApply() {
        const applyButtons = document.querySelectorAll('.apply-btn');
        const applicationForm = document.getElementById('careerApplicationForm');
        const positionField = document.getElementById('applicantPosition');
        const emailDirectlyBtn = document.getElementById('emailDirectlyBtn');
        const sendResumeBtn = document.getElementById('sendResumeBtn');

        // Handle Email Directly button
        if (emailDirectlyBtn) {
            emailDirectlyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const emailBody = [
                    'General Application Inquiry',
                    '',
                    'Dear Array Architects Team,',
                    '',
                    'I am interested in career opportunities with Array Architects.',
                    '',
                    'Please find my details below:',
                    '',
                    'Name: [Your Name]',
                    'Email: [Your Email]',
                    'Phone: [Your Phone]',
                    'Position of Interest: [Position]',
                    '',
                    'I have attached my resume and portfolio for your review.',
                    '',
                    'Thank you for considering my application.',
                    '',
                    'Best regards,',
                    '[Your Name]'
                ].join('\n');

                const mailto = buildMailto({
                    to: 'arrayarchitectsbd@gmail.com',
                    subject: 'General Application - Array Architects',
                    body: emailBody
                });

                window.location.href = mailto;
            });
        }

        // Handle Send Your Resume button
        if (sendResumeBtn) {
            sendResumeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const emailBody = [
                    'Resume Submission - General Application',
                    '',
                    'Dear Array Architects Team,',
                    '',
                    'I am interested in future career opportunities with Array Architects.',
                    '',
                    'Please find my resume and portfolio attached.',
                    '',
                    'I would appreciate being considered for any suitable positions that may become available.',
                    '',
                    'Thank you for your time and consideration.',
                    '',
                    'Best regards,',
                    '[Your Name]',
                    '[Your Email]',
                    '[Your Phone]'
                ].join('\n');

                const mailto = buildMailto({
                    to: 'arrayarchitectsbd@gmail.com',
                    subject: 'Resume Submission - General Application',
                    body: emailBody
                });

                window.location.href = mailto;
            });
        }

        if (!applyButtons.length || !applicationForm || !positionField) return;

        applyButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const jobTitle = this.getAttribute('data-job') || '';
                positionField.value = jobTitle;
                const target = document.getElementById('apply-now');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                positionField.focus();
            });
        });

        applicationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const name = document.getElementById('applicantName')?.value.trim() || '';
            const email = document.getElementById('applicantEmail')?.value.trim() || '';
            const phone = document.getElementById('applicantPhone')?.value.trim() || '';
            const position = positionField.value.trim();
            const portfolio = document.getElementById('portfolioLink')?.value.trim() || '';
            const message = document.getElementById('coverMessage')?.value.trim() || '';

            // Validate required fields
            if (!name || !email || !phone || !position || !message) {
                alert('Please fill in all required fields marked with *.');
                return false;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('applicantEmail').focus();
                return false;
            }

            // Build email body
            const emailBody = [
                'Job Application Submission',
                '',
                'Personal Information:',
                `Name: ${name}`,
                `Email: ${email}`,
                `Phone/WhatsApp: ${phone}`,
                '',
                'Application Details:',
                `Position Applied For: ${position}`,
                portfolio ? `Portfolio/Drive Link: ${portfolio}` : 'Portfolio: Not provided',
                '',
                'Cover Message:',
                message,
                '',
                '---',
                'This application was submitted through the Array Architects website.'
            ].filter(Boolean).join('\n');

            const mailto = buildMailto({
                to: 'arrayarchitectsbd@gmail.com',
                subject: `Job Application: ${position}`,
                body: emailBody
            });

            // Open email client
            window.location.href = mailto;
            
            // Show success message
            setTimeout(() => {
                alert('Your email client should open now. Please send the email to complete your application.');
            }, 100);
            
            return false;
        });
    }

    function buildMailto({ to, subject, body }) {
        const params = [];
        if (subject) params.push('subject=' + encodeURIComponent(subject));
        if (body) params.push('body=' + encodeURIComponent(body));
        return `mailto:${to}?${params.join('&')}`;
    }

})();
