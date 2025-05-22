document.addEventListener('DOMContentLoaded', function() {
    // عناصر الآلة الحاسبة
    const calcToggle = document.getElementById('simpleCalcToggle');
    const calcWindow = document.getElementById('simpleCalc');
    const calcClose = document.getElementById('simpleCalcClose');
    const display = document.getElementById('simpleCalcDisplay');
    const buttons = document.querySelectorAll('.simple-calc-btn');
    
    // متغيرات لتخزين الحسابات
    let currentValue = '0';
    let previousValue = null;
    let operator = null;
    let waitingForOperand = false;
    
    // تحديث شاشة العرض
    function updateDisplay() {
        display.value = currentValue;
    }
    
    // إعادة تعيين الحاسبة
    function clearAll() {
        currentValue = '0';
        previousValue = null;
        operator = null;
        waitingForOperand = false;
        updateDisplay();
    }
    
    // التعامل مع الأرقام
    function inputDigit(digit) {
        if (waitingForOperand) {
            currentValue = digit;
            waitingForOperand = false;
        } else {
            currentValue = currentValue === '0' ? digit : currentValue + digit;
        }
        updateDisplay();
    }
    
    // التعامل مع العلامة العشرية
    function inputDecimal() {
        if (waitingForOperand) {
            currentValue = '0.';
            waitingForOperand = false;
        } else if (currentValue.indexOf('.') === -1) {
            currentValue += '.';
        }
        updateDisplay();
    }
    
    // تغيير الإشارة
    function toggleSign() {
        currentValue = parseFloat(currentValue) * -1 + '';
        updateDisplay();
    }
    
    // تحويل إلى نسبة مئوية
    function percentage() {
        currentValue = (parseFloat(currentValue) / 100) + '';
        updateDisplay();
    }
    
    // تنفيذ العمليات الحسابية
    function performOperation(nextOperator) {
        const value = parseFloat(currentValue);
        
        if (previousValue === null) {
            previousValue = value;
        } else if (operator) {
            const result = calculate(previousValue, value, operator);
            currentValue = String(result);
            previousValue = result;
        }
        
        waitingForOperand = true;
        operator = nextOperator;
        updateDisplay();
    }
    
    // حساب النتيجة
    function calculate(firstValue, secondValue, op) {
        switch (op) {
            case 'add':
                return firstValue + secondValue;
            case 'subtract':
                return firstValue - secondValue;
            case 'multiply':
                return firstValue * secondValue;
            case 'divide':
                return firstValue / secondValue;
            default:
                return secondValue;
        }
    }
    
    // إظهار وإخفاء الآلة الحاسبة
    calcToggle.addEventListener('click', function() {
        calcWindow.style.display = calcWindow.style.display === 'none' ? 'block' : 'none';
    });
    
    calcClose.addEventListener('click', function() {
        calcWindow.style.display = 'none';
    });
    
    // استمع لأحداث النقر على الأزرار
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // الأرقام
            if (button.classList.contains('number')) {
                inputDigit(button.textContent);
            }
            // النقطة العشرية
            else if (button.classList.contains('decimal')) {
                inputDecimal();
            }
            // الوظائف
            else if (button.classList.contains('function')) {
                const func = button.textContent;
                if (func === 'AC') {
                    clearAll();
                } else if (func === '+/-') {
                    toggleSign();
                } else if (func === '%') {
                    percentage();
                }
            }
            // العمليات الحسابية
            else if (button.classList.contains('operator')) {
                if (button.classList.contains('add')) {
                    performOperation('add');
                } else if (button.classList.contains('subtract')) {
                    performOperation('subtract');
                } else if (button.classList.contains('multiply')) {
                    performOperation('multiply');
                } else if (button.classList.contains('divide')) {
                    performOperation('divide');
                }
            }
            // المساواة
            else if (button.classList.contains('equal')) {
                if (operator) {
                    performOperation(null);
                }
            }
        });
    });
    
    // تهيئة الشاشة
    updateDisplay();
});