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
        initFormValidation();
        initModal();
        initFloatingWidget();
        bindDynamicContent();
        document.addEventListener('cms:ready', bindDynamicContent);
        setTimeout(function() {
            if (!window.AtelierNovaCMS) bindDynamicContent();
        }, 1200);
    });

    function bindDynamicContent() {
        initPortfolioFilter();
        initCareerApply();
    }

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
            if (button.dataset.bound === '1') return;
            button.dataset.bound = '1';
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
            if (item.dataset.clickBound === '1') return;
            item.dataset.clickBound = '1';
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
        const fromCms = (window.AtelierNovaCMS && window.AtelierNovaCMS.projects || []).find(function(p) {
            return p.title === title;
        });
        const projectImage = (fromCms && fromCms.image) || 'assets/images/project1.jpg';
        const projectData = fromCms ? {
            title: fromCms.title,
            location: fromCms.location,
            category: fromCms.category || category,
            description: fromCms.description,
            features: fromCms.features || [],
            year: fromCms.year || '2023',
            area: fromCms.area || '',
            status: fromCms.status || 'Completed',
            client: fromCms.client || 'Confidential',
            duration: fromCms.duration || ''
        } : {
            title: title,
            location: location,
            category: category,
            description: `This is a detailed description of the ${title} project located in ${location}.`,
            features: [],
            year: '2023',
            area: '',
            status: 'Completed',
            client: 'Confidential',
            duration: ''
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
        fetch('api/index.php?r=inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                project_type: formData.project_type,
                project_location: formData.project_location,
                budget: formData.budget_range,
                description: formData.description,
                contact_method: formData.preferred_contact_method
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(json) {
            if (!json.ok) throw new Error(json.error || 'Could not send inquiry');
            showSuccessMessage();
            resetForm();
        })
        .catch(function(err) {
            alert(err.message || 'Could not send your inquiry. Please try again.');
        });
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
    window.AtelierNova = {
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
        if (emailDirectlyBtn && emailDirectlyBtn.dataset.bound !== '1') {
            emailDirectlyBtn.dataset.bound = '1';
            emailDirectlyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const emailBody = [
                    'General Application Inquiry',
                    '',
                    'Dear Atelier Nova Team,',
                    '',
                    'I am interested in career opportunities with Atelier Nova.',
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
                    to: 'hello@ateliernova.demo',
                    subject: 'General Application - Atelier Nova',
                    body: emailBody
                });

                window.location.href = mailto;
            });
        }

        // Handle Send Your Resume button
        if (sendResumeBtn && sendResumeBtn.dataset.bound !== '1') {
            sendResumeBtn.dataset.bound = '1';
            sendResumeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const emailBody = [
                    'Resume Submission - General Application',
                    '',
                    'Dear Atelier Nova Team,',
                    '',
                    'I am interested in future career opportunities with Atelier Nova.',
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
                    to: 'hello@ateliernova.demo',
                    subject: 'Resume Submission - General Application',
                    body: emailBody
                });

                window.location.href = mailto;
            });
        }

        if (!applyButtons.length || !applicationForm || !positionField) return;

        applyButtons.forEach(btn => {
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';
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

        if (applicationForm.dataset.bound === '1') return;
        applicationForm.dataset.bound = '1';

        applicationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const name = document.getElementById('applicantName')?.value.trim() || '';
            const email = document.getElementById('applicantEmail')?.value.trim() || '';
            const phone = document.getElementById('applicantPhone')?.value.trim() || '';
            const position = positionField.value.trim();
            const portfolio = document.getElementById('portfolioLink')?.value.trim() || '';
            const message = document.getElementById('coverMessage')?.value.trim() || '';

            if (!name || !email || !phone || !position || !message) {
                alert('Please fill in all required fields marked with *.');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('applicantEmail').focus();
                return false;
            }

            fetch('api/index.php?r=apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, position, portfolio, message })
            })
            .then(function(res) { return res.json(); })
            .then(function(json) {
                if (!json.ok) throw new Error(json.error || 'Could not send application');
                alert('Your application was sent. We will contact you soon.');
                applicationForm.reset();
            })
            .catch(function(err) {
                alert(err.message || 'Could not send your application.');
            });
            
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
