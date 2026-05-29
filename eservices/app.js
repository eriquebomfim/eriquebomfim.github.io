(function () {
  "use strict";

  var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxaT7ZnJM9OM1lWmI4TrW2cxo6w4Cv4PxMzdobm0YjVcBb_6EqgiHKn2jLq50OnEL0S/exec";
  var form = document.getElementById("newsletterForm");
  var feedback = document.getElementById("feedback");
  var nameField = document.getElementById("nameField");
  var nameInput = document.getElementById("name");
  var emesasLabel = document.getElementById("emesasLabel");
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
      email: (data.get("email") || "").toString().trim(),
      emesas: action === "subscribe" ? (document.getElementById("emesas").checked ? 1 : 0) : ""
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
    if (emesasLabel) {
      emesasLabel.textContent = isSubscribe ? "Incluir eMesas" : "Remover eMesas";
    }
    submitButton.textContent = isSubscribe ? "Assinar" : "Confirmar cancelamento";
    toggleModeLink.textContent = isSubscribe ? "Cancelar assinatura" : "Voltar para assinatura";

    if (carouselEl) {
      if (isSubscribe) {
        carouselEl.hidden = carouselItems.length === 0;
      } else {
        carouselEl.hidden = true;
      }
    }

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

  function getFriendlySuccessMessage(action, text, payload) {
    if (action === "subscribe" && payload && String(payload.emesas) === "1") {
      return "Assinatura registrada com sucesso. Você receberá um email com instruções de acesso ao eMesas.";
    }

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

      setFeedback(getFriendlySuccessMessage(action, text, payload), "ok");
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

  // --- Carousel de novidades ---
  var CAROUSEL_CACHE_KEY = "eservices_updates_v1";
  var carouselEl    = document.getElementById("updatesCarousel");
  var carouselTit   = document.getElementById("carouselTitulo");
  var carouselDesc  = document.getElementById("carouselDesc");
  var carouselInd   = document.getElementById("carouselIndicator");
  var btnPrev       = document.getElementById("carouselPrev");
  var btnNext       = document.getElementById("carouselNext");
  var carouselItems = [];
  var carouselIdx   = 0;
  var carouselTimer = null;

  function renderSlide(idx) {
    var item = carouselItems[idx];
    if (!item) return;
    carouselTit.textContent  = item.titulo   || "";
    carouselDesc.textContent = item.descricao || "";
    carouselInd.textContent  = (idx + 1) + " / " + carouselItems.length;
    btnPrev.disabled = carouselItems.length <= 1;
    btnNext.disabled = carouselItems.length <= 1;
    carouselSlideBtn.style.cursor = item.link ? "pointer" : "default";
    carouselSlideBtn.setAttribute("aria-disabled", item.link ? "false" : "true");
  }

  function goTo(idx) {
    carouselIdx = (idx + carouselItems.length) % carouselItems.length;
    renderSlide(carouselIdx);
  }

  function startAutoPlay() {
    if (carouselItems.length <= 1) return;
    carouselTimer = setInterval(function () { goTo(carouselIdx + 1); }, 5000);
  }

  function resetAutoPlay() {
    clearInterval(carouselTimer);
    startAutoPlay();
  }

  function loadCarousel(data) {
    carouselItems = data;
    carouselIdx   = 0;
    clearInterval(carouselTimer);
    carouselEl.hidden = currentAction !== "subscribe";
    renderSlide(0);
    startAutoPlay();
  }

  var popupEl    = document.getElementById("updatePopup");
  var popupFrame  = document.getElementById("popupFrame");
  var popupClose  = document.getElementById("popupClose");
  var carouselSlideBtn = document.getElementById("carouselSlide");

  carouselSlideBtn.addEventListener("click", function () {
    var item = carouselItems[carouselIdx];
    if (!item || !item.link) return;
    popupFrame.src = item.link;
    popupEl.showModal();
  });

  popupClose.addEventListener("click", function () {
    popupEl.close();
    popupFrame.src = "";
  });

  popupEl.addEventListener("click", function (e) {
    if (e.target === popupEl) { popupEl.close(); popupFrame.src = ""; }
  });

  btnPrev.addEventListener("click", function () { goTo(carouselIdx - 1); resetAutoPlay(); });
  btnNext.addEventListener("click", function () { goTo(carouselIdx + 1); resetAutoPlay(); });

  // 1) Renderiza imediatamente a partir do cache
  try {
    var cached = localStorage.getItem(CAROUSEL_CACHE_KEY);
    if (cached) {
      var cachedData = JSON.parse(cached);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        loadCarousel(cachedData);
      }
    }
  } catch (e) { /* storage indisponível */ }

  // 2) Busca dados frescos e atualiza cache + carrossel
  fetch(WEBHOOK_URL + "?action=updates")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!Array.isArray(data) || data.length === 0) return;
      try { localStorage.setItem(CAROUSEL_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
      loadCarousel(data);
    })
    .catch(function () { /* carrossel silencioso se offline */ });
})();
