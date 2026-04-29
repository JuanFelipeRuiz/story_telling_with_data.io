// Script execution helper for dynamically loaded fragments
function executeScriptsIn(container) {
  container.querySelectorAll("script").forEach(oldScript => {
    if (oldScript.dataset && oldScript.dataset.executed === "true") return;
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    if (!newScript.src) newScript.textContent = oldScript.textContent;
    newScript.dataset.executed = "true";
    oldScript.replaceWith(newScript);
  });
}

// Ensure page starts at top on load
window.addEventListener('load', () => {
  if (!location.hash) {
    window.scrollTo(0, 0);
  }
});

