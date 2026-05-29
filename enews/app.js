(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxaT7ZnJM9OM1lWmI4TrW2cxo6w4Cv4PxMzdobm0YjVcBb_6EqgiHKn2jLq50OnEL0S/exec";
  var form = document.getElementById("newsletterForm");
  var feedback = document.getElementById("feedback");
  var nameField = document.getElementById("nameField");
  var nameInput = document.getElementById("name");
  var submitButton = document.getElementById("submitButton");
  var toggleModeLink = document.getElementById("toggleModeLink");
  var currentAction = "subscribe";
  var hideNameTimer = null;

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

    if (hideNameTimer) {
      clearTimeout(hideNameTimer);
      hideNameTimer = null;
    }

    var isSubscribe = action === "subscribe";
    nameInput.required = isSubscribe;
    submitButton.textContent = isSubscribe ? "Assinar" : "Confirmar cancelamento";
    toggleModeLink.textContent = isSubscribe ? "Cancelar assinatura" : "Voltar para assinatura";

    // Quick transition to make layout switch feel immediate without abrupt jump.
    nameField.style.overflow = "hidden";
    nameField.style.transition = "opacity 140ms ease, max-height 180ms ease, margin 180ms ease";

    if (isSubscribe) {
      nameField.hidden = false;
      nameField.style.maxHeight = "0";
      nameField.style.opacity = "0";
      nameField.style.marginTop = "0";
      nameField.style.marginBottom = "0";
      requestAnimationFrame(function () {
        nameField.style.maxHeight = "120px";
        nameField.style.opacity = "1";
        nameField.style.marginTop = "";
        nameField.style.marginBottom = "";
      });
    } else {
      nameField.hidden = false;
      nameField.style.maxHeight = "120px";
      nameField.style.opacity = "1";
      requestAnimationFrame(function () {
        nameField.style.maxHeight = "0";
        nameField.style.opacity = "0";
        nameField.style.marginTop = "0";
        nameField.style.marginBottom = "0";
      });
      hideNameTimer = setTimeout(function () {
        nameField.hidden = true;
      }, 190);
    }

    if (!isSubscribe) {
      nameInput.value = "";
    }
    setFeedback("", "");
  }

  function setLoading(isLoading) {
    var buttons = document.querySelectorAll("#submitButton");
    buttons.forEach(function (button) {
      button.disabled = isLoading;
      button.setAttribute("aria-busy", isLoading ? "true" : "false");
    });
    toggleModeLink.setAttribute("aria-disabled", isLoading ? "true" : "false");
    toggleModeLink.style.pointerEvents = isLoading ? "none" : "auto";
    toggleModeLink.style.opacity = isLoading ? "0.5" : "0.8";
  }

  function parseResponseText(text) {
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      return null;
    }
  }

  function getFriendlySuccessMessage(action, text) {
    var defaultMessage = action === "subscribe"
      ? "Assinatura registrada com sucesso."
      : "Cancelamento registrado com sucesso.";
    var parsed = parseResponseText(text);

    if (parsed && typeof parsed === "object") {
      var messageFromApi = parsed.message || parsed.msg || parsed.detail || parsed.status;
      if (typeof messageFromApi === "string" && messageFromApi.trim()) {
        return messageFromApi.trim();
      }
      return defaultMessage;
    }

    var trimmed = (text || "").toString().trim();
    if (!trimmed || /^[\[{].*[\]}]$/.test(trimmed)) {
      return defaultMessage;
    }
    return trimmed;
  }

  function getFriendlyErrorMessage(text) {
    var parsed = parseResponseText(text);
    if (parsed && typeof parsed === "object") {
      var messageFromApi = parsed.error || parsed.message || parsed.msg || parsed.detail;
      if (typeof messageFromApi === "string" && messageFromApi.trim()) {
        return messageFromApi.trim();
      }
    }

    var trimmed = (text || "").toString().trim();
    if (!trimmed || /^[\[{].*[\]}]$/.test(trimmed)) {
      return "Nao foi possivel concluir a solicitacao. Tente novamente.";
    }
    return trimmed;
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
        throw new Error(getFriendlyErrorMessage(text));
      }

      setFeedback(getFriendlySuccessMessage(action, text), "ok");
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

  toggleModeLink.addEventListener("click", function (event) {
    event.preventDefault();
    applyMode(currentAction === "subscribe" ? "unsubscribe" : "subscribe");
  });

  applyMode(currentAction);
})();
