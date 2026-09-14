// Course Registration System - Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('registration-form');
    const formTitle = document.getElementById('form-title');
    const formCard = document.querySelector('.form-card');
    const regIdInput = document.getElementById('reg-id');
    const studentIdInput = document.getElementById('student_id');
    const studentNameInput = document.getElementById('student_name');
    const emailInput = document.getElementById('email');
    const departmentSelect = document.getElementById('department');
    const yearSelect = document.getElementById('year');
    const courseNameInput = document.getElementById('course_name');
    const courseCodeInput = document.getElementById('course_code');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = document.getElementById('submit-btn-text');
    const cancelBtn = document.getElementById('cancel-btn');
    const searchInput = document.getElementById('search-input');
    const registrationsTbody = document.getElementById('registrations-tbody');
    const registrationCount = document.getElementById('registration-count');
    const emptyState = document.getElementById('empty-state');
    const loadingState = document.getElementById('loading-state');
    const notificationArea = document.getElementById('notification-area');

    // Modal elements
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalText = document.getElementById('confirm-modal-text');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    let allRegistrations = [];
    let pendingDeleteId = null;

    const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    // Initialize
    loadRegistrations();

    // -------------------------------------------------------------
    // Alerts and Notifications
    // -------------------------------------------------------------
    function showNotification(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;

        const icon = type === 'success' ? '✅' : '⚠️';
        alert.innerHTML = `
            <div>
                <strong>${icon}</strong> ${escapeHtml(message)}
            </div>
            <button type="button" class="alert-close" aria-label="Close">&times;</button>
        `;

        const closeBtn = alert.querySelector('.alert-close');
        closeBtn.addEventListener('click', () => {
            alert.remove();
        });

        notificationArea.prepend(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.isConnected) {
                alert.style.transition = 'opacity 0.4s ease';
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 400);
            }
        }, 5000);
    }

    // -------------------------------------------------------------
    // Form Validation Helpers
    // -------------------------------------------------------------
    function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    function setFieldError(inputEl, errorId, message) {
        inputEl.classList.add('is-invalid');
        const errorEl = document.getElementById(errorId);
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    function validateForm() {
        clearErrors();
        let isValid = true;

        if (!studentIdInput.value.trim()) {
            setFieldError(studentIdInput, 'error-student_id', 'Student ID is required.');
            isValid = false;
        }

        if (!studentNameInput.value.trim()) {
            setFieldError(studentNameInput, 'error-student_name', 'Student Name is required.');
            isValid = false;
        }

        const emailVal = emailInput.value.trim();
        if (!emailVal) {
            setFieldError(emailInput, 'error-email', 'College Email is required.');
            isValid = false;
        } else if (!EMAIL_REGEX.test(emailVal)) {
            setFieldError(emailInput, 'error-email', 'Please provide a valid email format (e.g. name@college.edu).');
            isValid = false;
        }

        if (!departmentSelect.value) {
            setFieldError(departmentSelect, 'error-department', 'Please select a department.');
            isValid = false;
        }

        if (!yearSelect.value) {
            setFieldError(yearSelect, 'error-year', 'Please select an academic year.');
            isValid = false;
        }

        if (!courseNameInput.value.trim()) {
            setFieldError(courseNameInput, 'error-course_name', 'Course Name is required.');
            isValid = false;
        }

        if (!courseCodeInput.value.trim()) {
            setFieldError(courseCodeInput, 'error-course_code', 'Course Code is required.');
            isValid = false;
        }

        return isValid;
    }

    // -------------------------------------------------------------
    // API: READ ALL REGISTRATIONS
    // -------------------------------------------------------------
    async function loadRegistrations() {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';

        try {
            const response = await fetch('/api/registrations');
            const result = await response.json();

            if (response.ok && result.success) {
                allRegistrations = result.data;
                applyCurrentFilter();
            } else {
                showNotification(result.error || 'Failed to load registrations.', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Network error while fetching registrations.', 'error');
        } finally {
            loadingState.style.display = 'none';
        }
    }

    // -------------------------------------------------------------
    // Render Table
    // -------------------------------------------------------------
    function renderRegistrationsTable(data) {
        registrationsTbody.innerHTML = '';
        registrationCount.textContent = data.length;

        if (data.length === 0) {
            const query = searchInput.value.trim();
            if (query) {
                emptyState.querySelector('h3').textContent = 'No Matching Registrations';
                emptyState.querySelector('p').textContent = `No course registrations found matching "${escapeHtml(query)}". Try clearing your search.`;
            } else {
                emptyState.querySelector('h3').textContent = 'No Registrations Found';
                emptyState.querySelector('p').textContent = 'There are currently no active course registrations. Fill out the form on the left to add one.';
            }
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        data.forEach((reg, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td><span class="student-id-tag">${escapeHtml(reg.student_id)}</span></td>
                <td>
                    <div class="student-info">${escapeHtml(reg.student_name)}</div>
                </td>
                <td><a href="mailto:${escapeHtml(reg.email)}" style="color: var(--accent); text-decoration: none;">${escapeHtml(reg.email)}</a></td>
                <td><span class="badge badge-dept">${escapeHtml(reg.department)}</span></td>
                <td><span class="badge badge-year">${escapeHtml(reg.year)}</span></td>
                <td><span class="course-name-cell">${escapeHtml(reg.course_name)}</span></td>
                <td><span class="course-code-badge">${escapeHtml(reg.course_code)}</span></td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button type="button" class="btn btn-sm btn-edit" data-id="${reg.id}" title="Edit Registration">
                            ✏️ Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-delete" data-id="${reg.id}" data-name="${escapeHtml(reg.student_name)}" data-course="${escapeHtml(reg.course_code)}" title="Delete Registration">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            `;

            registrationsTbody.appendChild(tr);
        });

        // Attach action handlers
        attachActionListeners();
    }

    function attachActionListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                startEdit(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const studentName = btn.getAttribute('data-name');
                const courseCode = btn.getAttribute('data-course');
                promptDelete(id, studentName, courseCode);
            });
        });
    }

    // -------------------------------------------------------------
    // API: CREATE & UPDATE
    // -------------------------------------------------------------
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Please fill in all required fields properly.', 'error');
            return;
        }

        const regId = regIdInput.value.trim();
        const isEditing = Boolean(regId);

        const payload = {
            student_id: studentIdInput.value.trim(),
            student_name: studentNameInput.value.trim(),
            email: emailInput.value.trim(),
            department: departmentSelect.value,
            year: yearSelect.value,
            course_name: courseNameInput.value.trim(),
            course_code: courseCodeInput.value.trim()
        };

        submitBtn.disabled = true;
        const originalBtnText = submitBtnText.textContent;
        submitBtnText.textContent = isEditing ? 'Updating...' : 'Registering...';

        try {
            const url = isEditing ? `/api/registrations/${regId}` : '/api/registrations';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showNotification(result.message || (isEditing ? 'Registration updated!' : 'Course registered successfully!'), 'success');
                resetForm();
                await loadRegistrations();
            } else {
                showNotification(result.error || 'Failed to save registration.', 'error');
                submitBtnText.textContent = originalBtnText;
            }
        } catch (err) {
            console.error(err);
            showNotification('An unexpected network error occurred.', 'error');
            submitBtnText.textContent = originalBtnText;
        } finally {
            submitBtn.disabled = false;
        }
    });

    function ensureSelectOption(selectEl, value) {
        if (!value) return;
        const exists = Array.from(selectEl.options).some(opt => opt.value === value);
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            selectEl.appendChild(opt);
        }
        selectEl.value = value;
    }

    // -------------------------------------------------------------
    // API: READ SINGLE (FOR EDIT)
    // -------------------------------------------------------------
    async function startEdit(id) {
        clearErrors();
        try {
            const response = await fetch(`/api/registrations/${id}`);
            const result = await response.json();

            if (response.ok && result.success) {
                const reg = result.data;
                regIdInput.value = reg.id;
                studentIdInput.value = reg.student_id;
                studentNameInput.value = reg.student_name;
                emailInput.value = reg.email;
                ensureSelectOption(departmentSelect, reg.department);
                ensureSelectOption(yearSelect, reg.year);
                courseNameInput.value = reg.course_name;
                courseCodeInput.value = reg.course_code;

                // Update UI state for editing
                formTitle.textContent = `Edit Registration #${reg.id}`;
                submitBtnText.textContent = 'Update Registration';
                cancelBtn.style.display = 'inline-flex';
                formCard.classList.add('edit-mode');

                // Smooth scroll to form and focus
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                studentIdInput.focus();
            } else {
                showNotification(result.error || 'Could not load registration for editing.', 'error');
            }
        } catch (err) {
            console.error(err);
            showNotification('Failed to fetch registration details.', 'error');
        }
    }

    function resetForm() {
        form.reset();
        regIdInput.value = '';
        departmentSelect.selectedIndex = 0;
        yearSelect.selectedIndex = 0;
        formTitle.textContent = 'Register New Course';
        submitBtnText.textContent = 'Register Course';
        cancelBtn.style.display = 'none';
        formCard.classList.remove('edit-mode');
        clearErrors();
    }

    cancelBtn.addEventListener('click', resetForm);

    // -------------------------------------------------------------
    // API: DELETE CONFIRMATION & EXECUTION
    // -------------------------------------------------------------
    function promptDelete(id, studentName, courseCode) {
        pendingDeleteId = id;
        confirmModalText.innerHTML = `Are you sure you want to delete registration for <strong>${escapeHtml(studentName)}</strong> in course <strong>${escapeHtml(courseCode)}</strong>?`;
        confirmModal.style.display = 'flex';
    }

    function closeModal() {
        confirmModal.style.display = 'none';
        pendingDeleteId = null;
    }

    modalCancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside dialog
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            closeModal();
        }
    });

    modalConfirmBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;

        modalConfirmBtn.disabled = true;
        modalConfirmBtn.textContent = 'Deleting...';

        try {
            const response = await fetch(`/api/registrations/${pendingDeleteId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showNotification(result.message || 'Registration deleted successfully.', 'success');
                // If the item currently being edited was deleted, reset form
                if (regIdInput.value === String(pendingDeleteId)) {
                    resetForm();
                }
                closeModal();
                await loadRegistrations();
            } else {
                showNotification(result.error || 'Failed to delete registration.', 'error');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            showNotification('Network error while deleting registration.', 'error');
            closeModal();
        } finally {
            modalConfirmBtn.disabled = false;
            modalConfirmBtn.textContent = 'Delete Registration';
        }
    });

    // -------------------------------------------------------------
    // Live Search Filter
    // -------------------------------------------------------------
    function applyCurrentFilter() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            renderRegistrationsTable(allRegistrations);
            return;
        }

        const filtered = allRegistrations.filter(reg => {
            return (
                (reg.student_id && reg.student_id.toLowerCase().includes(query)) ||
                (reg.student_name && reg.student_name.toLowerCase().includes(query)) ||
                (reg.email && reg.email.toLowerCase().includes(query)) ||
                (reg.department && reg.department.toLowerCase().includes(query)) ||
                (reg.year && reg.year.toLowerCase().includes(query)) ||
                (reg.course_name && reg.course_name.toLowerCase().includes(query)) ||
                (reg.course_code && reg.course_code.toLowerCase().includes(query))
            );
        });

        renderRegistrationsTable(filtered);
    }

    searchInput.addEventListener('input', applyCurrentFilter);

    // -------------------------------------------------------------
    // Utility: XSS prevention
    // -------------------------------------------------------------
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
