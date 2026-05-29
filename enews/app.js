(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxaT7ZnJM9OM1lWmI4TrW2cxo6w4Cv4PxMzdobm0YjVcBb_6EqgiHKn2jLq50OnEL0S/exec";
  var form = document.getElementById("newsletterForm");
  var feedback = document.getElementById("feedback");
  var modeButtons = document.querySelectorAll("button[data-mode]");
  var nameField = document.getElementById("nameField");
  var nameInput = document.getElementById("name");
  var submitButton = document.getElementById("submitButton");
  var currentAction = "subscribe";

  function setFeedback(message, type) {
    feedback.textContent = message || "";
    feedback.classList.remove("ok", "error");
    if (type) {
      feedback.classList.add(type);
    }
  }

  function getPayload(action) {
    var data = new FormData(form);
    return {
      action: action,
      name: action === "subscribe" ? (data.get("name") || "").toString().trim() : "",
      email: (data.get("email") || "").toString().trim()
    };
  }

  function validate(payload) {
    if (payload.action === "subscribe" && !payload.name) {
      return "Informe o nome.";
    }
    if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
      return "Informe um email valido.";
    }
    return "";
  }

  function applyMode(action) {
    currentAction = action;

    modeButtons.forEach(function (button) {
      var isActive = button.dataset.mode === action;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      button.classList.toggle("btn-primary", isActive);
      button.classList.toggle("btn-ghost", !isActive);
    });

    var isSubscribe = action === "subscribe";
    nameField.hidden = !isSubscribe;
    nameInput.required = isSubscribe;
    submitButton.textContent = isSubscribe ? "Assinar" : "Confirmar cancelamento";

    if (!isSubscribe) {
      nameInput.value = "";
    }
    setFeedback("", "");
  }

  function setLoading(isLoading) {
    var buttons = document.querySelectorAll("button[data-mode], #submitButton");
    buttons.forEach(function (button) {
      button.disabled = isLoading;
      button.setAttribute("aria-busy", isLoading ? "true" : "false");
    });
  }

  async function send(action) {
    var payload = getPayload(action);
    var error = validate(payload);

    if (error) {
      setFeedback(error, "error");
      return;
    }

    setLoading(true);
    setFeedback("Enviando...", "");

    try {
      var response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });

      var text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Falha na requisicao");
      }

      var baseMessage = action === "subscribe" ? "Assinatura registrada." : "Cancelamento registrado.";
      setFeedback(baseMessage + " Retorno: " + text, "ok");
      if (action === "subscribe") {
        form.reset();
      }
    } catch (err) {
      setFeedback("Erro ao enviar: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    send(currentAction);
  });

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyMode(button.dataset.mode);
    });
  });

  applyMode(currentAction);
})();
