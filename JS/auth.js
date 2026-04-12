document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("login-section");
    const registerSection = document.getElementById("register-section");
    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");

    // Toggle logic
    showRegisterBtn.addEventListener("click", () => {
        loginSection.classList.add("hide");
        registerSection.classList.remove("hide");
    });

    showLoginBtn.addEventListener("click", () => {
        registerSection.classList.add("hide");
        loginSection.classList.remove("hide");
    });

    // Form handlers
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.innerText = "";
        loginError.style.color = "#e74c3c"; // reset color in case it was green
        
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        if (!validateEmail(email)) {
            loginError.innerText = "Please enter a valid email address.";
            return;
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Navigate to the main store page
                window.location.href = "/products";
            } else {
                loginError.innerText = data.error || "Login failed";
            }
        } catch (error) {
            loginError.innerText = "Server error. Is the backend running?";
        }
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        registerError.innerText = "";

        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        if (name.trim().length === 0) {
            registerError.innerText = "Please enter your full name.";
            return;
        }

        if (!validateEmail(email)) {
            registerError.innerText = "Please enter a valid email address.";
            return;
        }

        if (password.length < 6) {
            registerError.innerText = "Password must be at least 6 characters long.";
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                // Success! Automatically switch to login tab and prefill email
                registerForm.reset();
                registerSection.classList.add("hide");
                loginSection.classList.remove("hide");
                
                document.getElementById("loginEmail").value = email; 
                loginError.innerText = "Registration successful! You may now sign in.";
                loginError.style.color = "#27ae60"; // green success message
            } else {
                registerError.innerText = data.error || "Registration failed";
            }
        } catch (error) {
            registerError.innerText = "Server error. Is the backend running?";
        }
    });

    // Optional: If the user is already perfectly logged in and revisits the root route, take them immediately to the shop.
    fetch("/api/auth/me")
    .then(res => {
        if (res.ok) {
            window.location.href = "/products";
        }
    })
    .catch(() => {});
});
