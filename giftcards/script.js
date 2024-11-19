$(document).ready(function () {
    // تفعيل Select2 على قائمة اختيار طرق الدفع
    $('.select2').select2({
        templateResult: function (option) {
            if (!option.id) {
                return option.text; // إذا لم يكن هناك خيار، أعد النص فقط
            }
            var $option = $(
                '<span>' + option.text + ' <img src="' + getIconSrc(option.id) + '" class="currency-icon" alt="' + option.text + '"></span>'
            );
            return $option;
        },
        templateSelection: function (option) {
            return $('<span>' + option.text + ' <img src="' + getIconSrc(option.id) + '" class="currency-icon" alt="' + option.text + '"></span>');
        }
    });

    // استخراج البيانات من URL
    const urlParams = new URLSearchParams(window.location.search);
    const cardName = urlParams.get('name') || 'Card Name'; // القيمة الافتراضية
    document.getElementById('card-name').value = cardName;
    const productId = urlParams.get('product_id') || '';
    document.getElementById('product-id').value = productId;

    // إعداد القيم من URL
    const denominations = urlParams.get('denominations');
    const amountSelect = document.getElementById('amount');
    const customAmountInput = document.getElementById('custom-amount');

    if (denominations) {
        const values = denominations.replace(/[\[\]']/g, '').split(',').map(v => v.trim());
        if (values.includes("range")) {
            amountSelect.style.display = 'none';
            customAmountInput.style.display = 'block';
            customAmountInput.value = '';
            customAmountInput.style.width = '100%'; // ضبط عرض حقل الإدخال ليكون مشابهًا لباقي الحقول
        } else {
            amountSelect.innerHTML = '';
            const firstValue = values[0];
            const option = document.createElement('option');
            option.value = firstValue;
            option.textContent = firstValue;
            amountSelect.appendChild(option);
            amountSelect.style.display = 'block';
        }
    }

    // إضافة حدث الضغط على زر الإرسال
    $('#submit-button').click(function (event) {
        event.preventDefault(); // منع الإرسال الافتراضي للنموذج

        // جمع البيانات من الحقول
        const productId = document.getElementById('product-id').value;
        const tickerFrom = $('#payment-method').val();
        const networkFrom = getNetworkFrom(tickerFrom);
        const amount = $('#amount').is(':visible') ? $('#amount').val() : $('#custom-amount').val();
        const email = $('#email').val();

        // إزالة الرسائل السابقة
        $('.error-message').remove();

        // التحقق من الحقول
        let valid = true;

        if (!productId) {
            $('<span class="error-message" style="color:red;">Please fill out this field.</span>').insertAfter('#product-id');
            valid = false;
        }
        if (!tickerFrom) {
            $('<span class="error-message" style="color:red;">Please select a payment method.</span>').insertAfter('#payment-method');
            valid = false;
        }
        if (!amount) {
            $('<span class="error-message" style="color:red;">Please enter an amount.</span>').insertAfter('#amount, #custom-amount');
            valid = false;
        }
        if (!email) {
            $('<span class="error-message" style="color:red;">Please enter an email address.</span>').insertAfter('#email');
            valid = false;
        }

        // التحقق من صحة البريد الإلكتروني باستخدام نمط عام
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // نمط البريد الإلكتروني الشائع
        if (email && !emailPattern.test(email)) {
            $('<span class="error-message" style="color:red;">Please enter a valid email address.</span>').insertAfter('#email');
            valid = false;
        }

        if (!valid) {
            return; // إنهاء الدالة إذا كانت هناك حقول فارغة أو أخطاء
        }

        // إظهار دائرة التحميل
        $('#loading-screen').show();
        let countdown = 30;
        document.getElementById('countdown').textContent = countdown;

        // بدء العد التنازلي
        const countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('countdown').textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        // بناء الرابط للطلب
        const apiUrl = `https://giftcard-project-01l3.onrender.com/api/order_giftcard?product_id=${productId}&ticker_from=${tickerFrom}&network_from=${networkFrom}&amount=${amount}&email=${email}`;

        // إرسال الطلب
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP Status: ${response.status}, Response: ${text}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.trade_id) {
                    window.open(`https://trocador.app/giftcardscheckout/${data.trade_id}`, '_blank');
                }
                $('#loading-screen').hide(); // إخفاء دائرة التحميل
            })
            .catch(error => {
                console.error('Error:', error);
                $('#loading-screen').hide(); // إخفاء دائرة التحميل عند حدوث خطأ
            });
    });

    // دوال مساعدة
    function getIconSrc(value) {
        switch (value) {
            case 'SOL':
                return 'https://trocador.app/static/img/icons/sol.svg';
            case 'TRX':
                return 'https://trocador.app/static/img/icons/trx.svg';
            case 'ETH':
                return 'https://trocador.app/static/img/icons/eth.svg';
            case 'BTC':
                return 'https://trocador.app/static/img/icons/btc.svg';
            case 'USDT_SOL':
            case 'USDT_TRC20':
            case 'USDT_ETH':
            case 'USDT_BEP20':
                return 'https://trocador.app/static/img/icons/usdt.svg';
            default:
                return '';
        }
    }

    function getNetworkFrom(ticker) {
        switch (ticker) {
            case 'SOL':
                return 'Mainnet';
            case 'TRX':
                return 'Mainnet';
            case 'USDT_SOL':
                return 'SOL';
            case 'USDT_TRC20':
                return 'TRC20';
            case 'USDT_ETH':
                return 'ETH';
            case 'USDT_BEP20':
                return 'BEP20';
            default:
                return '';
        }
    }
});
