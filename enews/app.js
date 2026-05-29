(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxaT7ZnJM9OM1lWmI4TrW2cxo6w4Cv4PxMzdobm0YjVcBb_6EqgiHKn2jLq50OnEL0S/exec";
  var form = document.getElementById("newsletterForm");
  var feedback = document.getElementById("feedback");

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
      name: (data.get("name") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim()
    };
  }

  function validate(payload) {
    if (!payload.name) {
      return "Informe o nome.";
    }
    if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
      return "Informe um email valido.";
    }
    return "";
  }

  function setLoading(isLoading) {
    var buttons = document.querySelectorAll("button[data-action]");
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
      var response = await fetch(webhook, {
      var response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

  document.querySelectorAll("button[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      send(button.dataset.action);
    });
  });
})();
