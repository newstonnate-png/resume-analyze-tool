const SESSION_KEY = "resumeAnalyzeCandidateSessionId";

const uploadForm = document.querySelector("#upload-form");
const fileInput = document.querySelector("#resume-file");
const selectedFile = document.querySelector("#selected-file");
const uploadButton = document.querySelector("#upload-button");
const cancelButton = document.querySelector("#cancel-button");
const progressCard = document.querySelector("#progress-card");
const clarificationCard = document.querySelector("#clarification-card");
const clarificationList = document.querySelector("#clarification-list");
const readyCard = document.querySelector("#ready-card");
const errorCard = document.querySelector("#error-card");
const errorMessage = document.querySelector("#error-message");
const errorSafeState = document.querySelector("#error-safe-state");
const errorActions = document.querySelector("#error-actions");
const statusRegion = document.querySelector("#status-region");
const confidenceValue = document.querySelector("#confidence-value");
const skillsCount = document.querySelector("#skills-count");
const workCount = document.querySelector("#work-count");

let session = null;
let activeUploadController = null;
let pollTimer = null;

function announce(message) {
  statusRegion.textContent = "";
  window.setTimeout(() => {
    statusRegion.textContent = message;
  }, 20);
}

function setProcessing(isProcessing) {
  uploadButton.disabled = isProcessing;
  fileInput.disabled = isProcessing;
  cancelButton.hidden = !isProcessing;
  progressCard.hidden = !isProcessing;
  uploadForm.setAttribute("aria-busy", isProcessing ? "true" : "false");
}

function clearError() {
  errorCard.hidden = true;
  errorMessage.textContent = "";
  errorSafeState.textContent = "";
  errorActions.replaceChildren();
}

function showError(error) {
  clearError();
  errorCard.hidden = false;
  errorMessage.textContent =
    error?.message || "We could not complete this step.";

  if (error?.preservedState) {
    errorSafeState.textContent =
      error.preservedState === "none"
        ? "No previous private session state is available."
        : "Your existing private session remains available.";
  }

  for (const action of error?.nextActions || []) {
    const item = document.createElement("p");
    item.className = "muted";
    item.textContent = action;
    errorActions.append(item);
  }

  announce(errorMessage.textContent);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  const payload = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    const error = payload?.error || {
      message: "We could not complete this step.",
      retryable: true,
      preservedState: "session",
      nextActions: ["Try again."],
    };
    throw error;
  }

  return payload;
}

async function createSession() {
  const payload = await request("/api/sessions", { method: "POST" });
  session = payload.session;
  localStorage.setItem(SESSION_KEY, session.id);
  return session;
}

async function restoreSession() {
  const existingId = localStorage.getItem(SESSION_KEY);
  if (!existingId) return createSession();

  try {
    const payload = await request(
      `/api/sessions/${encodeURIComponent(existingId)}`,
    );
    session = payload.session;
    return session;
  } catch (error) {
    if (error?.category === "session_not_found") {
      localStorage.removeItem(SESSION_KEY);
      return createSession();
    }
    throw error;
  }
}

function renderReady(currentSession) {
  const resume = currentSession.normalizedResume;
  if (!resume) {
    readyCard.hidden = true;
    return;
  }

  readyCard.hidden = currentSession.status !== "resume_normalized";
  confidenceValue.textContent = resume.extraction?.confidence || "Unknown";
  skillsCount.textContent = String(resume.skills?.length || 0);
  workCount.textContent = String(resume.workEntries?.length || 0);
}

function renderClarifications(currentSession) {
  clarificationList.replaceChildren();
  const pending = (currentSession.clarifications || []).filter(
    (item) => item.status === "pending",
  );

  clarificationCard.hidden = pending.length === 0;

  for (const item of pending) {
    const form = document.createElement("form");
    form.className = "clarification-form";

    const label = document.createElement("label");
    label.setAttribute("for", `clarification-${item.id}`);
    label.textContent = item.prompt;

    const input = document.createElement("input");
    input.id = `clarification-${item.id}`;
    input.name = "value";
    input.autocomplete = "off";
    input.placeholder = "e.g. 2024 or Present";
    input.required = true;

    const help = document.createElement("p");
    help.className = "muted";
    help.textContent =
      "We only ask because this date could materially change how your work history is understood.";

    const submit = document.createElement("button");
    submit.className = "primary";
    submit.type = "submit";
    submit.textContent = "Confirm date";

    form.append(label, input, help, submit);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearError();
      submit.disabled = true;

      try {
        const payload = await request(
          `/api/sessions/${encodeURIComponent(currentSession.id)}/resume/clarifications/${encodeURIComponent(item.id)}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ value: input.value }),
          },
        );
        session = payload.session;
        renderSession(session);
        announce("CV detail confirmed.");
      } catch (error) {
        showError(error);
      } finally {
        submit.disabled = false;
      }
    });

    clarificationList.append(form);
  }
}

function renderSession(currentSession) {
  session = currentSession;
  renderClarifications(currentSession);
  renderReady(currentSession);

  if (currentSession.status === "resume_received") {
    setProcessing(true);
    startPolling();
    return;
  }

  setProcessing(false);
  stopPolling();

  if (currentSession.status === "clarification_required") {
    announce("Your CV was read. One detail needs confirmation.");
  } else if (currentSession.status === "resume_normalized") {
    announce("Your CV is ready for analysis.");
  }
}

function startPolling() {
  if (pollTimer || !session) return;

  pollTimer = window.setInterval(async () => {
    try {
      const payload = await request(
        `/api/sessions/${encodeURIComponent(session.id)}`,
      );
      renderSession(payload.session);
    } catch (error) {
      stopPolling();
      showError(error);
    }
  }, 1200);
}

function stopPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  selectedFile.textContent = file
    ? `Selected: ${file.name}`
    : "No file selected.";
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const file = fileInput.files?.[0];
  if (!file) {
    showError({
      message: "Choose a PDF or DOCX before continuing.",
      preservedState: "session",
      nextActions: ["Choose a file and try again."],
    });
    fileInput.focus();
    return;
  }

  if (!session) {
    try {
      await restoreSession();
    } catch (error) {
      showError(error);
      return;
    }
  }

  activeUploadController = new AbortController();
  setProcessing(true);
  announce("Upload started. Reading your CV.");

  try {
    const payload = await request(
      `/api/sessions/${encodeURIComponent(session.id)}/resume`,
      {
        method: "POST",
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
        signal: activeUploadController.signal,
      },
    );

    session = payload.session;
    renderSession(session);
  } catch (error) {
    if (error?.name === "AbortError") {
      announce("Upload stopped.");
    } else {
      showError(error);
    }
    setProcessing(false);
  } finally {
    activeUploadController = null;
  }
});

cancelButton.addEventListener("click", async () => {
  if (!session || !activeUploadController) return;

  cancelButton.disabled = true;
  try {
    await fetch(
      `/api/sessions/${encodeURIComponent(session.id)}/resume/cancel`,
      { method: "POST" },
    );
  } finally {
    activeUploadController.abort();
    activeUploadController = null;
    cancelButton.disabled = false;
    setProcessing(false);
    announce(
      "Upload stopped. Your previous completed CV state, if any, is unchanged.",
    );
  }
});

restoreSession()
  .then((restored) => renderSession(restored))
  .catch((error) => showError(error));
