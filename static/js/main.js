/**
 * main.js - Main JavaScript file for Dar El Hayah Management System
 * Contains client-side functionality for enhancing user experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-close alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
    
    // Form validation enhancement
    var forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
    
    // Confirm delete actions
    var deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                event.preventDefault();
            }
        });
    });
    
    // Toggle password visibility
    var togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var targetInput = document.querySelector(button.getAttribute('data-target'));
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                button.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                targetInput.type = 'password';
                button.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
    
    // Print page functionality
    var printButtons = document.querySelectorAll('.btn-print');
    printButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            window.print();
        });
    });
    
    // Date range form handling
    var dateRangeForms = document.querySelectorAll('.date-range-form');
    dateRangeForms.forEach(function(form) {
        var startDateInput = form.querySelector('[name="start_date"]');
        var endDateInput = form.querySelector('[name="end_date"]');
        
        if (startDateInput && endDateInput) {
            endDateInput.addEventListener('change', function() {
                var startDate = new Date(startDateInput.value);
                var endDate = new Date(endDateInput.value);
                
                if (endDate < startDate) {
                    alert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
                    endDateInput.value = startDateInput.value;
                }
            });
        }
    });
    
    // Auto-calculate financial values
    function calculateAmount() {
        var quantityInput = document.querySelector('[name="quantity"]');
        var priceInput = document.querySelector('[name="price"]');
        var totalInput = document.querySelector('[name="total"]');
        
        if (quantityInput && priceInput && totalInput) {
            var quantity = parseFloat(quantityInput.value) || 0;
            var price = parseFloat(priceInput.value) || 0;
            var total = quantity * price;
            
            totalInput.value = total.toFixed(2);
        }
    }
    
    var quantityInput = document.querySelector('[name="quantity"]');
    var priceInput = document.querySelector('[name="price"]');
    
    if (quantityInput && priceInput) {
        quantityInput.addEventListener('input', calculateAmount);
        priceInput.addEventListener('input', calculateAmount);
    }
    
    // Function to format currency as EGP
    function formatCurrency(element) {
        if (element) {
            element.addEventListener('blur', function() {
                var value = this.value.replace(/[^\d.]/g, '');
                if (value !== '') {
                    value = parseFloat(value);
                    this.value = value.toFixed(2);
                }
            });
        }
    }
    
    // Apply currency formatting to amount inputs
    var amountInputs = document.querySelectorAll('.amount-input');
    amountInputs.forEach(formatCurrency);
    
    // Select2 initialization if available
    if (typeof $.fn.select2 !== 'undefined') {
        $('.select2').select2({
            dir: "rtl",
            language: "ar"
        });
    }
    
    // Function to set today's date in date inputs
    function setTodayDate() {
        var today = new Date();
        var yyyy = today.getFullYear();
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var dd = String(today.getDate()).padStart(2, '0');
        
        var formattedDate = yyyy + '-' + mm + '-' + dd;
        
        var todayDateInputs = document.querySelectorAll('.today-date');
        todayDateInputs.forEach(function(input) {
            if (!input.value) {
                input.value = formattedDate;
            }
        });
    }
    
    setTodayDate();
    
    // Toggle treatment stage visibility based on patient status
    function toggleTreatmentStage() {
        var treatmentStageContainer = document.getElementById('treatment-stage-container');
        var patientStatusSelect = document.getElementById('patient-status');
        
        if (treatmentStageContainer && patientStatusSelect) {
            if (patientStatusSelect.value === 'active') {
                treatmentStageContainer.style.display = 'block';
            } else {
                treatmentStageContainer.style.display = 'none';
            }
        }
    }
    
    var patientStatusSelect = document.getElementById('patient-status');
    if (patientStatusSelect) {
        patientStatusSelect.addEventListener('change', toggleTreatmentStage);
        toggleTreatmentStage(); // Initial call
    }
    
    // Show/hide permissions based on role selection
    function togglePermissionsBasedOnRole() {
        var roleSelect = document.querySelector('[name="role"]');
        var permissionsContainer = document.getElementById('permissions-container');
        
        if (roleSelect && permissionsContainer) {
            roleSelect.addEventListener('change', function() {
                var role = this.value;
                
                // Reset all checkboxes
                var checkboxes = permissionsContainer.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach(function(checkbox) {
                    checkbox.checked = false;
                });
                
                // Set default permissions based on role
                if (role === 'admin') {
                    checkboxes.forEach(function(checkbox) {
                        checkbox.checked = true;
                    });
                } else if (role === 'manager') {
                    document.querySelector('[name="can_manage_patients"]').checked = true;
                    document.querySelector('[name="can_view_reports"]').checked = true;
                } else if (role === 'therapist') {
                    document.querySelector('[name="can_manage_therapy"]').checked = true;
                } else if (role === 'accountant') {
                    document.querySelector('[name="can_manage_finances"]').checked = true;
                    document.querySelector('[name="can_view_reports"]').checked = true;
                }
            });
        }
    }
    
    togglePermissionsBasedOnRole();
    
    // Prefill daily rate based on patient type
    var patientTypeSelect = document.getElementById('patient-type');
    var dailyRateInput = document.getElementById('daily-rate');
    
    if (patientTypeSelect && dailyRateInput) {
        patientTypeSelect.addEventListener('change', function() {
            var patientType = this.value;
            
            // Default rates based on patient type (example values)
            var rates = {
                'standard': 500,
                'intensive': 800,
                'vip': 1200
            };
            
            if (rates[patientType]) {
                dailyRateInput.value = rates[patientType];
            } else {
                dailyRateInput.value = '';
            }
        });
    }
    
    // Handle report type dropdown
    var reportTypeSelect = document.getElementById('report-type');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', function() {
            var reportType = this.value;
            var reportForm = document.getElementById('report-form');
            
            if (reportForm) {
                reportForm.action = '/reports/' + reportType;
                
                // Show/hide different form fields based on report type
                var dailyFields = document.getElementById('daily-fields');
                var monthlyFields = document.getElementById('monthly-fields');
                var yearlyFields = document.getElementById('yearly-fields');
                
                if (dailyFields && monthlyFields && yearlyFields) {
                    dailyFields.style.display = 'none';
                    monthlyFields.style.display = 'none';
                    yearlyFields.style.display = 'none';
                    
                    if (reportType === 'daily') {
                        dailyFields.style.display = 'block';
                    } else if (reportType === 'monthly') {
                        monthlyFields.style.display = 'block';
                    } else if (reportType === 'yearly') {
                        yearlyFields.style.display = 'block';
                    }
                }
            }
        });
    }
    
    // Handle responsive tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('table-responsive');
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Fix accessibility issues
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.setAttribute('role', 'button');
        link.addEventListener('click', e => e.preventDefault());
    });
    
    document.querySelectorAll('button:not([type])').forEach(button => {
        button.setAttribute('type', 'button');
    });
    
    // Set up search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const searchTarget = this.getAttribute('data-search-target');
            const items = document.querySelectorAll(searchTarget);
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});
