// =====================================================
// FIGURE BATTLES - CONTA
// =====================================================
// IMPORTANTE:
// coloque sua PUBLISHABLE KEY do Supabase abaixo.
// Ela é uma chave pública do cliente. NUNCA coloque
// uma service_role/secret key neste arquivo.
// =====================================================

const SUPABASE_URL = "https://llvdfjmxyopbxfvetdsv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aZWj95xL5mk8AtUjo99R9g_njRnatQo";

const { createClient } = supabase;

const db = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const profileView = document.getElementById("profileView");
const message = document.getElementById("message");

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const logoutButton = document.getElementById("logoutButton");

function showMessage(text) {
    message.textContent = text;
}

function showView(view) {
    loginView.classList.add("hidden");
    registerView.classList.add("hidden");
    profileView.classList.add("hidden");
    view.classList.remove("hidden");
    showMessage("");
}

document.getElementById("showRegister").addEventListener("click", () => {
    showView(registerView);
});

document.getElementById("showLogin").addEventListener("click", () => {
    showView(loginView);
});

loginButton.addEventListener("click", login);
registerButton.addEventListener("click", register);
logoutButton.addEventListener("click", logout);

async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showMessage("Preencha e-mail e senha.");
        return;
    }

    loginButton.disabled = true;
    showMessage("Entrando...");

    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });

    loginButton.disabled = false;

    if (error) {
        showMessage(error.message);
        return;
    }

    await loadProfile(data.user);
}

async function register() {
    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const password2 = document.getElementById("registerPassword2").value;

    if (username.length < 3) {
        showMessage("O username precisa ter pelo menos 3 caracteres.");
        return;
    }

    if (username.length > 20) {
        showMessage("O username pode ter no máximo 20 caracteres.");
        return;
    }

    if (!email || !password) {
        showMessage("Preencha todos os campos.");
        return;
    }

    if (password.length < 6) {
        showMessage("A senha precisa ter pelo menos 6 caracteres.");
        return;
    }

    if (password !== password2) {
        showMessage("As senhas não são iguais.");
        return;
    }

    registerButton.disabled = true;
    showMessage("Criando conta...");

    const { data, error } = await db.auth.signUp({
        email,
        password
    });

    if (error) {
        registerButton.disabled = false;
        showMessage(error.message);
        return;
    }

    // Como o projeto foi configurado para não exigir confirmação
    // de e-mail, a sessão normalmente já vem disponível.
    if (!data.user) {
        registerButton.disabled = false;
        showMessage("Conta criada, mas não recebemos o usuário.");
        return;
    }

    // Se não houver sessão, a confirmação de e-mail provavelmente
    // está ligada no Supabase.
    if (!data.session) {
        registerButton.disabled = false;
        showMessage("Conta criada! Confirme seu e-mail para entrar.");
        return;
    }

    const { error: profileError } = await db
        .from("profiles")
        .insert({
            id: data.user.id,
            username: username
        });

    registerButton.disabled = false;

    if (profileError) {
        if (profileError.code === "23505") {
            showMessage("Esse username já está em uso.");
        } else {
            showMessage("Conta criada, mas houve um erro ao criar o perfil: " + profileError.message);
        }
        return;
    }

    await loadProfile(data.user);
}

async function loadProfile(user) {
    showMessage("Carregando perfil...");

    const { data: profile, error } = await db
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        showMessage("Erro ao carregar perfil: " + error.message);
        return;
    }

    if (!profile) {
        showView(registerView);
        showMessage("Sua conta existe, mas ainda não possui um perfil.");
        return;
    }

    document.getElementById("profileUsername").textContent = profile.username;
    document.getElementById("profileEmail").textContent = user.email || "---";

    showView(profileView);
}

async function logout() {
    await db.auth.signOut();
    showView(loginView);
    showMessage("Você saiu da conta.");
}

// Mantém o usuário conectado ao recarregar a página.
async function checkSession() {
    const { data } = await db.auth.getSession();

    if (data.session && data.session.user) {
        await loadProfile(data.session.user);
    } else {
        showView(loginView);
    }
}

checkSession();
