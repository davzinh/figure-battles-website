
// =====================================================
// FIGURE BATTLES - CONTA script.js
// =====================================================
// IMPORTANTE:
// coloque sua PUBLISHABLE KEY do Supabase abaixo.
// NUNCA coloque uma service_role/secret key neste arquivo.
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


// =====================================================
// CONEXÃO COM O GAMEMAKER
// =====================================================

// Pega o código enviado pelo GameMaker na URL.
// Exemplo:
// ?code=FB-A82K91

const urlParams = new URLSearchParams(window.location.search);
const gameConnectionCode = urlParams.get("code");


// =====================================================
// FUNÇÕES BÁSICAS
// =====================================================

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


// =====================================================
// CONEXÃO DO GAMEMAKER
// =====================================================

async function connectGameMaker(user) {
    if (!gameConnectionCode) {
        return;
    }

    const { data, error } = await db
        .from("game_connections")
        .update({
            user_id: user.id,
            connected: true
        })
        .eq("code", gameConnectionCode)
        .select();

    if (error) {
        showMessage("Erro ao conectar o jogo: " + error.message);
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        showMessage("Código de conexão não encontrado.");
        return;
    }

    showMessage("Jogo conectado com sucesso!");

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
}

    console.log("=================================");
    console.log("FIGURE BATTLES CONECTADO");
    console.log("Código:", gameConnectionCode);
    console.log("User ID:", user.id);
    console.log("Username:", user.email);
    console.log("=================================");

    showMessage(
        "Conta conectada ao Figure Battles!"
    );

    // Remove o código da URL depois da conexão.
    // Assim, ao atualizar a página, ele não tenta
    // conectar novamente.
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
}


// =====================================================
// NAVEGAÇÃO
// =====================================================

document.getElementById("showRegister").addEventListener("click", () => {
    showView(registerView);
});

document.getElementById("showLogin").addEventListener("click", () => {
    showView(loginView);
});

loginButton.addEventListener("click", login);
registerButton.addEventListener("click", register);
logoutButton.addEventListener("click", logout);


// =====================================================
// LOGIN
// =====================================================

async function login() {

    const email = document
        .getElementById("loginEmail")
        .value
        .trim();

    const password = document
        .getElementById("loginPassword")
        .value;

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


// =====================================================
// CADASTRO
// =====================================================

async function register() {

    const username = document
        .getElementById("registerUsername")
        .value
        .trim();

    const email = document
        .getElementById("registerEmail")
        .value
        .trim();

    const password = document
        .getElementById("registerPassword")
        .value;

    const password2 = document
        .getElementById("registerPassword2")
        .value;


    if (username.length < 3) {
        showMessage(
            "O username precisa ter pelo menos 3 caracteres."
        );

        return;
    }


    if (username.length > 20) {
        showMessage(
            "O username pode ter no máximo 20 caracteres."
        );

        return;
    }


    if (!email || !password) {
        showMessage("Preencha todos os campos.");
        return;
    }


    if (password.length < 6) {
        showMessage(
            "A senha precisa ter pelo menos 6 caracteres."
        );

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


    if (!data.user) {

        registerButton.disabled = false;

        showMessage(
            "Conta criada, mas não recebemos o usuário."
        );

        return;
    }


    if (!data.session) {

        registerButton.disabled = false;

        showMessage(
            "Conta criada! Confirme seu e-mail para entrar."
        );

        return;
    }


    const { error: profileError } = await db
        .from("profiles")
        .insert({
            id: data.user.id,
            username: username,
            wins: 0,
            losses: 0,
            matches: 0
        });


    registerButton.disabled = false;


    if (profileError) {

        if (profileError.code === "23505") {

            showMessage(
                "Esse username já está em uso."
            );

        } else {

            showMessage(
                "Conta criada, mas houve um erro ao criar o perfil: "
                + profileError.message
            );
        }

        return;
    }


    await loadProfile(data.user);
}


// =====================================================
// CARREGAR PERFIL
// =====================================================

async function loadProfile(user) {

    showMessage("Carregando perfil...");


    const { data: profile, error } = await db
        .from("profiles")
        .select("username, wins, losses, matches")
        .eq("id", user.id)
        .maybeSingle();


    if (error) {

        showMessage(
            "Erro ao carregar perfil: "
            + error.message
        );

        return;
    }


    if (!profile) {

        showView(registerView);

        showMessage(
            "Sua conta existe, mas ainda não possui um perfil."
        );

        return;
    }


    document.getElementById("profileUsername")
        .textContent = profile.username;

    document.getElementById("profileEmail")
        .textContent = user.email || "---";

    document.getElementById("profileWins")
        .textContent = profile.wins;

    document.getElementById("profileLosses")
        .textContent = profile.losses;

    document.getElementById("profileMatches")
        .textContent = profile.matches;


    showView(profileView);


    // Depois que o perfil foi carregado,
    // tenta conectar o GameMaker.
    await connectGameMaker(user);
}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

    await db.auth.signOut();

    showView(loginView);

    showMessage("Você saiu da conta.");
}


// =====================================================
// VERIFICAR SESSÃO
// =====================================================

async function checkSession() {

    const { data } = await db.auth.getSession();


    if (data.session && data.session.user) {

        await loadProfile(data.session.user);

    } else {

        showView(loginView);

    }
}


checkSession();
