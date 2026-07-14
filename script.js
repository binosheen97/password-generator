const CHARS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers:   '0123456789',
    symbols:   '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const AMBIGUOUS = /[0OIl1]/g;

// Generate a single password
function buildPassword(length, opts) {
    let charset = '';
    let guaranteed = [];

    if (opts.uppercase) {
        let pool = CHARS.uppercase;
        if (opts.excludeAmbiguous) pool = pool.replace(/[OI]/g, '');
        charset += pool;
        guaranteed.push(randomChar(pool));
    }
    if (opts.lowercase) {
        let pool = CHARS.lowercase;
        if (opts.excludeAmbiguous) pool = pool.replace(/[l]/g, '');
        charset += pool;
        guaranteed.push(randomChar(pool));
    }
    if (opts.numbers) {
        let pool = CHARS.numbers;
        if (opts.excludeAmbiguous) pool = pool.replace(/[01]/g, '');
        charset += pool;
        guaranteed.push(randomChar(pool));
    }
    if (opts.symbols) {
        charset += CHARS.symbols;
        guaranteed.push(randomChar(CHARS.symbols));
    }

    if (!charset) return '';

    if (opts.noRepeat && length > charset.length) {
        length = charset.length;
        document.getElementById('length-slider').value = length;
        document.getElementById('length-display').textContent = length;
    }

    let password = [...guaranteed];
    const remaining = length - guaranteed.length;

    if (opts.noRepeat) {
        let available = charset.split('').filter(c => !password.includes(c));
        for (let i = 0; i < remaining; i++) {
            if (available.length === 0) break;
            const idx = secureRandom(available.length);
            password.push(available[idx]);
            available.splice(idx, 1);
        }
    } else {
        for (let i = 0; i < remaining; i++) {
            password.push(charset[secureRandom(charset.length)]);
        }
    }

    // Shuffle
    for (let i = password.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
}

function getOptions() {
    return {
        uppercase:       document.getElementById('opt-uppercase').checked,
        lowercase:       document.getElementById('opt-lowercase').checked,
        numbers:         document.getElementById('opt-numbers').checked,
        symbols:         document.getElementById('opt-symbols').checked,
        excludeAmbiguous: document.getElementById('opt-exclude-ambiguous').checked,
        noRepeat:        document.getElementById('opt-no-repeat').checked
    };
}

function generatePassword() {
    const opts = getOptions();
    if (!opts.uppercase && !opts.lowercase && !opts.numbers && !opts.symbols) {
        document.getElementById('generated-password').textContent = '⚠️ Select at least one character type';
        document.getElementById('strength-section').style.display = 'none';
        return;
    }

    const length = parseInt(document.getElementById('length-slider').value);
    const password = buildPassword(length, opts);

    document.getElementById('generated-password').textContent = password;
    document.getElementById('strength-section').style.display = 'block';
    document.getElementById('multiple-passwords').innerHTML = '';
    updateStrength(password, opts);
    clearFeedback();
}

function generateMultiple() {
    const opts = getOptions();
    if (!opts.uppercase && !opts.lowercase && !opts.numbers && !opts.symbols) return;

    const length = parseInt(document.getElementById('length-slider').value);
    const container = document.getElementById('multiple-passwords');
    container.innerHTML = '<p style="font-weight:600; color:#667eea; margin-bottom:12px;">5 Generated Passwords:</p>';

    for (let i = 0; i < 5; i++) {
        const pwd = buildPassword(length, opts);
        const div = document.createElement('div');
        div.className = 'multi-password-item';
        div.innerHTML = `
            <span class="multi-password-text">${pwd}</span>
            <button class="mini-copy-btn" onclick="copyText('${pwd.replace(/'/g, "\\'")}', this)" title="Copy">📋</button>
        `;
        container.appendChild(div);
    }

    // Also generate one in main display
    const first = buildPassword(length, opts);
    document.getElementById('generated-password').textContent = first;
    document.getElementById('strength-section').style.display = 'block';
    updateStrength(first, opts);
}

function copyPassword() {
    const pwd = document.getElementById('generated-password').textContent;
    if (!pwd || pwd.startsWith('⚠️') || pwd === 'Click Generate to create a password') return;
    copyText(pwd, null);
}

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const feedback = document.getElementById('copy-feedback');
        feedback.textContent = '✅ Password copied to clipboard!';
        if (btn) {
            const orig = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => btn.textContent = orig, 1500);
        }
        setTimeout(() => feedback.textContent = '', 2000);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        document.getElementById('copy-feedback').textContent = '✅ Copied!';
        setTimeout(() => document.getElementById('copy-feedback').textContent = '', 2000);
    });
}

function updateStrength(password, opts) {
    let score = 0;
    const len = password.length;

    if (len >= 8)  score++;
    if (len >= 12) score++;
    if (len >= 16) score++;
    if (len >= 20) score++;

    const types = [opts.uppercase, opts.lowercase, opts.numbers, opts.symbols].filter(Boolean).length;
    score += types - 1;

    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');

    fill.className = 'strength-fill';

    if (score <= 1) {
        fill.classList.add('weak');
        text.textContent = 'Weak';
        text.style.color = '#e74c3c';
    } else if (score <= 3) {
        fill.classList.add('fair');
        text.textContent = 'Fair';
        text.style.color = '#f39c12';
    } else if (score <= 5) {
        fill.classList.add('good');
        text.textContent = 'Good';
        text.style.color = '#3498db';
    } else {
        fill.classList.add('strong');
        text.textContent = 'Strong';
        text.style.color = '#27ae60';
    }
}

function updateLength() {
    const val = document.getElementById('length-slider').value;
    document.getElementById('length-display').textContent = val;
}

function clearFeedback() {
    document.getElementById('copy-feedback').textContent = '';
}

function secureRandom(max) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
}

function randomChar(str) {
    return str[secureRandom(str.length)];
}

// Generate on load
window.addEventListener('load', generatePassword);
